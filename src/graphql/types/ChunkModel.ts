import { z } from "zod";
import { Neo4jDateTimeString } from "../utils/dateTimeUtils.js";
import { TemporalValiditySchema } from "./TemporalValidityModel.js";

// ============================================================================
// Edge Type Schemas (Relationship + Node)
// ============================================================================

// MentionsEdge (Chunk -> StructuredNode)
// Note: For MVP, we'll use a generic structure. The target can be any structured node.
// In GraphQL, this will need to be handled via union types or interface.
export const MentionsEdgeSchema = TemporalValiditySchema.extend({
  // Target node properties will be resolved at query time
  // For now, we include provenance fields that are on the relationship
  confidence: z.number().nullable(), // 0..1
  linkingMethod: z.string().nullable(), // e.g. llm_linker, dictionary, regex
  surfaceForm: z.string().nullable(),
  // Provenance fields (also on relationship)
  mongoRunId: z.string(),
  mongoPlanId: z.string().nullable(),
  stageKey: z.string().nullable(),
  subStageKey: z.string().nullable(),
  extractorVersion: z.string().nullable(),
  extractedAt: Neo4jDateTimeString,
});

export type MentionsEdge = z.infer<typeof MentionsEdgeSchema>;

// AboutEdge (Chunk -> StructuredNode)
export const AboutEdgeSchema = TemporalValiditySchema.extend({
  // Target node properties will be resolved at query time
  // For now, we include relationship-specific properties
  aboutness: z.number().nullable(), // 0..1, optional but recommended
  aspect: z.string().nullable(), // e.g. efficacy, safety, dosage, mechanism, regulatory, manufacturing, measurement, pricing, other
  stance: z.string().nullable(), // positive | negative | neutral | mixed
  // Provenance fields (also on relationship)
  mongoRunId: z.string(),
  mongoPlanId: z.string().nullable(),
  stageKey: z.string().nullable(),
  subStageKey: z.string().nullable(),
  extractorVersion: z.string().nullable(),
  extractedAt: Neo4jDateTimeString,
  confidence: z.number().nullable(), // if not used above, keep one
});

export type AboutEdge = z.infer<typeof AboutEdgeSchema>;

// NextChunkEdge (Chunk -> Chunk) - sequential traversal
// Note: This is a self-referential edge, so we use z.lazy
export const NextChunkEdgeSchema: z.ZodType<any> = z.lazy(() =>
  TemporalValiditySchema.extend({
    chunk: ChunkSchema,
  })
);

export type NextChunkEdge = z.infer<typeof NextChunkEdgeSchema>;

// ============================================================================
// Chunk Schema (with lazy reference for self-referential edge)
// ============================================================================

export const ChunkSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    chunkId: z.string(),
    chunkKey: z.string(), // unique, idempotency: ${textVersionHash}:${segmentationHash}:${index}
    index: z.number().int(), // stable ordering within segmentation (0..N-1)
    text: z.string(),

    // Offsets (optional but recommended)
    charStart: z.number().int().nullable(),
    charEnd: z.number().int().nullable(),

    // Transcript alignment (optional)
    startMs: z.number().int().nullable(),
    endMs: z.number().int().nullable(),

    // Embeddings (Neo4j native)
    embedding: z.array(z.number()).nullable(), // float[], optional but used today
    embeddingModel: z.string().nullable(),
    embeddingVersion: z.string().nullable(),

    // Temporal + audit
    validAt: Neo4jDateTimeString,
    expiredAt: Neo4jDateTimeString,
    invalidAt: Neo4jDateTimeString,
    createdAt: Neo4jDateTimeString,
    updatedAt: Neo4jDateTimeString,

    // Relationships as edge types
    nextChunk: NextChunkEdgeSchema.nullable(), // single next chunk (not array)
    mentions: z.array(MentionsEdgeSchema).nullable(),
    about: z.array(AboutEdgeSchema).nullable(),
  })
);

export type Chunk = z.infer<typeof ChunkSchema>;
