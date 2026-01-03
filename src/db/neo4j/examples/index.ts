/**
 * Neo4j Examples Cookbook (Production Patterns)
 *
 * This file shows canonical patterns for:
 * - driver.executeQuery() (best for single statements)
 * - session.executeRead/executeWrite (best for multi-step transactions)
 * - MERGE-based idempotent writes (safe with retries)
 * - parameter usage and result extraction
 *
 * Assumes you have:
 * - src/db/neo4j/driver.ts
 * - src/db/neo4j/query.ts
 */

import neo4j from "neo4j-driver";
import type { ManagedTransaction } from "neo4j-driver";

import {
  getNeo4jDriver,
  getNeo4jDatabaseName,
  isNeo4jTransientError,
} from "../driver.js";

import {
  executeRead,
  executeWrite,
  firstRecordOrNull,
  firstValueOrNull,
  runRead,
  runWrite,
  toNumber,
  eager,
  type EagerResult,
  type CypherParams,
  type TxConfig,
} from "../query.js";

/**
 * ------------------------------------------------------------
 * 0) Helper: driver.executeQuery wrapper (recommended default)
 * ------------------------------------------------------------
 *
 * Neo4j v5+ driver supports executeQuery(), which handles
 * session + transaction behind the scenes and returns eager
 * { records, summary }.
 *
 * This is the cleanest method for most single-statement reads/writes.
 */
export async function executeQuery(
  cypher: string,
  params: CypherParams = {},
  opts: { database?: string } = {}
): Promise<EagerResult> {
  const driver = getNeo4jDriver();
  const database = opts.database ?? getNeo4jDatabaseName();

  const res = await driver.executeQuery(cypher, params, { database });

  // executeQuery returns { records, summary } (already eager)
  return res as unknown as EagerResult;
}

/**
 * ------------------------------------------------------------
 * 1) Single-statement READ (recommended): executeQuery
 * ------------------------------------------------------------
 */
export async function example_read_single_executeQuery() {
  const res = await executeQuery(
    `
    MATCH (p:Person)
    RETURN count(p) AS c
    `
  );

  const c = firstValueOrNull(res, "c");
  const count = c == null ? 0 : toNumber(c);

  return count;
}

/**
 * ------------------------------------------------------------
 * 2) Single-statement WRITE (recommended): executeQuery
 * ------------------------------------------------------------
 *
 * This is safe if your statement is idempotent (MERGE-based).
 */
export async function example_write_single_executeQuery() {
  const personId = "person:john";
  const canonicalName = "John Bell";

  await executeQuery(
    `
    MERGE (p:Person {personId: $personId})
    ON CREATE SET
      p.canonicalName = $canonicalName,
      p.createdAt = datetime()
    ON MATCH SET
      p.canonicalName = $canonicalName,
      p.updatedAt = datetime()
    `,
    { personId, canonicalName }
  );
}

/**
 * ------------------------------------------------------------
 * 3) Multi-step WRITE transaction (recommended): executeWrite
 * ------------------------------------------------------------
 *
 * Use this when you need atomicity across multiple statements.
 */
export async function example_write_transaction() {
  const personId = "person:john";
  const roleId = "role:ceo";
  const orgId = "org:acme";

  await executeWrite(async (tx) => {
    await tx.run(
      `
      MERGE (p:Person {personId: $personId})
      ON CREATE SET p.createdAt = datetime()
      `,
      { personId }
    );

    await tx.run(
      `
      MERGE (r:Role {roleId: $roleId})
      ON CREATE SET r.canonicalName = "CEO", r.createdAt = datetime()
      `,
      { roleId }
    );

    await tx.run(
      `
      MERGE (o:Organization {orgId: $orgId})
      ON CREATE SET o.canonicalName = "Acme", o.createdAt = datetime()
      `,
      { orgId }
    );

    // Relationship upsert pattern
    await tx.run(
      `
      MATCH (p:Person {personId: $personId})
      MATCH (o:Organization {orgId: $orgId})
      MERGE (p)-[r:HOLDS_ROLE_AT]->(o)
      ON CREATE SET r.createdAt = datetime(), r.isCurrent = true
      ON MATCH SET r.updatedAt = datetime()
      SET r.roleId = $roleId
      `,
      { personId, orgId, roleId }
    );
  });
}

/**
 * ------------------------------------------------------------
 * 4) Multi-step READ transaction (recommended): executeRead
 * ------------------------------------------------------------
 *
 * Useful when you want consistent reads across multiple statements.
 */
export async function example_read_transaction() {
  return executeRead(async (tx) => {
    const peopleRes = await eager(
      tx.run(
        `
        MATCH (p:Person)
        RETURN p.personId AS personId, p.canonicalName AS canonicalName
        ORDER BY p.canonicalName ASC
        LIMIT 25
        `
      )
    );

    const orgRes = await eager(
      tx.run(
        `
        MATCH (o:Organization)
        RETURN o.orgId AS orgId, o.canonicalName AS canonicalName
        ORDER BY o.canonicalName ASC
        LIMIT 25
        `
      )
    );

    const people = peopleRes.records.map((r) => ({
      personId: r.get("personId"),
      canonicalName: r.get("canonicalName"),
    }));

    const orgs = orgRes.records.map((r) => ({
      orgId: r.get("orgId"),
      canonicalName: r.get("canonicalName"),
    }));

    return { people, orgs };
  });
}

/**
 * ------------------------------------------------------------
 * 5) Batch upsert using UNWIND (high throughput)
 * ------------------------------------------------------------
 *
 * Great for ingestion: write many nodes/relationships in one statement.
 */
export async function example_batch_upsert_people() {
  const rows = [
    { personId: "person:a", canonicalName: "Alice" },
    { personId: "person:b", canonicalName: "Bob" },
    { personId: "person:c", canonicalName: "Carol" },
  ];

  await executeQuery(
    `
    UNWIND $rows AS row
    MERGE (p:Person {personId: row.personId})
    ON CREATE SET p.createdAt = datetime()
    SET p.canonicalName = row.canonicalName,
        p.updatedAt = datetime()
    `,
    { rows }
  );
}

/**
 * ------------------------------------------------------------
 * 6) Write patterns: relationship batch create/upsert
 * ------------------------------------------------------------
 */
export async function example_batch_relationships() {
  const edges = [
    { personId: "person:a", orgId: "org:acme", roleId: "role:ceo" },
    { personId: "person:b", orgId: "org:acme", roleId: "role:cso" },
  ];

  await executeQuery(
    `
    UNWIND $edges AS edge
    MERGE (p:Person {personId: edge.personId})
    MERGE (o:Organization {orgId: edge.orgId})
    MERGE (p)-[r:HOLDS_ROLE_AT]->(o)
    SET r.roleId = edge.roleId,
        r.updatedAt = datetime()
    `,
    { edges }
  );
}

/**
 * ------------------------------------------------------------
 * 7) Parameter usage examples (including lists)
 * ------------------------------------------------------------
 */
export async function example_params() {
  const ids = ["person:a", "person:b", "person:c"];

  const res = await executeQuery(
    `
    MATCH (p:Person)
    WHERE p.personId IN $ids
    RETURN p.personId AS id, p.canonicalName AS name
    ORDER BY name ASC
    `,
    { ids }
  );

  return res.records.map((r) => ({
    id: r.get("id"),
    name: r.get("name"),
  }));
}

/**
 * ------------------------------------------------------------
 * 8) Using txConfig (timeout + metadata)
 * ------------------------------------------------------------
 *
 * Only use if you need timeouts/metadata. Otherwise ignore.
 * Your TxConfig is our custom runtime-compatible type.
 */
export async function example_txConfig_timeout() {
  const txConfig: TxConfig = {
    timeout: 5_000, // 5 seconds
    metadata: { requestId: "req_123", kind: "analytics" },
  };

  const res = await runRead(
    `
    MATCH (p:Person)
    RETURN count(p) AS c
    `,
    {},
    { txConfig }
  );

  const c = firstValueOrNull(res, "c");
  return c == null ? 0 : toNumber(c);
}

/**
 * ------------------------------------------------------------
 * 9) Handling Neo4j integers + dates
 * ------------------------------------------------------------
 */
export async function example_integer_and_datetime() {
  const res = await executeQuery(`
    RETURN
      42 AS n,
      datetime() AS now
  `);

  const r = res.records[0];
  const n = r.get("n"); // number
  const now = r.get("now"); // Neo4j DateTime object

  return {
    n: typeof n === "number" ? n : toNumber(n),
    nowIso: now?.toString?.() ?? String(now),
  };
}

/**
 * ------------------------------------------------------------
 * 10) Error handling + retryable detection
 * ------------------------------------------------------------
 *
 * Note: driver.executeQuery and executeRead/executeWrite already do some retrying.
 * Use this if you want custom handling/logging.
 */
export async function example_error_handling() {
  try {
    await executeQuery(`RETURN 1 AS ok`);
  } catch (err) {
    if (isNeo4jTransientError(err)) {
      console.warn("Transient error (safe to retry):", err);
      // you could retry here if you want (but driver usually already does)
    } else {
      console.error("Non-transient Neo4j error:", err);
      throw err;
    }
  }
}

/**
 * ------------------------------------------------------------
 * 11) Idempotent writes (MERGE) vs non-idempotent (CREATE)
 * ------------------------------------------------------------
 *
 * Use MERGE for ingestion because transactions may retry.
 */
export async function example_idempotent_write() {
  await executeQuery(
    `
    MERGE (c:Compound {compoundId: $compoundId})
    ON CREATE SET c.createdAt = datetime()
    SET c.canonicalName = $canonicalName
    `,
    { compoundId: "compound:vitamin_c", canonicalName: "Vitamin C" }
  );
}

/**
 * ------------------------------------------------------------
 * 12) Pattern: Create a Chunk and connect via ABOUT / MENTIONS / WRITTEN_BY
 * ------------------------------------------------------------
 *
 * Using your standardized unstructured text relationships:
 * - ABOUT
 * - SUPPORTED_BY
 * - MENTIONS
 * - WRITTEN_BY
 *
 * Example: a Chunk mentions a Compound and is written by a Person.
 */
export async function example_chunk_graph() {
  const chunkId = "chunk:001";
  const personId = "person:john";
  const compoundId = "compound:vitamin_c";

  await executeWrite(async (tx) => {
    await tx.run(
      `
      MERGE (c:Chunk {chunkId: $chunkId})
      ON CREATE SET c.createdAt = datetime()
      SET c.text = $text,
          c.updatedAt = datetime()
      `,
      { chunkId, text: "Vitamin C may support immune function." }
    );

    await tx.run(
      `
      MERGE (p:Person {personId: $personId})
      ON CREATE SET p.createdAt = datetime()
      SET p.canonicalName = $canonicalName
      `,
      { personId, canonicalName: "John Bell" }
    );

    await tx.run(
      `
      MERGE (cmp:Compound {compoundId: $compoundId})
      ON CREATE SET cmp.createdAt = datetime()
      SET cmp.canonicalName = $compoundName
      `,
      { compoundId, compoundName: "Vitamin C" }
    );

    // Chunk WRITTEN_BY Person
    await tx.run(
      `
      MATCH (c:Chunk {chunkId: $chunkId})
      MATCH (p:Person {personId: $personId})
      MERGE (c)-[r:WRITTEN_BY]->(p)
      SET r.confidence = 0.95,
          r.role = "author",
          r.attributionMethod = "platform_metadata",
          r.asOf = datetime(),
          r.extractorVersion = "author_linker_v1"
      `,
      { chunkId, personId }
    );

    // Chunk MENTIONS Compound
    await tx.run(
      `
      MATCH (c:Chunk {chunkId: $chunkId})
      MATCH (cmp:Compound {compoundId: $compoundId})
      MERGE (c)-[m:MENTIONS]->(cmp)
      SET m.confidence = 0.90,
          m.surfaceForm = "Vitamin C",
          m.span = {start: 0, end: 9},
          m.linkingMethod = "llm_linker",
          m.asOf = datetime(),
          m.extractorVersion = "mention_linker_v2"
      `,
      { chunkId, compoundId }
    );

    // Chunk ABOUT Compound (more “topic” than surface mention)
    await tx.run(
      `
      MATCH (c:Chunk {chunkId: $chunkId})
      MATCH (cmp:Compound {compoundId: $compoundId})
      MERGE (c)-[a:ABOUT]->(cmp)
      SET a.relevance = 0.88,
          a.asOf = datetime(),
          a.extractorVersion = "about_linker_v1"
      `,
      { chunkId, compoundId }
    );
  });
}

/**
 * ------------------------------------------------------------
 * 13) Pattern: ClaimOccurrence -> SUPPORTED_BY -> Chunk (transcript grounding)
 * ------------------------------------------------------------
 *
 * Example: a claim occurrence is supported by a transcript chunk.
 */
export async function example_claim_supported_by_chunk() {
  const claimOccurrenceId = "claimOcc:001";
  const chunkId = "chunk:transcript:123";
  const claimId = "claim:immune_support_vitamin_c";

  await executeWrite(async (tx) => {
    await tx.run(
      `
      MERGE (co:ClaimOccurrence {claimOccurrenceId: $claimOccurrenceId})
      ON CREATE SET co.createdAt = datetime()
      SET co.startSec = 12,
          co.endSec = 22,
          co.confidence = 0.92,
          co.salienceScore = 0.75
      `,
      { claimOccurrenceId }
    );

    await tx.run(
      `
      MERGE (c:Claim {claimId: $claimId})
      ON CREATE SET c.createdAt = datetime()
      SET c.claimKind = "causal",
          c.claimText = "Vitamin C supports immune function"
      `,
      { claimId }
    );

    await tx.run(
      `
      MERGE (ch:Chunk {chunkId: $chunkId})
      ON CREATE SET ch.createdAt = datetime()
      SET ch.text = $text
      `,
      {
        chunkId,
        text: "Vitamin C supports immune function ... (transcript excerpt)",
      }
    );

    // occurrence INSTANCE_OF claim
    await tx.run(
      `
      MATCH (co:ClaimOccurrence {claimOccurrenceId: $claimOccurrenceId})
      MATCH (c:Claim {claimId: $claimId})
      MERGE (co)-[r:INSTANCE_OF]->(c)
      SET r.normalizationConfidence = 0.93
      `,
      { claimOccurrenceId, claimId }
    );

    // occurrence SUPPORTED_BY Chunk
    await tx.run(
      `
      MATCH (co:ClaimOccurrence {claimOccurrenceId: $claimOccurrenceId})
      MATCH (ch:Chunk {chunkId: $chunkId})
      MERGE (co)-[s:SUPPORTED_BY]->(ch)
      SET s.quoteSpanOffsets = {start: 0, end: 42},
          s.asOf = datetime(),
          s.extractorVersion = "transcript_grounder_v1"
      `,
      { claimOccurrenceId, chunkId }
    );
  });
}

/**
 * ------------------------------------------------------------
 * 14) Pattern: Evidence assessment supported by external chunks
 * ------------------------------------------------------------
 *
 * ClaimAssessment -SUPPORTED_BY-> Chunk (evidence from papers, guidelines, etc.)
 */
export async function example_assessment_supported_by_evidence_chunks() {
  const assessmentId = "assessment:001";
  const claimId = "claim:immune_support_vitamin_c";
  const evidenceChunkId = "chunk:paper:pmid123";

  await executeWrite(async (tx) => {
    await tx.run(
      `
      MERGE (a:ClaimAssessment {assessmentId: $assessmentId})
      ON CREATE SET a.createdAt = datetime()
      SET a.asOf = date(),
          a.verdict = "mixed",
          a.confidence = "medium",
          a.rationaleSummary = "Some evidence for deficiency populations; unclear for general population",
          a.assessedBy = "human",
          a.framework = "GRADE_like"
      `,
      { assessmentId }
    );

    await tx.run(
      `
      MERGE (c:Claim {claimId: $claimId})
      ON CREATE SET c.createdAt = datetime()
      SET c.claimText = "Vitamin C supports immune function"
      `,
      { claimId }
    );

    await tx.run(
      `
      MERGE (ch:Chunk {chunkId: $evidenceChunkId})
      ON CREATE SET ch.createdAt = datetime()
      SET ch.sourceType = "paper",
          ch.text = $text,
          ch.url = $url
      `,
      {
        evidenceChunkId,
        text: "Paper summary excerpt...",
        url: "https://pubmed.ncbi.nlm.nih.gov/123/",
      }
    );

    await tx.run(
      `
      MATCH (a:ClaimAssessment {assessmentId: $assessmentId})
      MATCH (c:Claim {claimId: $claimId})
      MERGE (a)-[:ASSESSES]->(c)
      `,
      { assessmentId, claimId }
    );

    await tx.run(
      `
      MATCH (a:ClaimAssessment {assessmentId: $assessmentId})
      MATCH (ch:Chunk {chunkId: $evidenceChunkId})
      MERGE (a)-[s:SUPPORTED_BY]->(ch)
      SET s.stance = "mixed",
          s.strength = "moderate",
          s.asOf = datetime()
      `,
      { assessmentId, evidenceChunkId }
    );
  });
}
