// src/embeddings/embeddingQueue.ts

import { redis } from "../lib/redisClient.js"; 
import type { EmbeddingTargetType } from "../graphql/enums/index.js";

export const EMBEDDING_STREAM = "embedding.jobs";
export const EMBEDDING_GROUP = "embedding-workers";

export type EnqueueEmbeddingJobInput = {
  targetType: EmbeddingTargetType;
  targetId: string;
  force?: boolean;
  requestId?: string | null;
  // optional: who requested it (for routing events)
  userId?: string | null;
};

export async function ensureEmbeddingConsumerGroup(): Promise<void> {
  try {
    // Create stream + group if doesn't exist.
    // MKSTREAM creates the stream if absent.
    await redis.xGroupCreate(EMBEDDING_STREAM, EMBEDDING_GROUP, "0", {
      MKSTREAM: true,
    });
  } catch (e: any) {
    // BUSYGROUP means it already exists
    if (!String(e?.message ?? e).includes("BUSYGROUP")) throw e;
  }
}

export async function enqueueEmbeddingJob(
  job: EnqueueEmbeddingJobInput
): Promise<string> {
  const id = await redis.xAdd(
    EMBEDDING_STREAM,
    "*",
    {
      targetType: job.targetType,
      targetId: job.targetId,
      force: job.force ? "1" : "0",
      requestId: job.requestId ?? "",
      userId: job.userId ?? "",
    }
  );
  return id;
}
