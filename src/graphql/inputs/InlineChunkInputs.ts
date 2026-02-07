import { z } from "zod";

import { TemporalValidityInputSchema } from "./TemporalValidityInputs.js";
import { DocumentTextVersionInputSchema, SegmentationInputSchema } from "./DocumentationSegmentationInputs.js"; // or wherever you place it
import { ChunkInputSchema } from "./ChunkInputs.js"; 

/**
 * Inline chunk bundle that can be attached to upsertDocument.
 * If provided, the API must ensure the Document ends up with:
 * Document -> TextVersion -> Segmentation -> Chunks (+ optional Document->Chunk and NEXT_CHUNK).
 */
export const InlineChunkBundleInputSchema = z.object({
  // Optional full text version. If omitted, API can infer/create a synthetic internal one.
  textVersion: DocumentTextVersionInputSchema.optional(),

  // Optional segmentation. If omitted, API can create a synthetic segmentation.
  segmentation: SegmentationInputSchema.optional(),

  // Always required if this bundle exists
  chunks: z.array(ChunkInputSchema).min(1),

  // Structural edge stamping (optional)
  hasTextVersionEdge: TemporalValidityInputSchema.optional(),
  hasSegmentationEdge: TemporalValidityInputSchema.optional(),
  segmentationHasChunkEdge: TemporalValidityInputSchema.optional(),
  documentHasChunkEdge: TemporalValidityInputSchema.optional(),
  nextChunkEdge: TemporalValidityInputSchema.optional(),

  alsoCreateDocumentHasChunkEdges: z.boolean().optional().default(true),
  alsoCreateNextChunkEdges: z.boolean().optional().default(true),

  /**
   * Optional hints for synthetic cases (when textVersion/segmentation omitted)
   * These are NOT stored; they only help deterministic generation.
   */
  synthetic: z
    .object({
      source: z.string().optional(), // e.g. "internal_summary"
      strategy: z.string().optional(), // e.g. "basic"
      chunkSize: z.number().int().optional(),
      overlap: z.number().int().optional(),
    })
    .optional(),
});

export type InlineChunkBundleInput = z.infer<typeof InlineChunkBundleInputSchema>;
