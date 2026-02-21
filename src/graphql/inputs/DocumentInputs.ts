import { z } from "zod";
import { Neo4jDateTimeString } from "../utils/dateTimeUtils.js";
import { InlineChunkBundleInputSchema } from "./InlineChunkInputs.js"; 
import { SearchSurfaceInputSchema } from "./DocumentSearchSurfaceInputs.js";

// ============================================================================
// Document GeneratedBy Edge Input Schema
// ============================================================================

export const DocumentGeneratedByInputSchema = z.object({
  mongoRunId: z.string(), // points to ResearchRunRef.mongoRunId
  operation: z.string(), // CREATED | UPDATED | EXTRACTED | LINKED | SUMMARIZED | EMBEDDED
  stageKey: z.string().nullable().optional(),
  subStageKey: z.string().nullable().optional(),
  extractorVersion: z.string().nullable().optional(),
  extractedAt: Neo4jDateTimeString.optional(),
  // Temporal fields for relationship
  validAt: Neo4jDateTimeString.optional(),
  expiredAt: Neo4jDateTimeString.optional(),
  invalidAt: Neo4jDateTimeString.optional(),
  createdAt: Neo4jDateTimeString.optional(),
  updatedAt: Neo4jDateTimeString.optional(),
});

export type DocumentGeneratedByInput = z.infer<
  typeof DocumentGeneratedByInputSchema
>;

// ============================================================================
// Document Input Schema
// ============================================================================

export const UpsertDocumentInputSchema = z.object({
  documentKey: z.string(), // unique idempotency key
  type: z.string(), // case_study | case_study_summary | transcript | ...
  title: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
  publishedAt: Neo4jDateTimeString.optional(),
  retrievedAt: Neo4jDateTimeString.optional(),
  // Temporal fields (required for upserts)
  validAt: Neo4jDateTimeString,
  expiredAt: Neo4jDateTimeString.optional(),
  invalidAt: Neo4jDateTimeString.optional(),
  createdAt: Neo4jDateTimeString,
  updatedAt: Neo4jDateTimeString,
  searchSurface: SearchSurfaceInputSchema.optional(),
  // Optional: create/update Document-[:GENERATED_BY]->ResearchRunRef
  generatedBy: DocumentGeneratedByInputSchema.optional(), 
  chunkBundle: InlineChunkBundleInputSchema.optional(),
});

export type UpsertDocumentInput = z.infer<typeof UpsertDocumentInputSchema>;
