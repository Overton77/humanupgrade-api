import { z } from "zod";
import { Neo4jDateTimeString } from "../utils/dateTimeUtils.js";
import { TemporalValidityInputSchema } from "./TemporalValidityInputs.js";
import { ChunkInputSchema } from "./ChunkInputs.js"; 
import { SearchSurfaceInputSchema } from "./DocumentSearchSurfaceInputs.js";

// ============================================================================
// DocumentTextVersion Input Schema
// ============================================================================

export const DocumentTextVersionInputSchema = z.object({
  textVersionHash: z.string(),
  source: z.string(), // e.g. raw, llm_summary, api_export, html_dom
  language: z.string().nullable().optional(),
  text: z.string(),
  // Temporal fields (required for upserts)    
  searchSurface: SearchSurfaceInputSchema.optional(),

  validAt: Neo4jDateTimeString,
  expiredAt: Neo4jDateTimeString.optional(),
  invalidAt: Neo4jDateTimeString.optional(),
  createdAt: Neo4jDateTimeString,
  updatedAt: Neo4jDateTimeString,
});

export type DocumentTextVersionInput = z.infer<
  typeof DocumentTextVersionInputSchema
>;

// ============================================================================
// Segmentation Input Schema
// ============================================================================

export const SegmentationInputSchema = z.object({
  segmentationHash: z.string(),
  strategy: z.string(), // e.g. basic, token_window_overlap, speaker_turns
  chunkSize: z.number().int(),
  overlap: z.number().int(),
  // Temporal fields (required for upserts)
  validAt: Neo4jDateTimeString,
  expiredAt: Neo4jDateTimeString.optional(),
  invalidAt: Neo4jDateTimeString.optional(),
  createdAt: Neo4jDateTimeString,
  updatedAt: Neo4jDateTimeString,
});

export type SegmentationInput = z.infer<typeof SegmentationInputSchema>;