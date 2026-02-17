import { EvidenceSourceRefResult } from "../types/EvidenceEdgeResultModels.js";

/**
 * Resolver for EvidenceSourceRefResult union type.
 * Determines which concrete type to use based on the 'kind' discriminator field.
 */
export const EvidenceSourceRefResultResolvers = {
  __resolveType(obj: EvidenceSourceRefResult): string {
    // Use the 'kind' field to determine the GraphQL type
    if (obj.kind === "Document") {
      return "EvidenceSourceRefDocumentResult";
    }
    if (obj.kind === "Chunk") {
      return "EvidenceSourceRefChunkResult";
    }
    // This should never happen if the data is valid, but provide a fallback
    throw new Error(
      `Unknown EvidenceSourceRefResult kind: ${(obj as any).kind}`
    );
  },
};
