import neo4j, { Driver } from "neo4j-driver";
import type { Neo4jError } from "neo4j-driver";
import { env } from "../../config/env.js";

let driverSingleton: Driver | null = null;

export function getNeo4jDatabaseName(): string {
  return env.neo4jAuraDatabaseName;
}

export function getNeo4jDriver(): Driver {
  if (driverSingleton) return driverSingleton;

  driverSingleton = neo4j.driver(
    env.neo4jAuraURI,
    neo4j.auth.basic(env.neo4jAuraUsername, env.neo4jAuraPassword),
    {
      maxConnectionLifetime: 60 * 60 * 1000,
      connectionAcquisitionTimeout: 30 * 1000,
      maxTransactionRetryTime: 15 * 1000,
    }
  );

  return driverSingleton;
}

export async function verifyNeo4jConnectivity(): Promise<void> {
  const driver = getNeo4jDriver();
  await driver.verifyConnectivity();
}

export async function closeNeo4jDriver(): Promise<void> {
  if (!driverSingleton) return;
  await driverSingleton.close();
  driverSingleton = null;
}

let shutdownHooksAttached = false;

export function attachNeo4jShutdownHooks(): void {
  if (shutdownHooksAttached) return;
  shutdownHooksAttached = true;

  const shutdown = async (signal: string) => {
    try {
      console.log(`[neo4j] received ${signal}; closing driver...`);
      await closeNeo4jDriver();
      console.log("[neo4j] driver closed.");
    } catch (err) {
      console.error("[neo4j] error closing driver:", err);
    } finally {
      process.exit(0);
    }
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

/**
 * Utilities for detecting transient / retryable errors.
 *
 * Notes:
 * - Neo4jError class exists in neo4j-driver. :contentReference[oaicite:1]{index=1}
 * - Neo4j errors have `.code` like:
 *   - Neo.TransientError.*
 *   - Neo.ClientError.*
 *   - Neo.DatabaseError.*
 *
 * In v6, errors also have `retryable` boolean (preferred over custom parsing).
 */
export function isNeo4jTransientError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;

  const e = err as Partial<Neo4jError> & {
    retryable?: boolean;
    retriable?: boolean;
  };

  // Best signal if present (v6 includes retryable; retriable exists but deprecated). :contentReference[oaicite:2]{index=2}
  if (typeof e.retryable === "boolean") return e.retryable;
  if (typeof e.retriable === "boolean") return e.retriable;

  const code = e.code ?? "";
  return (
    code.startsWith("Neo.TransientError") ||
    code.includes("ServiceUnavailable") ||
    code.includes("SessionExpired")
  );
}
