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

export function chUserDashboardInvalidate(userId: string): string {
  return `user.dashboard.invalidate.${userId}`;
}

export function chUserRecommendationsReady(userId: string): string {
  return `user.recommendations.ready.${userId}`;
}

export const CH_GLOBAL_ACTIVITY = "global.activity";
export const CH_GLOBAL_TRENDING_INVALIDATE = "global.trending.invalidate";

export async function publishJson(
  channel: string,
  payload: unknown
): Promise<number> {
  console.log("Publishing to channel:", channel, "with payload:", payload);
  return redisPub.publish(channel, JSON.stringify(payload));
}
