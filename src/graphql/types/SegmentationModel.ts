import { z } from "zod";
import { Neo4jDateTimeString } from "../utils/dateTimeUtils.js";
import { TemporalValiditySchema } from "./TemporalValidityModel.js";
import { ChunkSchema } from "./ChunkModel.js"; 
import { SegmentationHasChunkEdgeSchema } from "./SegmentationEdgesModels.js";



// ============================================================================
// Segmentation Schema
// ============================================================================

export const SegmentationSchema = z.object({
  segmentationId: z.string(),
  segmentationHash: z.string(), // unique-ish, hash of (strategy + params + textVersionHash)
  strategy: z.string(), // e.g. basic, token_window_overlap, speaker_turns
  chunkSize: z.number().int(),
  overlap: z.number().int(),

  // Temporal + audit
  validAt: Neo4jDateTimeString,
  expiredAt: Neo4jDateTimeString,
  invalidAt: Neo4jDateTimeString,
  createdAt: Neo4jDateTimeString,
  updatedAt: Neo4jDateTimeString,

  // Relationships as arrays of edge types
  hasChunk: z.array(SegmentationHasChunkEdgeSchema).nullable(),
});

export type Segmentation = z.infer<typeof SegmentationSchema>;
