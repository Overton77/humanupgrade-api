// ============================================================================
// Node Label to ID Field Mapping
// ============================================================================
// Maps Neo4j node labels to their canonical ID property names

export const NODE_LABEL_TO_ID_FIELD: Record<string, string> = {
  Organization: "organizationId",
  Product: "productId",
  CompoundForm: "compoundFormId",
  LabTest: "labTestId",
  ProductCategory: "categoryId",
  PanelDefinition: "panelDefinitionId",
  RegulatoryStatus: "regulatoryStatusId",
  RegulatoryPathway: "pathwayId",
  ManufacturingProcess: "manufacturingProcessId",
  TechnologyPlatform: "platformId",
  PhysicalLocation: "locationId",
  Listing: "listingId",
  // Document ingestion types
  Document: "documentId",
  Chunk: "chunkId",
  DocumentTextVersion: "documentTextVersionId",
  Segmentation: "segmentationId",
  ResearchRunRef: "researchRunRefId",
  ResearchPlanRef: "researchPlanRefId",
};

/**
 * Get the ID field name for a given node label
 * @param label - The Neo4j node label
 * @returns The ID field name (e.g., "organizationId" for "Organization")
 * @throws Error if label is not found in mapping
 */
export function getIdFieldForLabel(label: string): string {
  const idField = NODE_LABEL_TO_ID_FIELD[label];
  if (!idField) {
    throw new Error(
      `Unknown node label: ${label}. Add it to NODE_LABEL_TO_ID_FIELD mapping.`
    );
  }
  return idField;
}

/**
 * Check if a label is known in the mapping
 */
export function isKnownLabel(label: string): boolean {
  return label in NODE_LABEL_TO_ID_FIELD;
}
