import { z } from "zod";
import { Neo4jDateTimeString } from "../utils/dateTimeUtils.js";
import { TemporalValidityInputSchema } from "./TemporalValidityInputs.js"; 
import { EvidenceProvenanceSchema, EvidenceProvenance } from "./IngestionProvenanceInput.js";

// ============================================================================
// GraphQL Input Types (flattened structure as received from GraphQL)
// ============================================================================
// These types match the GraphQL schema structure exactly as it comes from the API.
// They are transformed into the nested service types below.

export const GraphQLEvidenceSourceRefInputSchema = z.object({
  kind: z.enum(["Document", "Chunk"]),
  documentId: z.string().nullable().optional(),
  chunkId: z.string().nullable().optional(),
});

export type GraphQLEvidenceSourceRefInput = z.infer<
  typeof GraphQLEvidenceSourceRefInputSchema
>;

export const GraphQLEvidenceTargetRefInputSchema = z.object({
  nodeId: z.string().nullable().optional(),
  label: z.string().nullable().optional(),
  uniqueKey: z.string().nullable().optional(),
  uniqueKeyValue: z.string().nullable().optional(),
});

export type GraphQLEvidenceTargetRefInput = z.infer<
  typeof GraphQLEvidenceTargetRefInputSchema
>;

export const GraphQLEvidenceEdgeInputSchema = z.object({
  type: z.enum(["ABOUT", "MENTIONS", "IS_PRIMARY_SOURCE"]),
  source: GraphQLEvidenceSourceRefInputSchema,
  target: GraphQLEvidenceTargetRefInputSchema,
  
  // Temporal validity fields (common to all edge types)
  validAt: Neo4jDateTimeString.optional(),
  invalidAt: Neo4jDateTimeString.optional(),
  expiredAt: Neo4jDateTimeString.optional(),
  createdAt: Neo4jDateTimeString.optional(),
  
  // Provenance fields (common to all edge types)
  mongoRunId: z.string(),
  mongoPlanId: z.string().nullable().optional(),
  stageKey: z.string().nullable().optional(),
  subStageKey: z.string().nullable().optional(),
  extractorVersion: z.string().nullable().optional(),
  extractedAt: Neo4jDateTimeString,
  
  // ABOUT edge specific fields (used when type="ABOUT")
  aboutness: z.number().min(0).max(1).nullable().optional(),
  aspect: z.string().nullable().optional(),
  stance: z.string().nullable().optional(),
  
  // MENTIONS edge specific fields (used when type="MENTIONS")
  linkingMethod: z.string().nullable().optional(),
  surfaceForm: z.string().nullable().optional(),
  charStart: z.number().int().nullable().optional(),
  charEnd: z.number().int().nullable().optional(),
  
  // IS_PRIMARY_SOURCE edge specific fields (used when type="IS_PRIMARY_SOURCE")
  notes: z.string().nullable().optional(),
  
  // Confidence (used by ABOUT, MENTIONS, and IS_PRIMARY_SOURCE)
  confidence: z.number().min(0).max(1).nullable().optional(),
});

export type GraphQLEvidenceEdgeInput = z.infer<
  typeof GraphQLEvidenceEdgeInputSchema
>;

export const GraphQLUpsertEvidenceEdgesInputSchema = z.object({
  edges: z.array(GraphQLEvidenceEdgeInputSchema).min(1),
});

export type GraphQLUpsertEvidenceEdgesInput = z.infer<
  typeof GraphQLUpsertEvidenceEdgesInputSchema
>;

// ============================================================================
// Service Input Types (nested structure used by service functions)
// ============================================================================
// SourceRef
// ============================================================================

export const EvidenceSourceRefSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("Document"),
    documentId: z.string(),
  }),
  z.object({
    kind: z.literal("Chunk"),
    chunkId: z.string(),
  }),
]);

export type EvidenceSourceRef = z.infer<typeof EvidenceSourceRefSchema>;

// ============================================================================
// TargetRef
// ============================================================================
// Prefer nodeId; allow fallback resolution using label + uniqueKey + uniqueKeyValue.

export const EvidenceTargetRefSchema = z
  .object({
    nodeId: z.string().nullable().optional(),

    // fallback fields (only used if nodeId is missing)
    label: z.string().nullable().optional(),
    uniqueKey: z.string().nullable().optional(),
    uniqueKeyValue: z.string().nullable().optional(),
  })
  .refine(
    (v) =>
      !!v.nodeId ||
      (!!v.label && !!v.uniqueKey && !!v.uniqueKeyValue),
    {
      message:
        "EvidenceTargetRef must provide nodeId OR (label + uniqueKey + uniqueKeyValue).",
    }
  );

export type EvidenceTargetRef = z.infer<typeof EvidenceTargetRefSchema>;



// ============================================================================
// Transform: GraphQL Input -> Service Input
// ============================================================================

/**
 * Transforms a GraphQL flattened input to the nested service input structure.
 * This function validates the GraphQL input and converts it to the format expected by service functions.
 */
export function transformGraphQLEvidenceEdgeInput(
  input: GraphQLEvidenceEdgeInput
): EvidenceEdgeInput {
  // Transform target: GraphQL has all optional fields
  // Service expects nodeId OR (label + uniqueKey + uniqueKeyValue)
  const target: EvidenceTargetRef = {
    nodeId: input.target.nodeId ?? undefined,
    label: input.target.label ?? undefined,
    uniqueKey: input.target.uniqueKey ?? undefined,
    uniqueKeyValue: input.target.uniqueKeyValue ?? undefined,
  };

  // Build base props object with nested structure
  const baseProps = {
    // Temporal validity
    validAt: input.validAt ?? undefined,
    invalidAt: input.invalidAt ?? undefined,
    expiredAt: input.expiredAt ?? undefined,
    createdAt: input.createdAt ?? undefined,
    // Provenance
    mongoRunId: input.mongoRunId,
    mongoPlanId: input.mongoPlanId ?? undefined,
    stageKey: input.stageKey ?? undefined,
    subStageKey: input.subStageKey ?? undefined,
    extractorVersion: input.extractorVersion ?? undefined,
    extractedAt: input.extractedAt,
  };

  // Handle each edge type with proper source validation and typing
  if (input.type === "ABOUT") {
    // ABOUT edges can have Document or Chunk as source
    const source: EvidenceSourceRef =
      input.source.kind === "Document"
        ? {
            kind: "Document",
            documentId: input.source.documentId!,
          }
        : {
            kind: "Chunk",
            chunkId: input.source.chunkId!,
          };

    return {
      type: "ABOUT",
      source,
      target,
      props: {
        ...baseProps,
        aboutness: input.aboutness ?? undefined,
        aspect: input.aspect ?? undefined,
        stance: input.stance ?? undefined,
        confidence: input.confidence ?? undefined,
      } as AboutEdgePropsInput,
    } as EvidenceAboutEdgeInput;
  } else if (input.type === "MENTIONS") {
    // MENTIONS edges must have Chunk as source
    if (input.source.kind !== "Chunk") {
      throw new Error("MENTIONS edges require Chunk as source");
    }
    const source: { kind: "Chunk"; chunkId: string } = {
      kind: "Chunk",
      chunkId: input.source.chunkId!,
    };

    return {
      type: "MENTIONS",
      source,
      target,
      props: {
        ...baseProps,
        confidence: input.confidence ?? undefined,
        linkingMethod: input.linkingMethod ?? undefined,
        surfaceForm: input.surfaceForm ?? undefined,
        charStart: input.charStart ?? undefined,
        charEnd: input.charEnd ?? undefined,
      } as MentionsEdgePropsInput,
    } as EvidenceMentionsEdgeInput;
  } else {
    // IS_PRIMARY_SOURCE edges must have Document as source
    if (input.source.kind !== "Document") {
      throw new Error("IS_PRIMARY_SOURCE edges require Document as source");
    }
    const source: { kind: "Document"; documentId: string } = {
      kind: "Document",
      documentId: input.source.documentId!,
    };

    return {
      type: "IS_PRIMARY_SOURCE",
      source,
      target,
      props: {
        ...baseProps,
        confidence: input.confidence ?? undefined,
        notes: input.notes ?? undefined,
      } as IsPrimarySourceEdgePropsInput,
    } as EvidenceIsPrimarySourceEdgeInput;
  }
}

// ============================================================================
// Helpers: combine schemas WITHOUT .merge()
// - Use .and() to intersect shapes.
// - Alternatively you can do TemporalValidityInputSchema.extend({...}).and(EvidenceProvenanceSchema)
// ============================================================================

const TemporalAndProvenanceSchema = TemporalValidityInputSchema.and(
  EvidenceProvenanceSchema
);

// ============================================================================
// ABOUT edge
//   - Source: Document or Chunk
//   - Target: structured node
// ============================================================================

export const AboutEdgePropsInputSchema = TemporalAndProvenanceSchema.and(
  z.object({
    aboutness: z.number().min(0).max(1).nullable().optional(),
    aspect: z.string().nullable().optional(),
    stance: z.string().nullable().optional(),
    confidence: z.number().min(0).max(1).nullable().optional(),
  })
);

export type AboutEdgePropsInput = z.infer<typeof AboutEdgePropsInputSchema>;

export const EvidenceAboutEdgeInputSchema = z.object({
  type: z.literal("ABOUT"),
  source: EvidenceSourceRefSchema, // Document | Chunk
  target: EvidenceTargetRefSchema,
  props: AboutEdgePropsInputSchema,
});

export type EvidenceAboutEdgeInput = z.infer<
  typeof EvidenceAboutEdgeInputSchema
>;

// ============================================================================
// MENTIONS edge
//   - Source: Chunk only
//   - Target: structured node
// ============================================================================

export const MentionsEdgePropsInputSchema = TemporalAndProvenanceSchema.and(
  z.object({
    confidence: z.number().min(0).max(1).nullable().optional(),
    linkingMethod: z.string().nullable().optional(),
    surfaceForm: z.string().nullable().optional(),

    // optional spans (safe to include now; you can ignore server-side)
    charStart: z.number().int().nullable().optional(),
    charEnd: z.number().int().nullable().optional(),
  })
);

export type MentionsEdgePropsInput = z.infer<typeof MentionsEdgePropsInputSchema>;

export const EvidenceMentionsEdgeInputSchema = z.object({
  type: z.literal("MENTIONS"),
  source: z.object({
    kind: z.literal("Chunk"),
    chunkId: z.string(),
  }),
  target: EvidenceTargetRefSchema,
  props: MentionsEdgePropsInputSchema,
});

export type EvidenceMentionsEdgeInput = z.infer<
  typeof EvidenceMentionsEdgeInputSchema
>;

// ============================================================================
// IS_PRIMARY_SOURCE edge
//   - Source: Document only
//   - Target: structured node
// ============================================================================

export const IsPrimarySourceEdgePropsInputSchema = TemporalAndProvenanceSchema.and(
  z.object({
    confidence: z.number().min(0).max(1).nullable().optional(),
    notes: z.string().nullable().optional(),
  })
);

export type IsPrimarySourceEdgePropsInput = z.infer<
  typeof IsPrimarySourceEdgePropsInputSchema
>;

export const EvidenceIsPrimarySourceEdgeInputSchema = z.object({
  type: z.literal("IS_PRIMARY_SOURCE"),
  source: z.object({
    kind: z.literal("Document"),
    documentId: z.string(),
  }),
  target: EvidenceTargetRefSchema,
  props: IsPrimarySourceEdgePropsInputSchema,
});

export type EvidenceIsPrimarySourceEdgeInput = z.infer<
  typeof EvidenceIsPrimarySourceEdgeInputSchema
>;

// ============================================================================
// Union + top-level input
// ============================================================================

export const EvidenceEdgeInputSchema = z.discriminatedUnion("type", [
  EvidenceAboutEdgeInputSchema,
  EvidenceMentionsEdgeInputSchema,
  EvidenceIsPrimarySourceEdgeInputSchema,
]);

export type EvidenceEdgeInput = z.infer<typeof EvidenceEdgeInputSchema>;

export const UpsertEvidenceEdgesInputSchema = z.object({
  edges: z.array(EvidenceEdgeInputSchema).min(1),
});

export type UpsertEvidenceEdgesInput = z.infer<
  typeof UpsertEvidenceEdgesInputSchema
>;
