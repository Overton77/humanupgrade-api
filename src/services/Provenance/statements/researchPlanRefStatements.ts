// ============================================================================
// ResearchPlanRef Upsert Cypher
// ============================================================================

export function buildResearchPlanRefUpsertCypher() {
  return `
    MERGE (rpr:ResearchPlanRef { mongoPlanId: $mongoPlanId })
    ON CREATE SET rpr.createdAt = datetime()
    
    // canonical id must always exist
    SET rpr.researchPlanRefId = coalesce(rpr.researchPlanRefId, randomUUID())
    
    SET rpr += {
      label: CASE WHEN $label IS NULL THEN rpr.label ELSE $label END,
      version: CASE WHEN $version IS NULL THEN rpr.version ELSE $version END,
      validAt: CASE WHEN $validAt IS NULL THEN rpr.validAt ELSE $validAt END,
      invalidAt: CASE WHEN $invalidAt IS NULL THEN rpr.invalidAt ELSE $invalidAt END,
      expiredAt: CASE WHEN $expiredAt IS NULL THEN rpr.expiredAt ELSE $expiredAt END,
      updatedAt: CASE WHEN $updatedAt IS NULL THEN rpr.updatedAt ELSE datetime() END
    }
    
    RETURN rpr
  `;
}

// ============================================================================
// Return ResearchPlanRef Cypher
// ============================================================================

export const returnResearchPlanRefCypher = `
  MATCH (rpr:ResearchPlanRef { researchPlanRefId: $researchPlanRefId })
  RETURN properties(rpr) AS researchPlanRef
`;

export const returnResearchPlanRefByMongoPlanIdCypher = `
  MATCH (rpr:ResearchPlanRef { mongoPlanId: $mongoPlanId })
  RETURN properties(rpr) AS researchPlanRef
`;
