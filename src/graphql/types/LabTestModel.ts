import { z } from "zod";
import { Neo4jDateTimeString } from "../utils/dateTimeUtils.js";

// ============================================================================
// LabTest Schema
// ============================================================================

export const LabTestSchema = z.object({
  labTestId: z.string(),
  name: z.string(),
  synonyms: z.array(z.string()).nullable(),
  loincCodes: z.array(z.string()).nullable(),
  cptCodes: z.array(z.string()).nullable(),
  whatItMeasures: z.string().nullable(),
  prepRequirements: z.string().nullable(),
  validAt: Neo4jDateTimeString,
  invalidAt: Neo4jDateTimeString.nullable(),
  expiredAt: Neo4jDateTimeString.nullable(),
  createdAt: Neo4jDateTimeString,
  updatedAt: Neo4jDateTimeString,
});

export type LabTest = z.infer<typeof LabTestSchema>;

