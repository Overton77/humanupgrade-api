import { z } from "zod";
import { Neo4jDateTimeString } from "../utils/dateTimeUtils.js";

// ============================================================================
// Specimen Schema
// ============================================================================

export const SpecimenSchema = z.object({
  specimenId: z.string(),
  canonicalName: z.string(),
  specimenType: z.string(),
  matrix: z.string().nullable(),
  biologicalDomain: z.string(),
  collectionContextCategory: z.string(),
  validAt: Neo4jDateTimeString,
  invalidAt: Neo4jDateTimeString.nullable(),
  expiredAt: Neo4jDateTimeString.nullable(),
  createdAt: Neo4jDateTimeString,
  updatedAt: Neo4jDateTimeString,
});

export type Specimen = z.infer<typeof SpecimenSchema>;
