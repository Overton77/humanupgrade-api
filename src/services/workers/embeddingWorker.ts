// src/embeddings/embeddingWorker.ts

import crypto from "crypto";
import { redis } from "../../lib/redisClient.js"; // your shared redis connection
import { runRead, runWrite } from "../../db/neo4j/executor.js"; // adjust path
import { createOpenAIEmbedder } from "../../embeddings/openaiEmbedder.js";
import { EMBEDDING_CONFIG, buildSearchTextFromConfig, type EmbeddingTargetType } from "../../embeddings/embeddingConfig.js";
import {
  EMBEDDING_GROUP,
  EMBEDDING_STREAM,
  ensureEmbeddingConsumerGroup,
} from "../../embeddings/embeddingQueue.js";
import { publishEmbeddingJobEvent } from "../../embeddings/embeddingEvents.js";

function nowIso(): string {
  return new Date().toISOString();
}

type ParsedJob = {
  id: string;
  targetType: EmbeddingTargetType;
  targetId: string;
  force: boolean;
  requestId?: string | null;
  userId?: string | null;
};

function parseJob(id: string, fields: Record<string, string>): ParsedJob {
  const targetType = fields.targetType as EmbeddingTargetType;
  if (!targetType || !(targetType in EMBEDDING_CONFIG)) {
    throw new Error(`Unknown targetType: ${fields.targetType}`);
  }
  return {
    id,
    targetType,
    targetId: fields.targetId,
    force: fields.force === "1",
    requestId: fields.requestId || null,
    userId: fields.userId || null,
  };
}

export async function runEmbeddingWorkerForever(): Promise<void> {
  await ensureEmbeddingConsumerGroup();
  const consumer = `c-${crypto.randomBytes(6).toString("hex")}`;
  const embedder = createOpenAIEmbedder(); // default model

  // eslint-disable-next-line no-console
  console.log(`[embeddingWorker] consumer=${consumer} listening on ${EMBEDDING_STREAM}/${EMBEDDING_GROUP}`);

  while (true) {
    // Read new messages (">") from stream
    const res = await redis.xReadGroup(
      EMBEDDING_GROUP,
      consumer,
      [{ key: EMBEDDING_STREAM, id: ">" }],
      { COUNT: 10, BLOCK: 5000 }
    );

    if (!res) continue;

    for (const stream of res) {
      for (const msg of stream.messages) {
        const id = msg.id;
        const fields = msg.message as Record<string, string>;

        let job: ParsedJob | null = null;

        try {
          job = parseJob(id, fields);

          await publishEmbeddingJobEvent({
            targetType: job.targetType,
            targetId: job.targetId,
            status: "RUNNING",
            jobId: job.id,
            requestId: job.requestId ?? null,
            message: "Embedding job started",
            updatedAt: nowIso(),
          });

          const cfg = EMBEDDING_CONFIG[job.targetType];

          // 1) Read node properties needed for searchText + optional idempotency
          const readCypher = `
            MATCH (n:${cfg.label} { ${cfg.idProp}: $id })
            RETURN n AS node
            LIMIT 1
          `;
          const readRes = await runRead(readCypher, { id: job.targetId });
          if (readRes.records.length === 0) {
            await publishEmbeddingJobEvent({
              targetType: job.targetType,
              targetId: job.targetId,
              status: "FAILED",
              jobId: job.id,
              requestId: job.requestId ?? null,
              error: "Node not found",
              updatedAt: nowIso(),
            });
            await redis.xAck(EMBEDDING_STREAM, EMBEDDING_GROUP, id);
            continue;
          }

          const node = readRes.records[0].get("node");
          const props = (node && typeof node === "object" && "properties" in node)
            ? (node as any).properties
            : (node as any);

          // 2) Build searchText (server-controlled config)
          const searchText = buildSearchTextFromConfig(cfg, props);

          if (!searchText) {
            await publishEmbeddingJobEvent({
              targetType: job.targetType,
              targetId: job.targetId,
              status: "SKIPPED",
              jobId: job.id,
              requestId: job.requestId ?? null,
              message: "searchText empty; skipping embedding",
              updatedAt: nowIso(),
            });
            await redis.xAck(EMBEDDING_STREAM, EMBEDDING_GROUP, id);
            continue;
          }

          // Optional idempotency: skip if same model and text unchanged (requires storing hash)
          // You can add embeddingTextHash on node later; for now we keep it simple.

          // 3) Compute embedding
          const vec = await embedder.embed(searchText);

          // 4) Write back to Neo4j
          const writeCypher = `
            MATCH (n:${cfg.label} { ${cfg.idProp}: $id })
            SET n.${cfg.searchTextProp} = $searchText,
                n.${cfg.embeddingProp} = $embedding,
                n.${cfg.embeddingModelProp} = $embeddingModel,
                n.${cfg.embeddingUpdatedAtProp} = datetime(),
                n.${cfg.searchTextUpdatedAtProp} = datetime()
            RETURN n.${cfg.idProp} AS id
          `;

          await runWrite(writeCypher, {
            id: job.targetId,
            searchText,
            embedding: vec,
            embeddingModel: embedder.config.model,
          });

          await publishEmbeddingJobEvent({
            targetType: job.targetType,
            targetId: job.targetId,
            status: "COMPLETE",
            jobId: job.id,
            requestId: job.requestId ?? null,
            message: "Embedding computed and stored",
            updatedAt: nowIso(),
          });

          // 5) Ack message
          await redis.xAck(EMBEDDING_STREAM, EMBEDDING_GROUP, id);
        } catch (err: any) {
          const msg = String(err?.message ?? err);

          if (job) {
            await publishEmbeddingJobEvent({
              targetType: job.targetType,
              targetId: job.targetId,
              status: "FAILED",
              jobId: job.id,
              requestId: job.requestId ?? null,
              error: msg,
              updatedAt: nowIso(),
            });
          }

          // Ack anyway to prevent poison-pill loops in v1 (you can add DLQ later)
          await redis.xAck(EMBEDDING_STREAM, EMBEDDING_GROUP, id);
        }
      }
    }
  }
}
