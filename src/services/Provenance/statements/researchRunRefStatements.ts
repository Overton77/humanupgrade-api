// ============================================================================
// ResearchRunRef Upsert Cypher
// ============================================================================

export function buildResearchRunRefUpsertCypher() {
  return `
    MERGE (rrr:ResearchRunRef { mongoRunId: $mongoRunId })
    ON CREATE SET rrr.createdAt = datetime()
    
    // canonical id must always exist
    SET rrr.researchRunRefId = coalesce(rrr.researchRunRefId, randomUUID())
    
    SET rrr += {
      label: CASE WHEN $label IS NULL THEN rrr.label ELSE $label END,
      startedAt: CASE WHEN $startedAt IS NULL THEN rrr.startedAt ELSE $startedAt END,
      endedAt: CASE WHEN $endedAt IS NULL THEN rrr.endedAt ELSE $endedAt END,
      validAt: CASE WHEN $validAt IS NULL THEN rrr.validAt ELSE $validAt END,
      invalidAt: CASE WHEN $invalidAt IS NULL THEN rrr.invalidAt ELSE $invalidAt END,
      expiredAt: CASE WHEN $expiredAt IS NULL THEN rrr.expiredAt ELSE $expiredAt END,
      updatedAt: CASE WHEN $updatedAt IS NULL THEN rrr.updatedAt ELSE datetime() END
    }
    
    RETURN rrr
  `;
}

// ============================================================================
// Return ResearchRunRef Cypher
// ============================================================================

export const returnResearchRunRefCypher = `
  MATCH (rrr:ResearchRunRef { researchRunRefId: $researchRunRefId })
  RETURN properties(rrr) AS researchRunRef
`;

export const returnResearchRunRefByMongoRunIdCypher = `
  MATCH (rrr:ResearchRunRef { mongoRunId: $mongoRunId })
  RETURN properties(rrr) AS researchRunRef
`;
