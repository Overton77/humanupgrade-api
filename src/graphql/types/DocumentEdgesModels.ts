import { z } from "zod";
import { TemporalValiditySchema } from "./TemporalValidityModel.js";
import { DocumentTextVersionSchema } from "./DocumentTextVersionModel.js";
import { ChunkSchema } from "./ChunkModel.js";
import { ResearchRunRefSchema } from "./ResearchRunRefModel.js";
import { Neo4jDateTimeString } from "../utils/dateTimeUtils.js";

export const HasTextVersionEdgeSchema = TemporalValiditySchema.extend({
  documentTextVersion: DocumentTextVersionSchema,
});
export type HasTextVersionEdge = z.infer<typeof HasTextVersionEdgeSchema>;

export const DocumentHasChunkEdgeSchema = TemporalValiditySchema.extend({
  chunk: ChunkSchema,
});
export type DocumentHasChunkEdge = z.infer<typeof DocumentHasChunkEdgeSchema>;

export const GeneratedByEdgeSchema = TemporalValiditySchema.extend({
  researchRunRef: ResearchRunRefSchema,
  operation: z.string(),
  stageKey: z.string().nullable(),
  subStageKey: z.string().nullable(),
  extractorVersion: z.string().nullable(),
  extractedAt: Neo4jDateTimeString,
});
export type GeneratedByEdge = z.infer<typeof GeneratedByEdgeSchema>;
