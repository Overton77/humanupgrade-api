import neo4j from "neo4j-driver";
import type {
  ManagedTransaction,
  Record as Neo4jRecord,
  Result,
  Session,
} from "neo4j-driver";
import { getNeo4jDatabaseName, getNeo4jDriver } from "./driver.js";

export type CypherParams = Record<string, unknown>;

/**
 * Neo4j driver v6:
 * - tx.run() returns a lazy Result (stream)
 * - awaiting that Result resolves to { records, summary }
 * See Result.then(...) docs.
 */
export type EagerResult = {
  records: Neo4jRecord[];
  summary: unknown;
};

/**
 * We intentionally define our own TxConfig because TransactionConfig
 * is not consistently exported in the v6.0.1 TS surface.
 *
 * Docs: transaction config supports timeout + metadata. :contentReference[oaicite:4]{index=4}
 */
export type TxConfig = {
  timeout?: number; // ms
  metadata?: Record<string, unknown>;
};

type ExecuteOpts = {
  database?: string;
  txConfig?: TxConfig;
};

/**
 * Convert Neo4j lazy Result -> eager {records, summary}
 */
export async function eager(result: Result): Promise<EagerResult> {
  return (await result) as unknown as EagerResult;
}

export async function executeRead<T>(
  work: (tx: ManagedTransaction) => Promise<T>,
  opts: ExecuteOpts = {}
): Promise<T> {
  const driver = getNeo4jDriver();
  const session = driver.session({
    database: opts.database ?? getNeo4jDatabaseName(),
    defaultAccessMode: neo4j.session.READ,
  });

  try {
    // session.executeRead accepts a txConfig, but since we’re using a custom type,
    // we only pass it if present and rely on runtime compatibility.
    // (timeout + metadata are the supported keys)
    // If you don’t use txConfig, remove it entirely.
    return await session.executeRead(work, opts.txConfig);
  } finally {
    await session.close();
  }
}

export async function executeWrite<T>(
  work: (tx: ManagedTransaction) => Promise<T>,
  opts: ExecuteOpts = {}
): Promise<T> {
  const driver = getNeo4jDriver();
  const session = driver.session({
    database: opts.database ?? getNeo4jDatabaseName(),
    defaultAccessMode: neo4j.session.WRITE,
  });

  try {
    return await session.executeWrite(work, opts.txConfig);
  } finally {
    await session.close();
  }
}

/**
 * Single-statement helpers that return eager results.
 * This avoids all `.records` typing issues.
 */
export async function runRead(
  cypher: string,
  params: CypherParams = {},
  opts: ExecuteOpts = {}
): Promise<EagerResult> {
  return executeRead(async (tx) => eager(tx.run(cypher, params)), opts);
}

export async function runWrite(
  cypher: string,
  params: CypherParams = {},
  opts: ExecuteOpts = {}
): Promise<EagerResult> {
  return executeWrite(async (tx) => eager(tx.run(cypher, params)), opts);
}

/**
 * Eager-result helpers
 */
export function firstRecordOrNull(result: EagerResult): Neo4jRecord | null {
  return result.records.length > 0 ? result.records[0] : null;
}

export function firstValueOrNull<T = unknown>(
  result: EagerResult,
  key: string
): T | null {
  const rec = firstRecordOrNull(result);
  if (!rec) return null;
  return (rec.get(key) as T) ?? null;
}

/**
 * Neo4j Integer -> JS number
 */
export function toNumber(value: unknown): number {
  if (neo4j.isInt(value)) return value.toNumber();
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  throw new Error(`Cannot convert value to number: ${String(value)}`);
}
