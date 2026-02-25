import { z } from "zod";
import {
  DeviceClassEnum,
  DeviceTypeFamilyEnum,
  ModalityRoleEnum,
  SensorTypeEnum,
  FunctionalMetricTypeEnum,
  FunctionalMetricValueTypeEnum,
  ModalityParameterValueTypeEnum,
} from "../enums/index.js";
import { Neo4jDateTimeString } from "../utils/dateTimeUtils.js";
import { TemporalValidityInputSchema } from "./TemporalValidityInputs.js";
import { TechnologyPlatformInputSchema } from "./TechnologyPlatformInputs.js";

// ============================================================================
// FunctionalMetric
// ============================================================================

export const FunctionalMetricInputSchema = z.object({
  functionalMetricId: z.string().optional(),
  canonicalName: z.string(),
  aliases: z.array(z.string()).nullable().optional(),
  description: z.string().nullable().optional(),
  metricType: FunctionalMetricTypeEnum.nullable().optional(),
  unit: z.string().nullable().optional(),
  valueType: FunctionalMetricValueTypeEnum.nullable().optional(),
  validAt: Neo4jDateTimeString.optional(),
  invalidAt: Neo4jDateTimeString.optional(),
  expiredAt: Neo4jDateTimeString.optional(),
});

export type FunctionalMetricInput = z.infer<typeof FunctionalMetricInputSchema>;

export const FunctionalMetricRelateUpsertInputSchema = z
  .object({
    connect: z.object({ functionalMetricId: z.string() }).optional(),
    connectByKey: z.object({ canonicalName: z.string() }).optional(),
    upsert: FunctionalMetricInputSchema.optional(),
  })
  .refine(
    (data) =>
      (data.connect ? 1 : 0) +
        (data.connectByKey ? 1 : 0) +
        (data.upsert ? 1 : 0) ===
      1,
    {
      message:
        "FunctionalMetricRelateUpsertInput: exactly one of 'connect', 'connectByKey', or 'upsert' must be provided",
    }
  );

export type FunctionalMetricRelateUpsertInput = z.infer<
  typeof FunctionalMetricRelateUpsertInputSchema
>;

// ============================================================================
// DeviceType
// ============================================================================

export const DeviceTypeInputSchema = z.object({
  deviceTypeId: z.string().optional(),
  canonicalName: z.string(),
  description: z.string().nullable().optional(),
  deviceTypeFamily: DeviceTypeFamilyEnum.nullable().optional(),
  validAt: Neo4jDateTimeString.optional(),
  invalidAt: Neo4jDateTimeString.optional(),
  expiredAt: Neo4jDateTimeString.optional(),
});

export type DeviceTypeInput = z.infer<typeof DeviceTypeInputSchema>;

export const DeviceTypeRelateUpsertInputSchema = z
  .object({
    connect: z.object({ deviceTypeId: z.string() }).optional(),
    connectByKey: z.object({ canonicalName: z.string() }).optional(),
    upsert: DeviceTypeInputSchema.optional(),
  })
  .refine(
    (data) =>
      (data.connect ? 1 : 0) +
        (data.connectByKey ? 1 : 0) +
        (data.upsert ? 1 : 0) ===
      1,
    {
      message:
        "DeviceTypeRelateUpsertInput: exactly one of 'connect', 'connectByKey', or 'upsert' must be provided",
    }
  );

export type DeviceTypeRelateUpsertInput = z.infer<
  typeof DeviceTypeRelateUpsertInputSchema
>;

// ============================================================================
// ModalityType
// ============================================================================

export const ModalityTypeInputSchema = z.object({
  modalityTypeId: z.string().optional(),
  canonicalName: z.string(),
  description: z.string().nullable().optional(),
  validAt: Neo4jDateTimeString.optional(),
  invalidAt: Neo4jDateTimeString.optional(),
  expiredAt: Neo4jDateTimeString.optional(),
});

export type ModalityTypeInput = z.infer<typeof ModalityTypeInputSchema>;

export const ModalityTypeRelateUpsertInputSchema = z
  .object({
    connect: z.object({ modalityTypeId: z.string() }).optional(),
    connectByKey: z.object({ canonicalName: z.string() }).optional(),
    upsert: ModalityTypeInputSchema.optional(),
  })
  .refine(
    (data) =>
      (data.connect ? 1 : 0) +
        (data.connectByKey ? 1 : 0) +
        (data.upsert ? 1 : 0) ===
      1,
    {
      message:
        "ModalityTypeRelateUpsertInput: exactly one of 'connect', 'connectByKey', or 'upsert' must be provided",
    }
  );

export type ModalityTypeRelateUpsertInput = z.infer<
  typeof ModalityTypeRelateUpsertInputSchema
>;

// ============================================================================
// ModalityParameter
// ============================================================================

export const ModalityParameterInputSchema = z.object({
  modalityParameterId: z.string().optional(),
  canonicalName: z.string(),
  description: z.string().nullable().optional(),
  parameterKey: z.string().nullable().optional(),
  valueType: ModalityParameterValueTypeEnum.nullable().optional(),
  defaultValue: z.string().nullable().optional(),
  unit: z.string().nullable().optional(),
  validAt: Neo4jDateTimeString.optional(),
  invalidAt: Neo4jDateTimeString.optional(),
  expiredAt: Neo4jDateTimeString.optional(),
});

export type ModalityParameterInput = z.infer<
  typeof ModalityParameterInputSchema
>;

export const ModalityParameterRelateUpsertInputSchema = z
  .object({
    connect: z.object({ modalityParameterId: z.string() }).optional(),
    connectByKey: z.object({ canonicalName: z.string() }).optional(),
    upsert: ModalityParameterInputSchema.optional(),
  })
  .refine(
    (data) =>
      (data.connect ? 1 : 0) +
        (data.connectByKey ? 1 : 0) +
        (data.upsert ? 1 : 0) ===
      1,
    {
      message:
        "ModalityParameterRelateUpsertInput: exactly one of 'connect', 'connectByKey', or 'upsert' must be provided",
    }
  );

export type ModalityParameterRelateUpsertInput = z.infer<
  typeof ModalityParameterRelateUpsertInputSchema
>;

// ============================================================================
// TechnologyPlatform (RelateUpsert for Device.implementsPlatform)
// ============================================================================

export const TechnologyPlatformRelateUpsertInputSchema = z
  .object({
    connect: z.object({ platformId: z.string() }).optional(),
    connectByKey: z.object({ canonicalName: z.string() }).optional(),
    upsert: TechnologyPlatformInputSchema.optional(),
  })
  .refine(
    (data) =>
      (data.connect ? 1 : 0) +
        (data.connectByKey ? 1 : 0) +
        (data.upsert ? 1 : 0) ===
      1,
    {
      message:
        "TechnologyPlatformRelateUpsertInput: exactly one of 'connect', 'connectByKey', or 'upsert' must be provided",
    }
  );

export type TechnologyPlatformRelateUpsertInput = z.infer<
  typeof TechnologyPlatformRelateUpsertInputSchema
>;

// ============================================================================
// Sensor — edge input then input + RelateUpsert
// ============================================================================

const SensorMeasuresMetricEdgeInputSchema = TemporalValidityInputSchema.extend({
  functionalMetric: FunctionalMetricRelateUpsertInputSchema,
  signalType: z.string().nullable().optional(),
  unit: z.string().nullable().optional(),
  samplingRateHz: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const SensorInputSchema = z.object({
  sensorId: z.string().optional(),
  canonicalName: z.string(),
  aliases: z.array(z.string()).nullable().optional(),
  description: z.string().nullable().optional(),
  sensorType: SensorTypeEnum.nullable().optional(),
  validAt: Neo4jDateTimeString.optional(),
  invalidAt: Neo4jDateTimeString.optional(),
  expiredAt: Neo4jDateTimeString.optional(),
  measuresMetric: z.array(SensorMeasuresMetricEdgeInputSchema).optional(),
});

export type SensorInput = z.infer<typeof SensorInputSchema>;

export const SensorRelateUpsertInputSchema = z
  .object({
    connect: z.object({ sensorId: z.string() }).optional(),
    connectByKey: z.object({ canonicalName: z.string() }).optional(),
    upsert: SensorInputSchema.optional(),
  })
  .refine(
    (data) =>
      (data.connect ? 1 : 0) +
        (data.connectByKey ? 1 : 0) +
        (data.upsert ? 1 : 0) ===
      1,
    {
      message:
        "SensorRelateUpsertInput: exactly one of 'connect', 'connectByKey', or 'upsert' must be provided",
    }
  );

export type SensorRelateUpsertInput = z.infer<
  typeof SensorRelateUpsertInputSchema
>;

// ============================================================================
// Modality — edge inputs then input + RelateUpsert
// ============================================================================

const ModalityInstanceOfEdgeInputSchema = TemporalValidityInputSchema.extend({
  modalityType: ModalityTypeRelateUpsertInputSchema,
});

const ModalityHasParameterEdgeInputSchema = TemporalValidityInputSchema.extend({
  modalityParameter: ModalityParameterRelateUpsertInputSchema,
  value: z.string().nullable().optional(),
  unit: z.string().nullable().optional(),
  min: z.number().nullable().optional(),
  max: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const ModalityInputSchema = z.object({
  modalityId: z.string().optional(),
  canonicalName: z.string(),
  description: z.string().nullable().optional(),
  modalityRole: ModalityRoleEnum.nullable().optional(),
  validAt: Neo4jDateTimeString.optional(),
  invalidAt: Neo4jDateTimeString.optional(),
  expiredAt: Neo4jDateTimeString.optional(),
  instanceOf: z.array(ModalityInstanceOfEdgeInputSchema).optional(),
  hasParameter: z.array(ModalityHasParameterEdgeInputSchema).optional(),
});

export type ModalityInput = z.infer<typeof ModalityInputSchema>;

export const ModalityRelateUpsertInputSchema = z
  .object({
    connect: z.object({ modalityId: z.string() }).optional(),
    connectByKey: z.object({ canonicalName: z.string() }).optional(),
    upsert: ModalityInputSchema.optional(),
  })
  .refine(
    (data) =>
      (data.connect ? 1 : 0) +
        (data.connectByKey ? 1 : 0) +
        (data.upsert ? 1 : 0) ===
      1,
    {
      message:
        "ModalityRelateUpsertInput: exactly one of 'connect', 'connectByKey', or 'upsert' must be provided",
    }
  );

export type ModalityRelateUpsertInput = z.infer<
  typeof ModalityRelateUpsertInputSchema
>;

// ============================================================================
// Device — edge inputs then input + RelateUpsert
// ============================================================================

const DeviceOfTypeEdgeInputSchema = TemporalValidityInputSchema.extend({
  deviceType: DeviceTypeRelateUpsertInputSchema,
});

const DeviceUsesModalityEdgeInputSchema = TemporalValidityInputSchema.extend({
  modality: ModalityRelateUpsertInputSchema,
  purpose: z.string().nullable().optional(),
  primary: z.boolean().nullable().optional(),
});

const DeviceHasSensorEdgeInputSchema = TemporalValidityInputSchema.extend({
  sensor: SensorRelateUpsertInputSchema,
  count: z.number().int().nullable().optional(),
  location: z.string().nullable().optional(),
});

const DeviceImplementsPlatformEdgeInputSchema =
  TemporalValidityInputSchema.extend({
    technologyPlatform: TechnologyPlatformRelateUpsertInputSchema,
    notes: z.string().nullable().optional(),
  });

const DeviceMeasuresMetricEdgeInputSchema = TemporalValidityInputSchema.extend({
  functionalMetric: FunctionalMetricRelateUpsertInputSchema,
  method: z.string().nullable().optional(),
  accuracy: z.string().nullable().optional(),
  rangeMin: z.number().nullable().optional(),
  rangeMax: z.number().nullable().optional(),
  unit: z.string().nullable().optional(),
});

export const DeviceInputSchema = z.object({
  deviceId: z.string().optional(),
  canonicalName: z.string(),
  aliases: z.array(z.string()).nullable().optional(),
  description: z.string().nullable().optional(),
  deviceClass: DeviceClassEnum.nullable().optional(),
  intendedUse: z.string().nullable().optional(),
  version: z.string().nullable().optional(),
  validAt: Neo4jDateTimeString.optional(),
  invalidAt: Neo4jDateTimeString.optional(),
  expiredAt: Neo4jDateTimeString.optional(),
  ofType: z.array(DeviceOfTypeEdgeInputSchema).optional(),
  usesModality: z.array(DeviceUsesModalityEdgeInputSchema).optional(),
  hasSensor: z.array(DeviceHasSensorEdgeInputSchema).optional(),
  implementsPlatform: z.array(DeviceImplementsPlatformEdgeInputSchema).optional(),
  measuresMetric: z.array(DeviceMeasuresMetricEdgeInputSchema).optional(),
});

export type DeviceInput = z.infer<typeof DeviceInputSchema>;

export const DeviceRelateUpsertInputSchema = z
  .object({
    connect: z.object({ deviceId: z.string() }).optional(),
    connectByKey: z.object({ canonicalName: z.string() }).optional(),
    upsert: DeviceInputSchema.optional(),
  })
  .refine(
    (data) =>
      (data.connect ? 1 : 0) +
        (data.connectByKey ? 1 : 0) +
        (data.upsert ? 1 : 0) ===
      1,
    {
      message:
        "DeviceRelateUpsertInput: exactly one of 'connect', 'connectByKey', or 'upsert' must be provided",
    }
  );

export type DeviceRelateUpsertInput = z.infer<
  typeof DeviceRelateUpsertInputSchema
>;

// ============================================================================
// Upsert input schemas (for mutations)
// ============================================================================

export const UpsertFunctionalMetricInputSchema = FunctionalMetricInputSchema;

export type UpsertFunctionalMetricInput = z.infer<
  typeof UpsertFunctionalMetricInputSchema
>;

export const UpsertDeviceTypeInputSchema = DeviceTypeInputSchema;

export type UpsertDeviceTypeInput = z.infer<
  typeof UpsertDeviceTypeInputSchema
>;

export const UpsertModalityTypeInputSchema = ModalityTypeInputSchema;

export type UpsertModalityTypeInput = z.infer<
  typeof UpsertModalityTypeInputSchema
>;

export const UpsertModalityParameterInputSchema = ModalityParameterInputSchema;

export type UpsertModalityParameterInput = z.infer<
  typeof UpsertModalityParameterInputSchema
>;

export const UpsertSensorInputSchema = SensorInputSchema;

export type UpsertSensorInput = z.infer<typeof UpsertSensorInputSchema>;

export const UpsertModalityInputSchema = ModalityInputSchema;

export type UpsertModalityInput = z.infer<typeof UpsertModalityInputSchema>;

export const UpsertDeviceInputSchema = DeviceInputSchema;

export type UpsertDeviceInput = z.infer<typeof UpsertDeviceInputSchema>;
