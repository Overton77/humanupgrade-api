// ============================================================================
// Evidence Edge Cypher Statements
// ============================================================================
//
// Single generic builder replaces the three per-type builders.
// Edge-specific properties are injected via EDGE_PROPERTY_FRAGMENTS.
//

// ============================================================================
// Edge-Specific Property SET Fragments
// ============================================================================
// Each entry is a Cypher property assignment inside SET r += { ... }.
// Uses the CASE-WHEN-NULL-preserve pattern so callers only update
// fields they explicitly pass.

const EDGE_PROPERTY_FRAGMENTS: Record<string, string[]> = {
  ABOUT: [
    "aboutness: CASE WHEN $aboutness IS NULL THEN r.aboutness ELSE $aboutness END",
    "aspect: CASE WHEN $aspect IS NULL THEN r.aspect ELSE $aspect END",
    "stance: CASE WHEN $stance IS NULL THEN r.stance ELSE $stance END",
    "confidence: CASE WHEN $confidence IS NULL THEN r.confidence ELSE $confidence END",
  ],
  MENTIONS: [
    "confidence: CASE WHEN $confidence IS NULL THEN r.confidence ELSE $confidence END",
    "linkingMethod: CASE WHEN $linkingMethod IS NULL THEN r.linkingMethod ELSE $linkingMethod END",
    "surfaceForm: CASE WHEN $surfaceForm IS NULL THEN r.surfaceForm ELSE $surfaceForm END",
    "charStart: CASE WHEN $charStart IS NULL THEN r.charStart ELSE $charStart END",
    "charEnd: CASE WHEN $charEnd IS NULL THEN r.charEnd ELSE $charEnd END",
  ],
  IS_PRIMARY_SOURCE: [
    "confidence: CASE WHEN $confidence IS NULL THEN r.confidence ELSE $confidence END",
    "notes: CASE WHEN $notes IS NULL THEN r.notes ELSE $notes END",
  ],
};

// ============================================================================
// Generic Evidence Edge Upsert Builder
// ============================================================================

export interface EvidenceEdgeCypherOpts {
  relType: "ABOUT" | "MENTIONS" | "IS_PRIMARY_SOURCE";
  sourceLabel: "Document" | "Chunk";
  sourceIdField: string;
  targetLabel: string;
  targetIdField: string;
}

/**
 * Build Cypher to upsert any evidence edge (ABOUT, MENTIONS, IS_PRIMARY_SOURCE).
 *
 * The generated Cypher:
 *  1. MATCHes both source and target by their canonical ID fields
 *  2. MERGEs the relationship (creates if absent, matches if present)
 *  3. Sets common temporal + provenance properties via CASE-WHEN-NULL-preserve
 *  4. Sets edge-type-specific properties
 *  5. Returns metadata: created/updated flags, relationshipId, relKey
 *
 * If source or target does not exist the MATCH returns 0 rows and
 * the caller receives null — handle accordingly.
 */
export function buildUpsertEvidenceEdgeCypher(opts: EvidenceEdgeCypherOpts): string {
  const { relType, sourceLabel, sourceIdField, targetLabel, targetIdField } = opts;

  const edgeProps = EDGE_PROPERTY_FRAGMENTS[relType] ?? [];
  const edgePropsFragment =
    edgeProps.length > 0
      ? ",\n      " + edgeProps.join(",\n      ")
      : "";

  return `
    MATCH (source:${sourceLabel} { ${sourceIdField}: $sourceId })
    MATCH (target:${targetLabel} { ${targetIdField}: $targetNodeId })

    MERGE (source)-[r:${relType}]->(target)
    ON CREATE SET
      r.createdAt = datetime(),
      r._wasCreated = true
    ON MATCH SET
      r.updatedAt = datetime(),
      r._wasCreated = false

    SET r += {
      validAt: CASE WHEN $validAt IS NULL THEN r.validAt ELSE datetime($validAt) END,
      invalidAt: CASE WHEN $invalidAt IS NULL THEN r.invalidAt ELSE datetime($invalidAt) END,
      expiredAt: CASE WHEN $expiredAt IS NULL THEN r.expiredAt ELSE datetime($expiredAt) END,
      createdAt: CASE WHEN $createdAt IS NULL THEN r.createdAt ELSE datetime($createdAt) END,
      updatedAt: datetime(),
      mongoRunId: $mongoRunId,
      mongoPlanId: CASE WHEN $mongoPlanId IS NULL THEN r.mongoPlanId ELSE $mongoPlanId END,
      stageKey: CASE WHEN $stageKey IS NULL THEN r.stageKey ELSE $stageKey END,
      subStageKey: CASE WHEN $subStageKey IS NULL THEN r.subStageKey ELSE $subStageKey END,
      extractorVersion: CASE WHEN $extractorVersion IS NULL THEN r.extractorVersion ELSE $extractorVersion END,
      extractedAt: CASE WHEN $extractedAt IS NULL THEN r.extractedAt ELSE datetime($extractedAt) END${edgePropsFragment}
    }

    WITH r,
         id(r) AS relationshipId,
         $relKey AS relKey,
         source.${sourceIdField} AS sourceId,
         target.${targetIdField} AS targetNodeId,
         $sourceKind AS sourceKind,
         $targetLabel AS targetLabel,
         r._wasCreated AS created,
         NOT r._wasCreated AS updated
    REMOVE r._wasCreated
    RETURN
      relationshipId,
      relKey,
      sourceId,
      targetNodeId,
      sourceKind,
      targetLabel,
      created,
      updated
  `;
}

// ============================================================================
// Relationship Key Generator
// ============================================================================

/**
 * Generate a deterministic relationship key for an evidence edge.
 * Format: {edgeType}:{sourceKind}:{sourceId}->{targetLabel}:{targetNodeId}
 */
export function generateRelKey(
  edgeType: string,
  sourceKind: "Document" | "Chunk",
  sourceId: string,
  targetLabel: string,
  targetNodeId: string
): string {
  return `${edgeType}:${sourceKind}:${sourceId}->${targetLabel}:${targetNodeId}`;
}
