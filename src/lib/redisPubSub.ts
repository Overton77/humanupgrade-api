import { createClient, type RedisClientType } from "redis";
import { env } from "../config/env.js";

export const redisPub: RedisClientType = createClient({
  url: env.redisUrl,
});

export const redisSub: RedisClientType = createClient({
  url: env.redisUrl,
});

redisPub.on("connect", () => console.log("Redis publisher connected"));
redisSub.on("connect", () => console.log("Redis subscriber connected"));

redisPub.on("error", (err) => console.error("REDIS PUB ERROR", err));
redisSub.on("error", (err) => console.error("REDIS SUB ERROR", err));

export async function initRedisPubSub(): Promise<void> {
  if (!redisPub.isOpen) await redisPub.connect();

  if (!redisSub.isOpen) await redisSub.connect();
}

export function chUserActivity(userId: string): string {
  return `user.activity.${userId}`;
} 

export function chEmbeddingJobEvents(targetType: string, targetId?: string): string {
  return targetId
    ? `embedding.job.${targetType}.${targetId}`
    : `embedding.job.${targetType}`;
}

export function chUserDashboardInvalidate(userId: string): string {
  return `user.dashboard.invalidate.${userId}`;
}

export function chUserRecommendationsReady(userId: string): string {
  return `user.recommendations.ready.${userId}`;
}

/**
 * Channel for document ingestion notifications.
 * Unique per documentId.
 */
export function chDocumentIngested(documentId: string): string { 
  return `document.ingested.${documentId}`; 
}   

/**
 * Pattern channel for subscribing to all document ingestion events.
 * Use with Redis pSubscribe for pattern matching.
 */
export const CH_PATTERN_DOCUMENT_INGESTED = "document.ingested.*";

/**
 * Channel for document text version bundle ingestion notifications.
 * Unique per documentTextVersionId.
 */
export function chDocumentTextVersionBundleIngested(documentTextVersionId: string): string { 
  return `document.text.version.bundle.ingested.${documentTextVersionId}`; 
}  

/**
 * Pattern channel for subscribing to all document text version bundle ingestion events.
 * Use with Redis pSubscribe for pattern matching.
 */
export const CH_PATTERN_DOCUMENT_TEXT_VERSION_BUNDLE_INGESTED = "document.text.version.bundle.ingested.*";

/**
 * Channel for evidence edge upsert notifications.
 * Uses relKey as the unique identifier (deterministic key for each edge).
 * This ensures each edge has a unique channel for subscription purposes.
 */
export function chEvidenceEdgeUpserted(relKey: string): string {  
  return `evidence.edge.upserted.${relKey}`; 
}

/**
 * Pattern channel for subscribing to all evidence edge upsert events.
 * Use with Redis pSubscribe for pattern matching.
 */
export const CH_PATTERN_EVIDENCE_EDGE_UPSERTED = "evidence.edge.upserted.*";   

export const CH_GLOBAL_ACTIVITY = "global.activity";
export const CH_GLOBAL_TRENDING_INVALIDATE = "global.trending.invalidate";  






export async function publishJson(
  channel: string,
  payload: unknown
): Promise<number> {
  console.log("Publishing to channel:", channel, "with payload:", payload);
  return redisPub.publish(channel, JSON.stringify(payload));
}
