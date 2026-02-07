import { z } from "zod";
import { TemporalValiditySchema } from "./TemporalValidityModel.js";
import { ChunkSchema } from "./ChunkModel.js";

export const SegmentationHasChunkEdgeSchema = TemporalValiditySchema.extend({
  chunk: ChunkSchema,
});
export type SegmentationHasChunkEdge = z.infer<typeof SegmentationHasChunkEdgeSchema>;
