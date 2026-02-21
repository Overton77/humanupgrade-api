import { z } from "zod";
import { Neo4jDateTimeString } from "../utils/dateTimeUtils.js";
import { TemporalValiditySchema } from "./TemporalValidityModel.js";
import { SegmentationSchema } from "./SegmentationModel.js";  
import { SearchSurfaceSchema } from "./DocumentSearchSurfaceModel.js"; 
import { HasSegmentationEdgeSchema } from "./DocumentTextVersionEdgesModels.js";



// ============================================================================
// DocumentTextVersion Schema
// ============================================================================

export const DocumentTextVersionSchema = z.object({
  documentTextVersionId: z.string(),
  textVersionHash: z.string(), // unique-ish, idempotency: hash of full text content
  source: z.string(), // e.g. raw, llm_summary, api_export, html_dom
  language: z.string().nullable(),
  text: z.string(), // for MVP you can store full text here

  // Temporal + audit
  validAt: Neo4jDateTimeString,
  expiredAt: Neo4jDateTimeString.nullable(),
  invalidAt: Neo4jDateTimeString.nullable(),
  createdAt: Neo4jDateTimeString,
  updatedAt: Neo4jDateTimeString,
  searchSurface: SearchSurfaceSchema.nullable(),  
  searchText: z.string().nullable(), 
  searchTextEmbedding: z.array(z.number()).nullable(), // float[]
  searchTextModel: z.string().nullable(),              // e.g. text-embedding-3-large
  searchTextVersion: z.string().nullable(),            // pipeline version (v1, v2, etc.)
  searchTextUpdatedAt: Neo4jDateTimeString.nullable(),
  // Relationships as arrays of edge types
  hasSegmentation: z.array(HasSegmentationEdgeSchema).nullable(),
});

export type DocumentTextVersion = z.infer<typeof DocumentTextVersionSchema>;


