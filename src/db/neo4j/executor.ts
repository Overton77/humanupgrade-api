import neo4j from "neo4j-driver";
import type {
  ManagedTransaction,
  Record as Neo4jRecord,
  Result,
  Session,
} from "neo4j-driver";
import { getNeo4jDatabaseName, getNeo4jDriver } from "./driver.js";
import type { EagerResult, ExecuteOpts, CypherParams } from "./types.js";



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

