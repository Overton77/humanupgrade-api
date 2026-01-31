// src/workers/embedding.worker.ts
// Worker script to process embedding jobs from Redis stream

import { connectToDatabase } from "../../db/connection.js";
import { initRedis } from "../../lib/redisClient.js";
import { initRedisPubSub } from "../../lib/redisPubSub.js";
import { runEmbeddingWorkerForever } from "./embeddingWorker.js";
import { env } from "../../config/env.js";
import { logger } from "../../lib/logger.js";

async function main() {
  try {
    logger.info("Starting embedding worker...");
    
    // Initialize database connection
    await connectToDatabase(env.dbName);
    logger.info("✓ Database connected");

    // Initialize Redis
    await initRedis();
    logger.info("✓ Redis connected");

    // Initialize Redis PubSub (for publishing events)
    await initRedisPubSub();
    logger.info("✓ Redis PubSub initialized");

    // Start the worker (runs forever)
    logger.info("✓ Starting embedding worker...");
    await runEmbeddingWorkerForever();
  } catch (error) {
    logger.error("Failed to start embedding worker", error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  logger.info("Received SIGINT, shutting down gracefully...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  logger.info("Received SIGTERM, shutting down gracefully...");
  process.exit(0);
});

main();

