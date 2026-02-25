import { z } from "zod";
import { SensorTypeEnum } from "../enums/index.js";
import { Neo4jDateTimeString } from "../utils/dateTimeUtils.js";
import { TemporalValiditySchema } from "./TemporalValidityModel.js";
import { FunctionalMetricSchema } from "./FunctionalMetricModel.js";

// ============================================================================
// Edge: Sensor -[:MEASURES_METRIC]-> FunctionalMetric
// ============================================================================

export const SensorMeasuresMetricEdgeSchema = TemporalValiditySchema.extend({
  functionalMetric: FunctionalMetricSchema,
  signalType: z.string().nullable(),
  unit: z.string().nullable(),
  samplingRateHz: z.number().nullable(),
  notes: z.string().nullable(),
});

export type SensorMeasuresMetricEdge = z.infer<
  typeof SensorMeasuresMetricEdgeSchema
>;

// ============================================================================
// Sensor Schema
// ============================================================================

export const SensorSchema = z.object({
  sensorId: z.string(),
  canonicalName: z.string(),
  aliases: z.array(z.string()).nullable(),
  description: z.string().nullable(),
  sensorType: SensorTypeEnum.nullable(),
  validAt: Neo4jDateTimeString,
  invalidAt: Neo4jDateTimeString.nullable(),
  expiredAt: Neo4jDateTimeString.nullable(),
  createdAt: Neo4jDateTimeString,

  // Relationships
  measuresMetric: z.array(SensorMeasuresMetricEdgeSchema).nullable(),
});

export type Sensor = z.infer<typeof SensorSchema>;
