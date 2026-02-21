import { runWrite } from "./executor.js"; 
import { buildSearchIndexStatements, type SearchIndexStatementsOpts } from "./searchIndexStatements.js";

export type EnsureSearchIndexesOpts = SearchIndexStatementsOpts & {
  /**
   * If true, vector index creation failures won't crash (useful if older Neo4j in dev).
   */
  tolerateVectorIndexErrors?: boolean;

  /**
   * If true, waits until all indexes are ONLINE.
   */
  awaitOnline?: boolean;

  /**
   * Max time to wait for ONLINE (ms).
   */
  awaitOnlineTimeoutMs?: number;
};

function isVectorDDL(cypher: string): boolean {
  return /^\s*CREATE\s+VECTOR\s+INDEX/i.test(cypher);
}

export async function ensureSearchIndexes(
  opts: EnsureSearchIndexesOpts
): Promise<void> {
  const statements = buildSearchIndexStatements(opts);

  for (const cypher of statements) {
    try {
      await runWrite(cypher);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);

      if (opts.tolerateVectorIndexErrors && isVectorDDL(cypher)) {
        // eslint-disable-next-line no-console
        console.warn(
          `[ensureSearchIndexes] Skipping vector index due to error: ${msg}\n${cypher}`
        );
        continue;
      }

      // eslint-disable-next-line no-console
      console.error(`[ensureSearchIndexes] Failed DDL:\n${cypher}\nError: ${msg}`);
      throw e;
    }
  }

  if (opts.awaitOnline) {
    await awaitIndexesOnline(opts.awaitOnlineTimeoutMs ?? 120_000);
  }
}

export async function awaitIndexesOnline(timeoutMs: number): Promise<void> {
  const started = Date.now();

  while (true) {
    const res = await runWrite(`
      SHOW INDEXES
      YIELD name, state
      RETURN count(*) AS total,
             sum(CASE WHEN state = 'ONLINE' THEN 1 ELSE 0 END) AS online
    `);

    const rec = res.records[0];
    const total = Number(rec.get("total"));
    const online = Number(rec.get("online"));

    if (total > 0 && online === total) return;

    if (Date.now() - started > timeoutMs) {
      throw new Error(`Timeout waiting for indexes ONLINE: ${online}/${total}`);
    }

    await new Promise((r) => setTimeout(r, 500));
  }
}