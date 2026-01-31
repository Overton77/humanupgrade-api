// src/embeddings/embeddingEvents.ts

import { publishJson, chEmbeddingJobEvents } from "../lib/redisPubSub.js";
import type { EmbeddingJobEvent } from "../graphql/types/EmbeddingModel.js";

export async function publishEmbeddingJobEvent(evt: EmbeddingJobEvent): Promise<void> {
  // publish to both:
  // - per-target channel (UI can subscribe tightly)
  // - per-type channel (admin dashboards)
  await publishJson(chEmbeddingJobEvents(evt.targetType, evt.targetId), evt);
  await publishJson(chEmbeddingJobEvents(evt.targetType), evt);
}
