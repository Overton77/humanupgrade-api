import { z } from "zod";
import { Neo4jDateTimeString } from "../utils/dateTimeUtils.js";
import { TemporalValidityInputSchema } from "./TemporalValidityInputs.js";
import { ChunkInputSchema } from "./ChunkInputs.js"; 
import { SearchSurfaceInputSchema } from "./DocumentSearchSurfaceInputs.js"; 
import { DocumentTextVersionInputSchema, SegmentationInputSchema } from "./DocumentationSegmentationInputs.js";



export const UpsertDocumentTextVersionBundleInputSchema = z.object({
  documentId: z.string(), // Document.documentId returned from upsertDocument

  // node payloads
  textVersion: DocumentTextVersionInputSchema,
  segmentation: SegmentationInputSchema,
  chunks: z.array(ChunkInputSchema).min(1),

  // structural edge stamping (since edge schemas have temporal fields)
  hasTextVersionEdge: TemporalValidityInputSchema.optional(),
  hasSegmentationEdge: TemporalValidityInputSchema.optional(),
  segmentationHasChunkEdge: TemporalValidityInputSchema.optional(),
  documentHasChunkEdge: TemporalValidityInputSchema.optional(),
  nextChunkEdge: TemporalValidityInputSchema.optional(),

  alsoCreateDocumentHasChunkEdges: z.boolean().optional().default(true),
  alsoCreateNextChunkEdges: z.boolean().optional().default(true),
});

export type UpsertDocumentTextVersionBundleInput = z.infer<
  typeof UpsertDocumentTextVersionBundleInputSchema
>;
