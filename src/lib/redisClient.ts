import { createClient, type RedisClientType } from "redis";
import { env } from "../config/env.js";

export const redis: RedisClientType = createClient({
  url: env.redisUrl,
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
