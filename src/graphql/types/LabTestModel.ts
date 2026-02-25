import { z } from "zod";
import { Neo4jDateTimeString } from "../utils/dateTimeUtils.js";
import { TemporalValiditySchema } from "./TemporalValidityModel.js";
import { BiomarkerSchema } from "./BiomarkerModel.js";
import { MeasurementMethodSchema } from "./MeasurementMethodModel.js";
import { SpecimenSchema } from "./SpecimenModel.js";
import { TechnologyPlatformSchema } from "./TechnologyPlatformModel.js";
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
// Edge: LabTest -[:MEASURES]-> Biomarker
// ============================================================================

export const MeasuresBiomarkerEdgeSchema = TemporalValiditySchema.extend({
  biomarker: BiomarkerSchema,
  role: BiomarkerRoleEnum.nullable(),
  claimIds: z.array(z.string()).nullable(),
});

export type MeasuresBiomarkerEdge = z.infer<typeof MeasuresBiomarkerEdgeSchema>;

// ============================================================================
// Edge: LabTest -[:USES_METHOD]-> MeasurementMethod
// ============================================================================

export const UsesMethodEdgeSchema = TemporalValiditySchema.extend({
  measurementMethod: MeasurementMethodSchema,
  methodRole: MethodRoleEnum.nullable(),
  claimIds: z.array(z.string()).nullable(),
});

export type UsesMethodEdge = z.infer<typeof UsesMethodEdgeSchema>;

// ============================================================================
// Edge: LabTest -[:REQUIRES_SPECIMEN]-> Specimen
// ============================================================================

export const RequiresSpecimenEdgeSchema = TemporalValiditySchema.extend({
  specimen: SpecimenSchema,
  specimenRole: SpecimenRoleEnum,
  collectionSetting: CollectionSettingEnum.nullable(),
  collectionMethod: CollectionMethodEnum.nullable(),
  fastingRequired: z.boolean().nullable(),
  fastingMinHours: z.number().int().nullable(),
  fastingMaxHours: z.number().int().nullable(),
  requiresAppointment: z.boolean().nullable(),
  requiresColdChainDuringCollection: z.boolean().nullable(),
  collectionTimeWindow: CollectionTimeWindowEnum.nullable(),
  collectionNotes: z.string().nullable(),
  processingMustCentrifuge: z.boolean().nullable(),
  processingCentrifugeWithinMinutes: z.number().int().nullable(),
  processingAliquotRequired: z.boolean().nullable(),
  processingAdditive: ProcessingAdditiveEnum.nullable(),
  processingLightSensitive: z.boolean().nullable(),
  processingMixInversions: z.number().int().nullable(),
  processingMaxRoomTempMinutes: z.number().int().nullable(),
  processingNotes: z.string().nullable(),
  stabilityAtRoomTempMaxHours: z.number().int().nullable(),
  stabilityRefrigeratedMaxHours: z.number().int().nullable(),
  stabilityFrozenMaxDays: z.number().int().nullable(),
  stabilityMinTempC: z.number().nullable(),
  stabilityMaxTempC: z.number().nullable(),
  stabilityRequiresColdChain: z.boolean().nullable(),
  stabilityNotes: z.string().nullable(),
  populationTags: z.array(z.string()).nullable(),
  sex: SexEnum.nullable(),
  ageMinYears: z.number().int().nullable(),
  ageMaxYears: z.number().int().nullable(),
  measurementState: MeasurementStateEnum.nullable(),
  timeOfDay: TimeOfDayEnum.nullable(),
  conditionTags: z.array(z.string()).nullable(),
  medicationClassTags: z.array(z.string()).nullable(),
  comorbidityTags: z.array(z.string()).nullable(),
  appliesWhen: AppliesWhenEnum.nullable(),
  thresholdDirection: ThresholdDirectionEnum.nullable(),
  thresholdValue: z.number().nullable(),
  thresholdUnit: z.string().nullable(),
  evidenceContextTags: z.array(z.string()).nullable(),
  claimIds: z.array(z.string()).nullable(),
});

export type RequiresSpecimenEdge = z.infer<typeof RequiresSpecimenEdgeSchema>;

// ============================================================================
// Edge: LabTest -[:USES_PLATFORM]-> TechnologyPlatform
// ============================================================================

export const LabTestUsesPlatformEdgeSchema = TemporalValiditySchema.extend({
  technologyPlatform: TechnologyPlatformSchema,
  claimIds: z.array(z.string()).nullable(),
});

export type LabTestUsesPlatformEdge = z.infer<
  typeof LabTestUsesPlatformEdgeSchema
>;

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

  // Relationships
  measures: z.array(MeasuresBiomarkerEdgeSchema).nullable(),
  usesMethod: z.array(UsesMethodEdgeSchema).nullable(),
  requiresSpecimen: z.array(RequiresSpecimenEdgeSchema).nullable(),
  usesPlatform: z.array(LabTestUsesPlatformEdgeSchema).nullable(),
});

export type LabTest = z.infer<typeof LabTestSchema>;
