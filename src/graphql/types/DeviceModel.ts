import { z } from "zod";
import { DeviceClassEnum } from "../enums/index.js";
import { Neo4jDateTimeString } from "../utils/dateTimeUtils.js";
import { TemporalValiditySchema } from "./TemporalValidityModel.js";
import { DeviceTypeSchema } from "./DeviceTypeModel.js";
import { ModalitySchema } from "./ModalityModel.js";
import { SensorSchema } from "./SensorModel.js";
import { TechnologyPlatformSchema } from "./TechnologyPlatformModel.js";
import { FunctionalMetricSchema } from "./FunctionalMetricModel.js";

// ============================================================================
// Edge: Device -[:OF_TYPE]-> DeviceType
// ============================================================================

export const DeviceOfTypeEdgeSchema = TemporalValiditySchema.extend({
  deviceType: DeviceTypeSchema,
});

export type DeviceOfTypeEdge = z.infer<typeof DeviceOfTypeEdgeSchema>;

// ============================================================================
// Edge: Device -[:USES_MODALITY]-> Modality
// ============================================================================

export const DeviceUsesModalityEdgeSchema = TemporalValiditySchema.extend({
  modality: ModalitySchema,
  purpose: z.string().nullable(),
  primary: z.boolean().nullable(),
});

export type DeviceUsesModalityEdge = z.infer<typeof DeviceUsesModalityEdgeSchema>;

// ============================================================================
// Edge: Device -[:HAS_SENSOR]-> Sensor
// ============================================================================

export const DeviceHasSensorEdgeSchema = TemporalValiditySchema.extend({
  sensor: SensorSchema,
  count: z.number().int().nullable(),
  location: z.string().nullable(),
});

export type DeviceHasSensorEdge = z.infer<typeof DeviceHasSensorEdgeSchema>;

// ============================================================================
// Edge: Device -[:IMPLEMENTS_PLATFORM]-> TechnologyPlatform
// ============================================================================

export const DeviceImplementsPlatformEdgeSchema = TemporalValiditySchema.extend({
  technologyPlatform: TechnologyPlatformSchema,
  notes: z.string().nullable(),
});

export type DeviceImplementsPlatformEdge = z.infer<
  typeof DeviceImplementsPlatformEdgeSchema
>;

// ============================================================================
// Edge: Device -[:MEASURES_METRIC]-> FunctionalMetric (convenience edge)
// ============================================================================

export const DeviceMeasuresMetricEdgeSchema = TemporalValiditySchema.extend({
  functionalMetric: FunctionalMetricSchema,
  method: z.string().nullable(),
  accuracy: z.string().nullable(),
  rangeMin: z.number().nullable(),
  rangeMax: z.number().nullable(),
  unit: z.string().nullable(),
});

export type DeviceMeasuresMetricEdge = z.infer<
  typeof DeviceMeasuresMetricEdgeSchema
>;

// ============================================================================
// Device Schema
// ============================================================================

export const DeviceSchema = z.object({
  deviceId: z.string(),
  canonicalName: z.string(),
  aliases: z.array(z.string()).nullable(),
  description: z.string().nullable(),
  deviceClass: DeviceClassEnum.nullable(),
  intendedUse: z.string().nullable(),
  version: z.string().nullable(),
  validAt: Neo4jDateTimeString,
  invalidAt: Neo4jDateTimeString.nullable(),
  expiredAt: Neo4jDateTimeString.nullable(),
  createdAt: Neo4jDateTimeString,

  // Relationships
  ofType: z.array(DeviceOfTypeEdgeSchema).nullable(),
  usesModality: z.array(DeviceUsesModalityEdgeSchema).nullable(),
  hasSensor: z.array(DeviceHasSensorEdgeSchema).nullable(),
  implementsPlatform: z.array(DeviceImplementsPlatformEdgeSchema).nullable(),
  measuresMetric: z.array(DeviceMeasuresMetricEdgeSchema).nullable(),
});

export type Device = z.infer<typeof DeviceSchema>;
