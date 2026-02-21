import { z } from "zod";
import { Neo4jDateTimeString } from "../utils/dateTimeUtils.js";
import { TemporalValidityInputSchema } from "./TemporalValidityInputs.js";
import { BiomarkerRelateInputSchema, BiomarkerRelateUpdateInputSchema } from "./BiomarkerInputs.js";
import { MeasurementMethodRelateInputSchema, MeasurementMethodRelateUpdateInputSchema } from "./MeasurementMethodInputs.js";
import { SpecimenRelateInputSchema, SpecimenRelateUpdateInputSchema } from "./SpecimenInputs.js";
import { TechnologyPlatformRelateInputSchema, TechnologyPlatformRelateUpdateInputSchema } from "./TechnologyPlatformInputs.js";
import {
  BiomarkerRoleEnum,
  MethodRoleEnum,
  SpecimenRoleEnum,
  CollectionSettingEnum,
  CollectionMethodEnum,
  CollectionTimeWindowEnum,
  ProcessingAdditiveEnum,
  SexEnum,
  MeasurementStateEnum,
  TimeOfDayEnum,
  AppliesWhenEnum,
  ThresholdDirectionEnum,
} from "../enums/index.js";

// ============================================================================
// LabTest Input Schema
// ============================================================================

export const LabTestInputSchema = z.object({
  labTestId: z.string().optional(),
  name: z.string(),
  synonyms: z.array(z.string()).nullable().optional(),
  loincCodes: z.array(z.string()).nullable().optional(),
  cptCodes: z.array(z.string()).nullable().optional(),
  whatItMeasures: z.string().nullable().optional(),
  prepRequirements: z.string().nullable().optional(),
  validAt: Neo4jDateTimeString.optional(),
  invalidAt: Neo4jDateTimeString.optional(),
  expiredAt: Neo4jDateTimeString.optional(),
  createdAt: Neo4jDateTimeString.optional(),
});

export type LabTestInput = z.infer<typeof LabTestInputSchema>;

// ============================================================================
// LabTest Update Input Schema
// ============================================================================

export const LabTestUpdateInputSchema = LabTestInputSchema.partial().extend({
  labTestId: z.string().optional(),
});

export type LabTestUpdateInput = z.infer<typeof LabTestUpdateInputSchema>;

// ============================================================================
// LabTest Relate Input Schema (Create/Connect)
// ============================================================================

export const LabTestRelateInputSchema = z
  .object({
    create: LabTestInputSchema.optional(),
    connect: z.object({ labTestId: z.string() }).optional(),
  })
  .refine((data) => (data.create ? 1 : 0) + (data.connect ? 1 : 0) === 1, {
    message: "Exactly one of 'create' or 'connect' must be provided",
  });

// ============================================================================
// LabTest Relate Update Input Schema (Create/Connect/Update)
// ============================================================================

export const LabTestRelateUpdateInputSchema = z
  .object({
    create: LabTestInputSchema.optional(),
    connect: z.object({ labTestId: z.string() }).optional(),
    update: LabTestUpdateInputSchema.optional(),
  })
  .refine(
    (data) =>
      (data.create ? 1 : 0) + (data.connect ? 1 : 0) + (data.update ? 1 : 0) ===
      1,
    {
      message:
        "Exactly one of 'create', 'connect', or 'update' must be provided",
    }
  );

// ============================================================================
// Relationship Input Schemas (with nested create/connect/update support)
// ============================================================================

// MeasuresBiomarkerRelationshipInput (Create/Connect)
export const MeasuresBiomarkerRelationshipInputSchema =
  TemporalValidityInputSchema.extend({
    biomarker: BiomarkerRelateInputSchema,
    role: BiomarkerRoleEnum.nullable().optional(),
    claimIds: z.array(z.string()).optional(),
  });

export const MeasuresBiomarkerRelationshipUpdateInputSchema =
  TemporalValidityInputSchema.extend({
    biomarker: BiomarkerRelateUpdateInputSchema,
    role: BiomarkerRoleEnum.nullable().optional(),
    claimIds: z.array(z.string()).optional(),
  });

export type MeasuresBiomarkerRelationshipInput = z.infer<
  typeof MeasuresBiomarkerRelationshipInputSchema
>;

// UsesMethodRelationshipInput (Create/Connect)
export const UsesMethodRelationshipInputSchema =
  TemporalValidityInputSchema.extend({
    measurementMethod: MeasurementMethodRelateInputSchema,
    methodRole: MethodRoleEnum.nullable().optional(),
    claimIds: z.array(z.string()).optional(),
  });

export const UsesMethodRelationshipUpdateInputSchema =
  TemporalValidityInputSchema.extend({
    measurementMethod: MeasurementMethodRelateUpdateInputSchema,
    methodRole: MethodRoleEnum.nullable().optional(),
    claimIds: z.array(z.string()).optional(),
  });

export type UsesMethodRelationshipInput = z.infer<
  typeof UsesMethodRelationshipInputSchema
>;

// RequiresSpecimenRelationshipInput (Create/Connect)
export const RequiresSpecimenRelationshipInputSchema =
  TemporalValidityInputSchema.extend({
    specimen: SpecimenRelateInputSchema,
    specimenRole: SpecimenRoleEnum,
    // Collection constraints
    collectionSetting: CollectionSettingEnum.nullable().optional(),
    collectionMethod: CollectionMethodEnum.nullable().optional(),
    fastingRequired: z.boolean().nullable().optional(),
    fastingMinHours: z.number().int().nullable().optional(),
    fastingMaxHours: z.number().int().nullable().optional(),
    requiresAppointment: z.boolean().nullable().optional(),
    requiresColdChainDuringCollection: z.boolean().nullable().optional(),
    collectionTimeWindow: CollectionTimeWindowEnum.nullable().optional(),
    collectionNotes: z.string().nullable().optional(),
    // Processing constraints
    processingMustCentrifuge: z.boolean().nullable().optional(),
    processingCentrifugeWithinMinutes: z.number().int().nullable().optional(),
    processingAliquotRequired: z.boolean().nullable().optional(),
    processingAdditive: ProcessingAdditiveEnum.nullable().optional(),
    processingLightSensitive: z.boolean().nullable().optional(),
    processingMixInversions: z.number().int().nullable().optional(),
    processingMaxRoomTempMinutes: z.number().int().nullable().optional(),
    processingNotes: z.string().nullable().optional(),
    // Stability window
    stabilityAtRoomTempMaxHours: z.number().int().nullable().optional(),
    stabilityRefrigeratedMaxHours: z.number().int().nullable().optional(),
    stabilityFrozenMaxDays: z.number().int().nullable().optional(),
    stabilityMinTempC: z.number().nullable().optional(),
    stabilityMaxTempC: z.number().nullable().optional(),
    stabilityRequiresColdChain: z.boolean().nullable().optional(),
    stabilityNotes: z.string().nullable().optional(),
    // Conditions / context
    populationTags: z.array(z.string()).nullable().optional(),
    sex: SexEnum.nullable().optional(),
    ageMinYears: z.number().int().nullable().optional(),
    ageMaxYears: z.number().int().nullable().optional(),
    measurementState: MeasurementStateEnum.nullable().optional(),
    timeOfDay: TimeOfDayEnum.nullable().optional(),
    conditionTags: z.array(z.string()).nullable().optional(),
    medicationClassTags: z.array(z.string()).nullable().optional(),
    comorbidityTags: z.array(z.string()).nullable().optional(),
    appliesWhen: AppliesWhenEnum.nullable().optional(),
    thresholdDirection: ThresholdDirectionEnum.nullable().optional(),
    thresholdValue: z.number().nullable().optional(),
    thresholdUnit: z.string().nullable().optional(),
    evidenceContextTags: z.array(z.string()).nullable().optional(),
    claimIds: z.array(z.string()).optional(),
  });

export const RequiresSpecimenRelationshipUpdateInputSchema =
  TemporalValidityInputSchema.extend({
    specimen: SpecimenRelateUpdateInputSchema,
    specimenRole: SpecimenRoleEnum.optional(),
    // Collection constraints
    collectionSetting: CollectionSettingEnum.nullable().optional(),
    collectionMethod: CollectionMethodEnum.nullable().optional(),
    fastingRequired: z.boolean().nullable().optional(),
    fastingMinHours: z.number().int().nullable().optional(),
    fastingMaxHours: z.number().int().nullable().optional(),
    requiresAppointment: z.boolean().nullable().optional(),
    requiresColdChainDuringCollection: z.boolean().nullable().optional(),
    collectionTimeWindow: CollectionTimeWindowEnum.nullable().optional(),
    collectionNotes: z.string().nullable().optional(),
    // Processing constraints
    processingMustCentrifuge: z.boolean().nullable().optional(),
    processingCentrifugeWithinMinutes: z.number().int().nullable().optional(),
    processingAliquotRequired: z.boolean().nullable().optional(),
    processingAdditive: ProcessingAdditiveEnum.nullable().optional(),
    processingLightSensitive: z.boolean().nullable().optional(),
    processingMixInversions: z.number().int().nullable().optional(),
    processingMaxRoomTempMinutes: z.number().int().nullable().optional(),
    processingNotes: z.string().nullable().optional(),
    // Stability window
    stabilityAtRoomTempMaxHours: z.number().int().nullable().optional(),
    stabilityRefrigeratedMaxHours: z.number().int().nullable().optional(),
    stabilityFrozenMaxDays: z.number().int().nullable().optional(),
    stabilityMinTempC: z.number().nullable().optional(),
    stabilityMaxTempC: z.number().nullable().optional(),
    stabilityRequiresColdChain: z.boolean().nullable().optional(),
    stabilityNotes: z.string().nullable().optional(),
    // Conditions / context
    populationTags: z.array(z.string()).nullable().optional(),
    sex: SexEnum.nullable().optional(),
    ageMinYears: z.number().int().nullable().optional(),
    ageMaxYears: z.number().int().nullable().optional(),
    measurementState: MeasurementStateEnum.nullable().optional(),
    timeOfDay: TimeOfDayEnum.nullable().optional(),
    conditionTags: z.array(z.string()).nullable().optional(),
    medicationClassTags: z.array(z.string()).nullable().optional(),
    comorbidityTags: z.array(z.string()).nullable().optional(),
    appliesWhen: AppliesWhenEnum.nullable().optional(),
    thresholdDirection: ThresholdDirectionEnum.nullable().optional(),
    thresholdValue: z.number().nullable().optional(),
    thresholdUnit: z.string().nullable().optional(),
    evidenceContextTags: z.array(z.string()).nullable().optional(),
    claimIds: z.array(z.string()).optional(),
  });

export type RequiresSpecimenRelationshipInput = z.infer<
  typeof RequiresSpecimenRelationshipInputSchema
>;

// UsesPlatformRelationshipInput (Create/Connect)
export const LabTestUsesPlatformRelationshipInputSchema =
  TemporalValidityInputSchema.extend({
    technologyPlatform: TechnologyPlatformRelateInputSchema,
    claimIds: z.array(z.string()).optional(),
  });

export const LabTestUsesPlatformRelationshipUpdateInputSchema =
  TemporalValidityInputSchema.extend({
    technologyPlatform: TechnologyPlatformRelateUpdateInputSchema,
    claimIds: z.array(z.string()).optional(),
  });

export type LabTestUsesPlatformRelationshipInput = z.infer<
  typeof LabTestUsesPlatformRelationshipInputSchema
>;

// ============================================================================
// LabTest Input Schema (with Relationships)
// ============================================================================

export const LabTestInputWithRelationsSchema = LabTestInputSchema.extend({
  // Relationships
  measures: z.array(MeasuresBiomarkerRelationshipInputSchema).optional(),
  usesMethod: z.array(UsesMethodRelationshipInputSchema).optional(),
  requiresSpecimen: z.array(RequiresSpecimenRelationshipInputSchema).optional(),
  usesPlatform: z.array(LabTestUsesPlatformRelationshipInputSchema).optional(),
});

export type LabTestInputWithRelations = z.infer<
  typeof LabTestInputWithRelationsSchema
>;

// ============================================================================
// Update LabTest Input Schema (with Relationships)
// ============================================================================

export const UpdateLabTestInputWithRelationsSchema = LabTestUpdateInputSchema.extend({
  // Relationships use update versions
  measures: z.array(MeasuresBiomarkerRelationshipUpdateInputSchema).optional(),
  usesMethod: z.array(UsesMethodRelationshipUpdateInputSchema).optional(),
  requiresSpecimen: z.array(RequiresSpecimenRelationshipUpdateInputSchema).optional(),
  usesPlatform: z.array(LabTestUsesPlatformRelationshipUpdateInputSchema).optional(),
});

export type UpdateLabTestInputWithRelations = z.infer<
  typeof UpdateLabTestInputWithRelationsSchema
>;
