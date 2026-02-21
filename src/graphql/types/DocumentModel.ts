import { z } from "zod";
import { Neo4jDateTimeString } from "../utils/dateTimeUtils.js";
import { TemporalValiditySchema } from "./TemporalValidityModel.js";
import { DocumentTextVersionSchema } from "./DocumentTextVersionModel.js";
import { ChunkSchema } from "./ChunkModel.js";
import { ResearchRunRefSchema } from "./ResearchRunRefModel.js";
import { SearchSurfaceSchema } from "./DocumentSearchSurfaceModel.js";
import { HasTextVersionEdgeSchema, DocumentHasChunkEdgeSchema, GeneratedByEdgeSchema } from "./DocumentEdgesModels.js";

export const DocumentSchema = z.object({
  documentId: z.string(),
  documentKey: z.string(), // unique, idempotency key
  type: z.string(), // e.g. case_study, case_study_summary, transcript
  title: z.string().nullable(),
  url: z.string().nullable(),
  publishedAt: Neo4jDateTimeString,
  retrievedAt: Neo4jDateTimeString,
  searchText: z.string().nullable(), 
  searchTextEmbedding: z.array(z.number()).nullable(), // float[]
  searchTextModel: z.string().nullable(),              // e.g. text-embedding-3-large
  searchTextVersion: z.string().nullable(),            // pipeline version (v1, v2, etc.)
  searchTextUpdatedAt: Neo4jDateTimeString.nullable(),
  // Temporal + audit 

  validAt: Neo4jDateTimeString,
  expiredAt: Neo4jDateTimeString.nullable(),
  invalidAt: Neo4jDateTimeString.nullable(),
  createdAt: Neo4jDateTimeString,
  updatedAt: Neo4jDateTimeString,

  // Relationships as arrays of edge types
  hasTextVersion: z.array(HasTextVersionEdgeSchema).nullable(),
  chunks: z.array(DocumentHasChunkEdgeSchema).nullable(), // denormalized fast lookup
  generatedBy: z.array(GeneratedByEdgeSchema).nullable(),
})

export type Document = z.infer<typeof DocumentSchema>;

// ============================================================================
// UpsertDocumentTextVersionBundleResult Schema
// ============================================================================

export const UpsertDocumentTextVersionBundleResultSchema = z.object({
  documentId: z.string(),
  documentTextVersionId: z.string(),
  segmentationId: z.string(),
  chunkMetas: z.array(
    z.object({
      chunkId: z.string(),
      chunkKey: z.string(),
      index: z.number(),
    })
  ),
  nextChunkEdgesCreated: z.boolean(),
});

export type UpsertDocumentTextVersionBundleResult = z.infer<
  typeof UpsertDocumentTextVersionBundleResultSchema
>;