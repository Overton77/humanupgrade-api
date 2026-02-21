export const findExistingPanelDefinitionIdCypher = `
  // Try to locate an existing panel definition by any provided key.
  // Order of precedence: panelDefinitionId, canonicalName.
  OPTIONAL MATCH (pdById:PanelDefinition {panelDefinitionId: $panelDefinitionId})
  WITH pdById
  WHERE pdById IS NOT NULL
  RETURN pdById.panelDefinitionId AS panelDefinitionId
  UNION
  OPTIONAL MATCH (pdByName:PanelDefinition {canonicalName: $canonicalName})
  WITH pdByName
  WHERE $canonicalName IS NOT NULL AND pdByName IS NOT NULL
  RETURN pdByName.panelDefinitionId AS panelDefinitionId
`;
