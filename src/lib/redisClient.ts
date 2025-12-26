import { createClient, type RedisClientType } from "redis";

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";

export const redis: RedisClientType = createClient({
  url: REDIS_URL,
});

redis.on("connect", () => {
  console.log("Redis connected");
});

redis.on("error", (err) => {
  console.error("REDIS ERROR", err);
});

export async function initRedis(): Promise<void> {
  if (!redis.isOpen) {
    await redis.connect();
  }
}
