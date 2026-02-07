import { z } from "zod";
import { Neo4jDateTimeString } from "../utils/dateTimeUtils.js";
import { TemporalValidityInputSchema } from "./TemporalValidityInputs.js"; 
import { EvidenceProvenanceSchema, EvidenceProvenance } from "./IngestionProvenanceInput.js";

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
