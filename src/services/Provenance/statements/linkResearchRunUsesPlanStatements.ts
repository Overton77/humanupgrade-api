// ============================================================================
// Link ResearchRunRef Uses Plan Cypher
// ============================================================================

export const linkResearchRunUsesPlanCypher = `
  MATCH (rrr:ResearchRunRef { mongoRunId: $mongoRunId })
  MATCH (rpr:ResearchPlanRef { mongoPlanId: $mongoPlanId })
  
  MERGE (rrr)-[r:USES_PLAN]->(rpr)
  ON CREATE SET r.createdAt = datetime()
  
  SET r += {
    validAt: CASE WHEN $validAt IS NULL THEN r.validAt ELSE $validAt END,
    invalidAt: CASE WHEN $invalidAt IS NULL THEN r.invalidAt ELSE $invalidAt END,
    expiredAt: CASE WHEN $expiredAt IS NULL THEN r.expiredAt ELSE $expiredAt END,
    updatedAt: CASE WHEN $updatedAt IS NULL THEN r.updatedAt ELSE datetime() END
  }
  
  RETURN rrr, rpr, r
`;

// ============================================================================
// Return ResearchRunRef Cypher (after linking)
// ============================================================================

export const returnResearchRunRefAfterLinkCypher = `
  MATCH (rrr:ResearchRunRef { mongoRunId: $mongoRunId })
  RETURN properties(rrr) AS researchRunRef
`;
