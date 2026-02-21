import { z } from "zod";
import { Neo4jDateTimeString } from "../utils/dateTimeUtils.js";

// ============================================================================
// Biomarker Schema
// ============================================================================

export const BiomarkerSchema = z.object({
  biomarkerId: z.string(),
  name: z.string(),
  synonyms: z.array(z.string()).nullable(),
  description: z.string().nullable(),
  clinicalDomains: z.array(z.string()).nullable(),
  unitsCommon: z.array(z.string()).nullable(),
  interpretationNotes: z.string().nullable(),
  validAt: Neo4jDateTimeString,
  invalidAt: Neo4jDateTimeString.nullable(),
  expiredAt: Neo4jDateTimeString.nullable(),
  createdAt: Neo4jDateTimeString,
  updatedAt: Neo4jDateTimeString,
});

export type Biomarker = z.infer<typeof BiomarkerSchema>;
