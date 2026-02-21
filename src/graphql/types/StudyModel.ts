import { z } from "zod";
import { Neo4jDateTimeString } from "../utils/dateTimeUtils.js";
import { TemporalValiditySchema } from "./TemporalValidityModel.js";
import {
  StudyKindEnum,
  DesignKindEnum,
  StudyStatusEnum,
  BlindedKindEnum,
  ComparatorTypeEnum,
  PopulationKindEnum,
  DatasetKindEnum,
  DatasetAccessLevelEnum,
  OutcomeCategoryEnum,
  PolarityHintEnum,
  OutcomeDomainEnum,
  OutcomeMeasurementTypeEnum,
  EvaluatesTargetKindEnum,
  StudyEvaluatesRoleEnum,
  StudySponsorRoleEnum,
  StudyRunByRoleEnum,
  StudyInvestigatorRoleEnum,
  StudyPopulationRoleEnum,
  StudyDatasetRoleEnum,
  StudyInvestigatesRoleEnum,
  StudyOutcomePriorityEnum,
  StudyOutcomeRoleEnum,
  SexEnum,
} from "../enums/index.js";
import { PersonSchema } from "./PersonModel.js";

// ============================================================================
// Related Node Schemas (output shapes)
// ============================================================================



export const PopulationSchema = z.object({
  populationId: z.string(),
  name: z.string().nullable(),
  populationKind: PopulationKindEnum,
  species: z.string().nullable(),
  strain: z.string().nullable(),
  cellLine: z.string().nullable(),
  diseaseState: z.string().nullable(),
  ageMin: z.number().int().nullable(),
  ageMax: z.number().int().nullable(),
  ageUnit: z.string().nullable(),
  sex: SexEnum.nullable(),
  n: z.number().int().nullable(),
  inclusionCriteria: z.array(z.string()).nullable(),
  exclusionCriteria: z.array(z.string()).nullable(),
  validAt: Neo4jDateTimeString.nullable(),
  invalidAt: Neo4jDateTimeString.nullable(),
  expiredAt: Neo4jDateTimeString.nullable(),
  createdAt: Neo4jDateTimeString.nullable(),
});

export type Population = z.infer<typeof PopulationSchema>;

export const DatasetSchema = z.object({
  datasetId: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  datasetKind: DatasetKindEnum,
  format: z.string().nullable(),
  license: z.string().nullable(),
  accessLevel: DatasetAccessLevelEnum.nullable(),
  sourceSystem: z.string().nullable(),
  uri: z.string().nullable(),
  checksum: z.string().nullable(),
  version: z.string().nullable(),
  publishedAt: Neo4jDateTimeString.nullable(),
  validAt: Neo4jDateTimeString.nullable(),
  invalidAt: Neo4jDateTimeString.nullable(),
  expiredAt: Neo4jDateTimeString.nullable(),
  createdAt: Neo4jDateTimeString.nullable(),
});

export type Dataset = z.infer<typeof DatasetSchema>;

export const StudyOutcomeSchema = z.object({
  studyOutcomeId: z.string(),
  canonicalName: z.string(),
  displayName: z.string().nullable(),
  aliases: z.array(z.string()).nullable(),
  description: z.string().nullable(),
  outcomeCategory: OutcomeCategoryEnum,
  polarityHint: PolarityHintEnum.nullable(),
  domain: OutcomeDomainEnum.nullable(),
  measurementType: OutcomeMeasurementTypeEnum.nullable(),
  unit: z.string().nullable(),
  biologicalMatrix: z.string().nullable(),
  analyte: z.string().nullable(),
  timeHorizon: z.string().nullable(),
  standardSystem: z.string().nullable(),
  standardCode: z.string().nullable(),
  standardLabel: z.string().nullable(),
  validAt: Neo4jDateTimeString.nullable(),
  invalidAt: Neo4jDateTimeString.nullable(),
  expiredAt: Neo4jDateTimeString.nullable(),
  createdAt: Neo4jDateTimeString.nullable(),
});

export type StudyOutcome = z.infer<typeof StudyOutcomeSchema>;

export const ConditionSchema = z.object({
  conditionId: z.string(),
  name: z.string(),
  aliases: z.array(z.string()).nullable(),
  description: z.string().nullable(),
  icdCodes: z.array(z.string()).nullable(),
  snomedCodes: z.array(z.string()).nullable(),
  meshTerms: z.array(z.string()).nullable(),
  validAt: Neo4jDateTimeString.nullable(),
  invalidAt: Neo4jDateTimeString.nullable(),
  expiredAt: Neo4jDateTimeString.nullable(),
  createdAt: Neo4jDateTimeString.nullable(),
});

export type Condition = z.infer<typeof ConditionSchema>;

// ============================================================================
// Edge Audit (shared relationship temporal + provenance fields)
// ============================================================================

export const EdgeAuditSchema = z.object({
  strength: z.number().nullable(),
  extractorVersion: z.string().nullable(),
  extractedAt: Neo4jDateTimeString.nullable(),
  validAt: Neo4jDateTimeString.nullable(),
  invalidAt: Neo4jDateTimeString.nullable(),
  expiredAt: Neo4jDateTimeString.nullable(),
  createdAt: Neo4jDateTimeString.nullable(),
});

// ============================================================================
// Study Edge Type Schemas (relationship properties + related node)
// ============================================================================

/**
 * EVALUATES edge — polymorphic target.
 * `targetKind` tells you which nullable node field is populated.
 * compoundId / foodId / foodVariantId are ID stubs until those node types exist.
 */
export const StudyEvaluatesEdgeSchema = EdgeAuditSchema.extend({
  targetKind: EvaluatesTargetKindEnum,
  // populated node (only one will be non-null based on kind)
  productId: z.string().nullable(),
  compoundFormId: z.string().nullable(),
  compoundId: z.string().nullable(),
  foodId: z.string().nullable(),
  foodVariantId: z.string().nullable(),
  role: StudyEvaluatesRoleEnum,
});

export type StudyEvaluatesEdge = z.infer<typeof StudyEvaluatesEdgeSchema>;

export const StudySponsoredByEdgeSchema = EdgeAuditSchema.extend({
  organizationId: z.string(),
  role: StudySponsorRoleEnum.nullable(),
});

export type StudySponsoredByEdge = z.infer<typeof StudySponsoredByEdgeSchema>;

export const StudyRunByEdgeSchema = EdgeAuditSchema.extend({
  organizationId: z.string(),
  role: StudyRunByRoleEnum.nullable(),
});

export type StudyRunByEdge = z.infer<typeof StudyRunByEdgeSchema>;

export const StudyInvestigatedByEdgeSchema = EdgeAuditSchema.extend({
  person: PersonSchema,
  role: StudyInvestigatorRoleEnum.nullable(),
  affiliation: z.string().nullable(),
});

export type StudyInvestigatedByEdge = z.infer<
  typeof StudyInvestigatedByEdgeSchema
>;

export const StudyStudiesPopulationEdgeSchema = EdgeAuditSchema.extend({
  population: PopulationSchema,
  role: StudyPopulationRoleEnum.nullable(),
});

export type StudyStudiesPopulationEdge = z.infer<
  typeof StudyStudiesPopulationEdgeSchema
>;

export const StudyHasDatasetEdgeSchema = EdgeAuditSchema.extend({
  dataset: DatasetSchema,
  role: StudyDatasetRoleEnum.nullable(),
  accessNotes: z.string().nullable(),
});

export type StudyHasDatasetEdge = z.infer<typeof StudyHasDatasetEdgeSchema>;

export const StudyInvestigatesConditionEdgeSchema = EdgeAuditSchema.extend({
  condition: ConditionSchema,
  role: StudyInvestigatesRoleEnum.nullable(),
});

export type StudyInvestigatesConditionEdge = z.infer<
  typeof StudyInvestigatesConditionEdgeSchema
>;

export const StudyHasOutcomeEdgeSchema = EdgeAuditSchema.extend({
  outcome: StudyOutcomeSchema,
  priority: StudyOutcomePriorityEnum,
  role: StudyOutcomeRoleEnum.nullable(),
});

export type StudyHasOutcomeEdge = z.infer<typeof StudyHasOutcomeEdgeSchema>;

// ============================================================================
// Study Node Schema (output)
// ============================================================================

export const StudySchema = z.object({
  studyId: z.string(),
  registrySource: z.string().nullable(),
  registryId: z.string().nullable(),
  doi: z.string().nullable(),
  internalStudyCode: z.string().nullable(),
  canonicalTitle: z.string(),
  studyKind: StudyKindEnum,
  shortTitle: z.string().nullable(),
  aliases: z.array(z.string()).nullable(),
  designKind: DesignKindEnum.nullable(),
  status: StudyStatusEnum.nullable(),
  phase: z.string().nullable(),
  sampleSize: z.number().int().nullable(),
  randomized: z.boolean().nullable(),
  blinded: BlindedKindEnum.nullable(),
  comparatorType: ComparatorTypeEnum.nullable(),
  keywords: z.array(z.string()).nullable(),
  locations: z.array(z.string()).nullable(),
  validAt: Neo4jDateTimeString.nullable(),
  invalidAt: Neo4jDateTimeString.nullable(),
  expiredAt: Neo4jDateTimeString.nullable(),
  createdAt: Neo4jDateTimeString,
  // Relationships
  evaluates: z.array(StudyEvaluatesEdgeSchema).nullable(),
  sponsoredBy: z.array(StudySponsoredByEdgeSchema).nullable(),
  runBy: z.array(StudyRunByEdgeSchema).nullable(),
  investigatedBy: z.array(StudyInvestigatedByEdgeSchema).nullable(),
  studiesPopulations: z.array(StudyStudiesPopulationEdgeSchema).nullable(),
  hasDatasets: z.array(StudyHasDatasetEdgeSchema).nullable(),
  investigatesConditions: z.array(StudyInvestigatesConditionEdgeSchema).nullable(),
  hasOutcomes: z.array(StudyHasOutcomeEdgeSchema).nullable(),
});

export type Study = z.infer<typeof StudySchema>;
