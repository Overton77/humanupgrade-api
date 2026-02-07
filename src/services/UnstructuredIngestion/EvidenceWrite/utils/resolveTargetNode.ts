// ============================================================================
// Target Node Resolution
// ============================================================================
// Resolves target nodes by nodeId OR by label + uniqueKey + uniqueKeyValue.
//
// Accepts an optional ManagedTransaction so callers inside an existing
// write-transaction can avoid opening a separate read session.

import type { ManagedTransaction } from "neo4j-driver";
import { executeRead } from "../../../../db/neo4j/executor.js";
import { firstRecordOrNull } from "../../../../db/neo4j/utils.js";
import { getIdFieldForLabel } from "./nodeLabelMapping.js";
import { Errors } from "../../../../lib/errors.js";
import type { EvidenceTargetRef } from "../../../../graphql/inputs/EvidenceEdgeInputs.js";
import type { EagerResult } from "../../../../db/neo4j/types.js";

// ============================================================================
// Types
// ============================================================================

export interface ResolvedTargetNode {
  nodeId: string;
  label: string;
  uniqueKey: string | null;
  uniqueKeyValue: string | null;
}

// ============================================================================
// Internal Query Helper
// ============================================================================

/**
 * Run a Cypher query and return the first record.
 * When `tx` is provided, reuses the caller's transaction (no extra session).
 * Otherwise falls back to a standalone read session.
 */
async function queryFirst(
  cypher: string,
  params: Record<string, unknown>,
  tx?: ManagedTransaction
) {
  if (tx) {
    return firstRecordOrNull(await tx.run(cypher, params) as unknown as EagerResult);
  }
  return executeRead(async (readTx) =>
    firstRecordOrNull(await readTx.run(cypher, params) as unknown as EagerResult)
  );
}

// ============================================================================
// Cypher Fragments
// ============================================================================

/**
 * Fallback: resolve by nodeId scanning all known ID fields.
 * Necessary when the caller only provides nodeId without a label hint.
 */
const RESOLVE_BY_NODE_ID_SCAN_CYPHER = `
  MATCH (n)
  WHERE
    n.organizationId = $nodeId OR
    n.productId = $nodeId OR
    n.compoundFormId = $nodeId OR
    n.labTestId = $nodeId OR
    n.categoryId = $nodeId OR
    n.panelDefinitionId = $nodeId OR
    n.regulatoryStatusId = $nodeId OR
    n.pathwayId = $nodeId OR
    n.manufacturingProcessId = $nodeId OR
    n.platformId = $nodeId OR
    n.locationId = $nodeId OR
    n.listingId = $nodeId OR
    n.documentId = $nodeId OR
    n.chunkId = $nodeId
  WITH n, labels(n) AS labels
  UNWIND labels AS label
  WITH n, label
  WHERE label <> 'BaseNode' AND label IS NOT NULL
  RETURN n, head(collect(label)) AS label
  LIMIT 1
`;

/**
 * Optimized: resolve by nodeId when the label is also known.
 * Uses an indexed label-property lookup — much faster than a full scan.
 */
function buildResolveByNodeIdWithLabelCypher(
  label: string,
  idField: string
): string {
  return `
    MATCH (n:${label} { ${idField}: $nodeId })
    RETURN n, '${label}' AS label
    LIMIT 1
  `;
}

/**
 * Resolve by label + uniqueKey when the uniqueKey IS the canonical ID field.
 */
function buildResolveByIdFieldCypher(
  label: string,
  idField: string
): string {
  return `
    MATCH (n:${label} { ${idField}: $nodeId })
    RETURN n, '${label}' AS label
    LIMIT 1
  `;
}

/**
 * Resolve by label + uniqueKey when the uniqueKey differs from the ID field.
 */
function buildResolveByUniqueKeyCypher(
  label: string,
  uniqueKey: string
): string {
  return `
    MATCH (n:${label})
    WHERE n.${uniqueKey} = $uniqueKeyValue
    RETURN n, '${label}' AS label
    LIMIT 1
  `;
}

// ============================================================================
// Internal Helpers
// ============================================================================

/**
 * Extract the canonical node ID from a resolved Neo4j record.
 */
function extractNodeId(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  node: any,
  idField: string,
  label: string
): string {
  const raw = node?.properties?.[idField] ?? node?.[idField];
  if (!raw) {
    throw Errors.internalError(
      `Resolved node with label ${label} does not have ${idField}`
    );
  }
  return String(raw);
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Resolve a target node reference to its canonical nodeId and label.
 *
 * Resolution strategies (in priority order):
 *  1. nodeId + label  → indexed label-property lookup (fastest)
 *  2. nodeId only     → full-scan across all known ID fields (slowest)
 *  3. label + uniqueKey + uniqueKeyValue → label-property lookup
 *
 * @param targetRef - The target reference from the input
 * @param tx        - Optional existing ManagedTransaction to reuse
 */
export async function resolveTargetNode(
  targetRef: EvidenceTargetRef,
  tx?: ManagedTransaction
): Promise<ResolvedTargetNode> {

  // -----------------------------------------------------------------
  // Strategy 1 & 2: nodeId provided
  // -----------------------------------------------------------------
  if (targetRef.nodeId) {
    // 1a) If label hint is also available, use fast indexed lookup
    if (targetRef.label) {
      const idField = getIdFieldForLabel(targetRef.label);
      const cypher = buildResolveByNodeIdWithLabelCypher(targetRef.label, idField);
      const result = await queryFirst(cypher, { nodeId: targetRef.nodeId }, tx);

      if (!result) {
        throw Errors.notFound(
          "TargetNode",
          `${targetRef.label} with ${idField}: ${targetRef.nodeId}`
        );
      }

      const node = result.get("n");
      return {
        nodeId: extractNodeId(node, idField, targetRef.label),
        label: targetRef.label,
        uniqueKey: null,
        uniqueKeyValue: null,
      };
    }

    // 1b) Fallback: scan all ID fields
    const result = await queryFirst(
      RESOLVE_BY_NODE_ID_SCAN_CYPHER,
      { nodeId: targetRef.nodeId },
      tx
    );

    if (!result) {
      throw Errors.notFound("TargetNode", `nodeId: ${targetRef.nodeId}`);
    }

    const node = result.get("n");
    const label = result.get("label") as string;
    const idField = getIdFieldForLabel(label);

    return {
      nodeId: extractNodeId(node, idField, label),
      label,
      uniqueKey: null,
      uniqueKeyValue: null,
    };
  }

  // -----------------------------------------------------------------
  // Strategy 3: label + uniqueKey + uniqueKeyValue
  // -----------------------------------------------------------------
  if (!targetRef.label || !targetRef.uniqueKey || !targetRef.uniqueKeyValue) {
    throw Errors.invalidInput(
      "TargetRef must provide nodeId OR (label + uniqueKey + uniqueKeyValue)"
    );
  }

  const { label, uniqueKey, uniqueKeyValue } = targetRef;
  const idField = getIdFieldForLabel(label);

  const cypher =
    uniqueKey === idField
      ? buildResolveByIdFieldCypher(label, idField)
      : buildResolveByUniqueKeyCypher(label, uniqueKey);

  const params: Record<string, unknown> =
    uniqueKey === idField
      ? { nodeId: uniqueKeyValue, label }
      : { uniqueKeyValue, label };

  const result = await queryFirst(cypher, params, tx);

  if (!result) {
    throw Errors.notFound(
      "TargetNode",
      `label: ${label}, ${uniqueKey}: ${uniqueKeyValue}`
    );
  }

  const node = result.get("n");
  const resolvedLabel = result.get("label") as string;
  const resolvedIdField = getIdFieldForLabel(resolvedLabel);

  return {
    nodeId: extractNodeId(node, resolvedIdField, resolvedLabel),
    label: resolvedLabel,
    uniqueKey,
    uniqueKeyValue,
  };
}
