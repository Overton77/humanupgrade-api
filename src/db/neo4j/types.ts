import { Record as Neo4jRecord } from "neo4j-driver";

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

export type ExecuteOpts = {
  database?: string;
  txConfig?: TxConfig;
};