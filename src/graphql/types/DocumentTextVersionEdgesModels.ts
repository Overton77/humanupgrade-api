import { z } from "zod";
import { TemporalValiditySchema } from "./TemporalValidityModel.js";
import { SegmentationSchema } from "./SegmentationModel.js";

export const HasSegmentationEdgeSchema = TemporalValiditySchema.extend({
  segmentation: SegmentationSchema,
});
export type HasSegmentationEdge = z.infer<typeof HasSegmentationEdgeSchema>;
