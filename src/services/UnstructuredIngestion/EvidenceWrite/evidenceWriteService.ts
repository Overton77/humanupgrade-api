// ============================================================================
// Evidence Edge Write Service
// ============================================================================
//
// Connects Document / Chunk nodes to any entity node via
// ABOUT, MENTIONS, or IS_PRIMARY_SOURCE relationships.
//
// Key design decisions:
//  - Single `processEvidenceEdge` contains all per-edge logic and receives
//    the transaction, so both the single and batch entry-points share it.
//  - Target resolution runs *inside* the write transaction (no extra session).
//  - Source validation is handled by the edge-upsert MATCH itself (0 rows = not found).
//  - Source-type compatibility is enforced by the Zod discriminated union in
//    EvidenceEdgeInputSchema (MENTIONS requires Chunk, IS_PRIMARY_SOURCE requires Document).
//  - Batch upsertEvidenceEdges uses one executeWrite per edge for fault-isolation
//    (partial-success semantics: some edges may succeed while others fail).

import type { ManagedTransaction } from "neo4j-driver";
import { executeWrite } from "../../../db/neo4j/executor.js";
import { firstRecordOrNull } from "../../../db/neo4j/utils.js";
import { logger } from "../../../lib/logger.js";
import { validateInput } from "../../../lib/validation.js";
import { Errors } from "../../../lib/errors.js";
import type { EagerResult } from "../../../db/neo4j/types.js";
import {
  EvidenceEdgeInput,
  EvidenceEdgeInputSchema,
  UpsertEvidenceEdgesInput,
  UpsertEvidenceEdgesInputSchema,
} from "../../../graphql/inputs/EvidenceEdgeInputs.js";
import type { EvidenceSourceRef } from "../../../graphql/inputs/EvidenceEdgeInputs.js";
import {
  UpsertEvidenceEdgeResult,
  UpsertEvidenceEdgesResult,
  UpsertEvidenceEdgesCounts,
  UpsertEvidenceEdgeError,
} from "../../../graphql/types/EvidenceEdgeResultModels.js";
import { resolveTargetNode } from "./utils/resolveTargetNode.js";
import { getIdFieldForLabel } from "./utils/nodeLabelMapping.js";
import {
  buildUpsertEvidenceEdgeCypher,
  generateRelKey,
} from "./statements/writeEvidenceEdgesStatements.js";

// ============================================================================
// Helpers
// ============================================================================

/** Extract the canonical ID string from an EvidenceSourceRef discriminated union. */
function getSourceId(source: EvidenceSourceRef): string {
  return source.kind === "Document" ? source.documentId : source.chunkId;
}

/** Get the source node's ID property name. */
function getSourceIdField(sourceKind: "Document" | "Chunk"): string {
  return sourceKind === "Document" ? "documentId" : "chunkId";
}

/**
 * Extract edge-type-specific params from the props.
 * The keys must match the $paramName references in EDGE_PROPERTY_FRAGMENTS.
 *
 * NOTE: We access `edge.props` inside each case so TypeScript
 * narrows the discriminated union correctly.
 */
function getEdgeSpecificParams(
  edge: EvidenceEdgeInput
): Record<string, unknown> {
  switch (edge.type) {
    case "ABOUT": {
      const p = edge.props;
      return {
        aboutness: p.aboutness ?? null,
        aspect: p.aspect ?? null,
        stance: p.stance ?? null,
        confidence: p.confidence ?? null,
      };
    }
    case "MENTIONS": {
      const p = edge.props;
      return {
        confidence: p.confidence ?? null,
        linkingMethod: p.linkingMethod ?? null,
        surfaceForm: p.surfaceForm ?? null,
        charStart: p.charStart ?? null,
        charEnd: p.charEnd ?? null,
      };
    }
    case "IS_PRIMARY_SOURCE": {
      const p = edge.props;
      return {
        confidence: p.confidence ?? null,
        notes: p.notes ?? null,
      };
    }
  }
}

// ============================================================================
// Core: Process a single edge inside an existing transaction
// ============================================================================

/**
 * Process one evidence edge within a caller-provided write transaction.
 *
 * Steps:
 *  1. Resolve the target node (reuses the same tx — no extra session)
 *  2. Build the unified edge-upsert Cypher
 *  3. Execute and return the result
 *
 * If the source node does not exist, the MATCH clause returns 0 rows
 * and we throw a clear NOT_FOUND error.
 */
async function processEvidenceEdge(
  tx: ManagedTransaction,
  edge: EvidenceEdgeInput
): Promise<UpsertEvidenceEdgeResult> {
  const { type: edgeType, source, target, props } = edge;
  const sourceKind = source.kind;
  const sourceId = getSourceId(source);
  const sourceIdField = getSourceIdField(sourceKind);

  // 1) Resolve target node (inside the same write transaction)
  const resolvedTarget = await resolveTargetNode(target, tx);

  // 2) Build Cypher
  const targetIdField = getIdFieldForLabel(resolvedTarget.label);
  const relKey = generateRelKey(
    edgeType,
    sourceKind,
    sourceId,
    resolvedTarget.label,
    resolvedTarget.nodeId
  );

  const cypher = buildUpsertEvidenceEdgeCypher({
    relType: edgeType,
    sourceLabel: sourceKind,
    sourceIdField,
    targetLabel: resolvedTarget.label,
    targetIdField,
  });

  const params: Record<string, unknown> = {
    sourceId,
    targetNodeId: resolvedTarget.nodeId,
    relKey,
    sourceKind,
    targetLabel: resolvedTarget.label,
    // Temporal validity
    validAt: props.validAt ?? null,
    invalidAt: props.invalidAt ?? null,
    expiredAt: props.expiredAt ?? null,
    createdAt: props.createdAt ?? null,
    // Provenance
    mongoRunId: props.mongoRunId,
    mongoPlanId: props.mongoPlanId ?? null,
    stageKey: props.stageKey ?? null,
    subStageKey: props.subStageKey ?? null,
    extractorVersion: props.extractorVersion ?? null,
    extractedAt: props.extractedAt ?? null,
    // Edge-type-specific
    ...getEdgeSpecificParams(edge),
  };

  // 3) Execute
  const res = await tx.run(cypher, params);
  const record = firstRecordOrNull(res as unknown as EagerResult);

  if (!record) {
    // The MATCH on source returned 0 rows → source does not exist
    throw Errors.notFound(
      sourceKind,
      `${sourceIdField}: ${sourceId}`
    );
  }

  const created = record.get("created") as boolean;
  const updated = record.get("updated") as boolean;
  const relationshipId = record.get("relationshipId") as number | null;

  return {
    ok: true as const,
    edgeType,
    relKey,
    relationshipId: relationshipId ? String(relationshipId) : null,
    source:
      sourceKind === "Document"
        ? { kind: "Document" as const, documentId: sourceId }
        : { kind: "Chunk" as const, chunkId: sourceId },
    target: {
      nodeId: resolvedTarget.nodeId,
      label: resolvedTarget.label,
      uniqueKey: resolvedTarget.uniqueKey ?? null,
      uniqueKeyValue: resolvedTarget.uniqueKeyValue ?? null,
    },
    created,
    updated,
  };
}

// ============================================================================
// Public: Single Edge Upsert
// ============================================================================

export async function upsertEvidenceEdge(
  input: EvidenceEdgeInput
): Promise<UpsertEvidenceEdgeResult> {
  const validated = validateInput(
    EvidenceEdgeInputSchema,
    input,
    "EvidenceEdgeInput"
  );

  try {
    return await executeWrite((tx) => processEvidenceEdge(tx, validated));
  } catch (err: unknown) {
    const e = err as { message?: string; code?: string; name?: string; stack?: string };
    logger.error("Neo4j write failed (upsertEvidenceEdge)", {
      message: e?.message,
      code: e?.code,
      name: e?.name,
      stack: e?.stack,
      edgeType: validated.type,
      sourceKind: validated.source.kind,
    });
    throw err;
  }
}

// ============================================================================
// Public: Batch Edges Upsert (partial-success semantics)
// ============================================================================

export async function upsertEvidenceEdges(
  input: UpsertEvidenceEdgesInput
): Promise<UpsertEvidenceEdgesResult> {
  const validated = validateInput(
    UpsertEvidenceEdgesInputSchema,
    input,
    "UpsertEvidenceEdgesInput"
  );

  const edges = validated.edges;
  const counts: UpsertEvidenceEdgesCounts = {
    received: edges.length,
    attempted: 0,
    created: 0,
    updated: 0,
    failed: 0,
  };

  const results: UpsertEvidenceEdgeResult[] = [];
  const errors: UpsertEvidenceEdgeError[] = [];

  // Each edge runs in its own transaction for fault isolation.
  // Within each transaction, target resolution + edge upsert share the session.
  for (let i = 0; i < edges.length; i++) {
    const edge = edges[i];
    counts.attempted++;

    try {
      const result = await executeWrite((tx) =>
        processEvidenceEdge(tx, edge)
      );
      results.push(result);

      if (result.created) counts.created++;
      else if (result.updated) counts.updated++;
    } catch (err: unknown) {
      counts.failed++;

      const e = err as { message?: string; code?: string };
      errors.push({
        index: i,
        edgeType: edge.type,
        message: e?.message || "Unknown error",
        code: e?.code || null,
      });

      logger.error("Failed to upsert evidence edge", {
        index: i,
        edgeType: edge.type,
        error: e?.message,
        code: e?.code,
      });
    }
  }

  return {
    ok: errors.length === 0,
    counts,
    results,
    errors,
  };
}
