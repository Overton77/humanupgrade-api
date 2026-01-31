// src/graphql/resolvers/embeddingMutations.ts

import { enqueueEmbeddingJob, ensureEmbeddingConsumerGroup } from "../../embeddings/embeddingQueue.js";
import { publishEmbeddingJobEvent } from "../../embeddings/embeddingEvents.js";
import { UpsertEmbeddingInput } from "../inputs/EmbeddingInputs.js";
import { UpsertEmbeddingResult } from "../types/EmbeddingModel.js";
import { EmbeddingJobStatusEnum } from "../enums/index.js";
import { GraphQLContext } from "../context.js";

function nowIso(): string {
  return new Date().toISOString();
}

export const EmbeddingMutations = {
  upsertEmbedding: async (
    _: unknown,
    args: { input: UpsertEmbeddingInput },
    ctx: GraphQLContext
  ): Promise<UpsertEmbeddingResult> => {
    const { targetType, targetId, force = false, requestId } = args.input;

    await ensureEmbeddingConsumerGroup();
    const jobId = await enqueueEmbeddingJob({
      targetType,
      targetId,
      force,
      requestId: requestId ?? null,
      userId: null, // TODO: add user to GraphQLContext when auth is implemented
    });

    await publishEmbeddingJobEvent({
      targetType,
      targetId,
      status: "QUEUED",
      jobId,
      requestId: requestId ?? null,
      message: "Embedding job queued",
      updatedAt: nowIso(),
    });

    return {
      targetType,
      targetId,
      status: "QUEUED",
      jobId,
      message: "Queued",
    };
  },

  upsertEmbeddings: async (
    _: unknown,
    args: { inputs: UpsertEmbeddingInput[] },
    ctx: GraphQLContext
  ): Promise<UpsertEmbeddingResult[]> => {
    await ensureEmbeddingConsumerGroup();

    const results: UpsertEmbeddingResult[] = [];
    for (const input of args.inputs) {
      const { targetType, targetId, force = false, requestId } = input;

      const jobId = await enqueueEmbeddingJob({
        targetType,
        targetId,
        force,
        requestId: requestId ?? null,
        userId: null, // TODO: add user to GraphQLContext when auth is implemented
      });

      await publishEmbeddingJobEvent({
        targetType,
        targetId,
        status: "QUEUED",
        jobId,
        requestId: requestId ?? null,
        message: "Embedding job queued",
        updatedAt: nowIso(),
      });

      results.push({
        targetType,
        targetId,
        status: "QUEUED",
        jobId,
        message: "Queued",
      });
    }
    return results;
  },
};
