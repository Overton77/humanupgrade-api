import { z } from "zod";
import { Neo4jDateTimeString } from "../utils/dateTimeUtils.js";

// ============================================================================
// MeasurementMethod Schema
// ============================================================================

export const MeasurementMethodSchema = z.object({
  methodId: z.string(),
  canonicalName: z.string(),
  methodFamily: z.string(),
  analyticPrinciple: z.string().nullable(),
  typicalCvPercentMin: z.number().nullable(),
  typicalCvPercentMax: z.number().nullable(),
  validAt: Neo4jDateTimeString,
  invalidAt: Neo4jDateTimeString.nullable(),
  expiredAt: Neo4jDateTimeString.nullable(),
  createdAt: Neo4jDateTimeString,
  updatedAt: Neo4jDateTimeString,
});

export type MeasurementMethod = z.infer<typeof MeasurementMethodSchema>;
