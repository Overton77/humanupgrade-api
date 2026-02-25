import { z } from "zod";
import {
  FunctionalMetricTypeEnum,
  FunctionalMetricValueTypeEnum,
} from "../enums/index.js";
import { Neo4jDateTimeString } from "../utils/dateTimeUtils.js";

// ============================================================================
// FunctionalMetric Schema
// ============================================================================

export const FunctionalMetricSchema = z.object({
  functionalMetricId: z.string(),
  canonicalName: z.string(),
  aliases: z.array(z.string()).nullable(),
  description: z.string().nullable(),
  metricType: FunctionalMetricTypeEnum.nullable(),
  unit: z.string().nullable(),
  valueType: FunctionalMetricValueTypeEnum.nullable(),
  validAt: Neo4jDateTimeString,
  invalidAt: Neo4jDateTimeString.nullable(),
  expiredAt: Neo4jDateTimeString.nullable(),
  createdAt: Neo4jDateTimeString,
});

export type FunctionalMetric = z.infer<typeof FunctionalMetricSchema>;
