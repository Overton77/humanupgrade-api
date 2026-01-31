// src/graphql/resolvers/subscriptions.ts

import { RedisAsyncIterator } from "../subscriptions/redisAsyncIterator.js";
import { chEmbeddingJobEvents } from "../../lib/redisPubSub.js";
import type { EmbeddingTargetType } from "../enums/index.js";
import type { EmbeddingJobEvent } from "../types/EmbeddingModel.js";

export const Subscriptions = {
  embeddingJobEvents: {
    subscribe: (
      _: unknown,
      args: { targetType: EmbeddingTargetType; targetID?: string | null }
    ) => {
      const { targetType, targetID: targetId } = args;

      const channels = targetId
        ? [
            chEmbeddingJobEvents(targetType, targetId),
            chEmbeddingJobEvents(targetType), // optional: include type-wide
          ]
        : [chEmbeddingJobEvents(targetType)];

      return new RedisAsyncIterator(channels);
    },
    resolve: (payload: EmbeddingJobEvent): EmbeddingJobEvent => payload,
  },
};
