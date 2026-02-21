import { z } from "zod";
import { Neo4jDateTimeString } from "../utils/dateTimeUtils.js";
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
import {
  OrganizationRelateInputSchema,
} from "./OrganizationInputs.js";
import {
  ProductRelateInputSchema,
} from "./ProductInputs.js";
import { CompoundFormRelateInputSchema } from "./CompoundFormInputs.js"; 
import { PersonRelateInputSchema } from "./PersonInputs.js";

// ============================================================================
// EdgeAuditInput — shared edge-level temporal validity + provenance
// ============================================================================

export const EdgeAuditInputSchema = z.object({
  validAt: Neo4jDateTimeString,
  expiredAt: Neo4jDateTimeString.optional(),
  invalidAt: Neo4jDateTimeString.optional(),
  createdAt: Neo4jDateTimeString.optional(),
  updatedAt: Neo4jDateTimeString.optional(),
  strength: z.number().min(0).max(1).nullable().optional(),
  extractorVersion: z.string().nullable().optional(),
  extractedAt: Neo4jDateTimeString.optional(),
});

export type EdgeAuditInput = z.infer<typeof EdgeAuditInputSchema>;

// ============================================================================
// UpsertStudyInput — core Study node upsert
// ============================================================================

export const UpsertStudyInputSchema = z.object({
  // Stable identity keys (resolver tries in order: id -> registrySource+registryId -> doi -> internalStudyCode)
  id: z.string().optional(),
  registrySource: z.string().optional(),
  registryId: z.string().optional(),
  doi: z.string().optional(),
  internalStudyCode: z.string().optional(),

  // Required for create; optional on subsequent upserts
  canonicalTitle: z.string().optional(),
  studyKind: StudyKindEnum,

  // Optional scalars
  shortTitle: z.string().nullable().optional(),
  aliases: z.array(z.string()).nullable().optional(),
  designKind: DesignKindEnum.nullable().optional(),
  status: StudyStatusEnum.nullable().optional(),
  phase: z.string().nullable().optional(),
  sampleSize: z.number().int().nullable().optional(),
  randomized: z.boolean().nullable().optional(),
  blinded: BlindedKindEnum.nullable().optional(),
  comparatorType: ComparatorTypeEnum.nullable().optional(),
  keywords: z.array(z.string()).nullable().optional(),
  locations: z.array(z.string()).nullable().optional(),

  // Temporal validity
  validAt: Neo4jDateTimeString,
  expiredAt: Neo4jDateTimeString.optional(),
  invalidAt: Neo4jDateTimeString.optional(),
  createdAt: Neo4jDateTimeString.optional(),
  updatedAt: Neo4jDateTimeString.optional(),
});

export type UpsertStudyInput = z.infer<typeof UpsertStudyInputSchema>;



// ============================================================================
// Population — new node; create-or-connect only
// ============================================================================

export const PopulationInputSchema = z.object({
  populationId: z.string().optional(),
  name: z.string().nullable().optional(),
  populationKind: PopulationKindEnum,
  species: z.string().nullable().optional(),
  strain: z.string().nullable().optional(),
  cellLine: z.string().nullable().optional(),
  diseaseState: z.string().nullable().optional(),
  ageMin: z.number().int().nullable().optional(),
  ageMax: z.number().int().nullable().optional(),
  ageUnit: z.string().nullable().optional(),
  sex: SexEnum.nullable().optional(),
  n: z.number().int().nullable().optional(),
  inclusionCriteria: z.array(z.string()).nullable().optional(),
  exclusionCriteria: z.array(z.string()).nullable().optional(),
  validAt: Neo4jDateTimeString,
  expiredAt: Neo4jDateTimeString.optional(),
  invalidAt: Neo4jDateTimeString.optional(),
  createdAt: Neo4jDateTimeString.optional(),
  updatedAt: Neo4jDateTimeString.optional(),
});

export type PopulationInput = z.infer<typeof PopulationInputSchema>;

export const PopulationRelateInputSchema = z
  .object({
    create: PopulationInputSchema.optional(),
    connect: z.object({ populationId: z.string() }).optional(),
  })
  .refine((data) => (data.create ? 1 : 0) + (data.connect ? 1 : 0) === 1, {
    message: "PopulationRelateInput: exactly one of 'create' or 'connect' must be provided",
  });

export type PopulationRelateInput = z.infer<typeof PopulationRelateInputSchema>;

// ============================================================================
// Dataset — new node; create-or-connect only
// ============================================================================

export const DatasetInputSchema = z.object({
  datasetId: z.string().optional(),
  name: z.string(),
  description: z.string().nullable().optional(),
  datasetKind: DatasetKindEnum,
  format: z.string().nullable().optional(),
  license: z.string().nullable().optional(),
  accessLevel: DatasetAccessLevelEnum.nullable().optional(),
  sourceSystem: z.string().nullable().optional(),
  uri: z.string().nullable().optional(),
  checksum: z.string().nullable().optional(),
  version: z.string().nullable().optional(),
  publishedAt: Neo4jDateTimeString.optional(),
  validAt: Neo4jDateTimeString,
  expiredAt: Neo4jDateTimeString.optional(),
  invalidAt: Neo4jDateTimeString.optional(),
  createdAt: Neo4jDateTimeString.optional(),
  updatedAt: Neo4jDateTimeString.optional(),
});

export type DatasetInput = z.infer<typeof DatasetInputSchema>;

export const DatasetRelateInputSchema = z
  .object({
    create: DatasetInputSchema.optional(),
    connect: z.object({ datasetId: z.string() }).optional(),
  })
  .refine((data) => (data.create ? 1 : 0) + (data.connect ? 1 : 0) === 1, {
    message: "DatasetRelateInput: exactly one of 'create' or 'connect' must be provided",
  });

export type DatasetRelateInput = z.infer<typeof DatasetRelateInputSchema>;

// ============================================================================
// StudyOutcome — new node; create-or-connect only
// ============================================================================

export const StudyOutcomeInputSchema = z.object({
  studyOutcomeId: z.string().optional(),
  canonicalName: z.string(),
  displayName: z.string().nullable().optional(),
  aliases: z.array(z.string()).nullable().optional(),
  description: z.string().nullable().optional(),
  outcomeCategory: OutcomeCategoryEnum,
  polarityHint: PolarityHintEnum.nullable().optional(),
  domain: OutcomeDomainEnum.nullable().optional(),
  measurementType: OutcomeMeasurementTypeEnum.nullable().optional(),
  unit: z.string().nullable().optional(),
  biologicalMatrix: z.string().nullable().optional(),
  analyte: z.string().nullable().optional(),
  timeHorizon: z.string().nullable().optional(),
  standardSystem: z.string().nullable().optional(),
  standardCode: z.string().nullable().optional(),
  standardLabel: z.string().nullable().optional(),
  validAt: Neo4jDateTimeString,
  expiredAt: Neo4jDateTimeString.optional(),
  invalidAt: Neo4jDateTimeString.optional(),
  createdAt: Neo4jDateTimeString.optional(),
  updatedAt: Neo4jDateTimeString.optional(),
});

export type StudyOutcomeInput = z.infer<typeof StudyOutcomeInputSchema>;

export const StudyOutcomeRelateInputSchema = z
  .object({
    create: StudyOutcomeInputSchema.optional(),
    connect: z.object({ studyOutcomeId: z.string() }).optional(),
  })
  .refine((data) => (data.create ? 1 : 0) + (data.connect ? 1 : 0) === 1, {
    message: "StudyOutcomeRelateInput: exactly one of 'create' or 'connect' must be provided",
  });

export type StudyOutcomeRelateInput = z.infer<
  typeof StudyOutcomeRelateInputSchema
>;

// ============================================================================
// Condition — new node; create-or-connect only
// ============================================================================

export const ConditionInputSchema = z.object({
  conditionId: z.string().optional(),
  name: z.string(),
  aliases: z.array(z.string()).nullable().optional(),
  description: z.string().nullable().optional(),
  icdCodes: z.array(z.string()).nullable().optional(),
  snomedCodes: z.array(z.string()).nullable().optional(),
  meshTerms: z.array(z.string()).nullable().optional(),
  validAt: Neo4jDateTimeString.optional(),
  expiredAt: Neo4jDateTimeString.optional(),
  invalidAt: Neo4jDateTimeString.optional(),
  createdAt: Neo4jDateTimeString.optional(),
});

export type ConditionInput = z.infer<typeof ConditionInputSchema>;

export const ConditionRelateInputSchema = z
  .object({
    create: ConditionInputSchema.optional(),
    connect: z.object({ conditionId: z.string() }).optional(),
  })
  .refine((data) => (data.create ? 1 : 0) + (data.connect ? 1 : 0) === 1, {
    message: "ConditionRelateInput: exactly one of 'create' or 'connect' must be provided",
  });

export type ConditionRelateInput = z.infer<typeof ConditionRelateInputSchema>;

// ============================================================================
// EvaluatesTargetRefInput — discriminated union by kind
//
// Strategy: flat object with `kind` discriminator + per-kind optional
// connect IDs and create payloads. Service-layer validates the right
// field is present for the given kind.
//
// This mirrors the Evidence edge approach: one input shape, runtime
// dispatch based on the `kind` field.
// ============================================================================

export const EvaluatesTargetRefInputSchema = z
  .object({
    kind: EvaluatesTargetKindEnum,
    // Connect IDs — one should be provided matching kind
    productId: z.string().nullable().optional(),
    compoundId: z.string().nullable().optional(),
    compoundFormId: z.string().nullable().optional(),
    foodId: z.string().nullable().optional(),
    foodVariantId: z.string().nullable().optional(),
    // Create payloads — at most one should be provided matching kind
    createProduct: z.lazy(() => ProductRelateInputSchema).optional(),
    createCompoundForm: z.lazy(() => CompoundFormRelateInputSchema).optional(),
  })
  .refine(
    (data) => {
      // At least one of connect or create must be supplied for the given kind
      switch (data.kind) {
        case "PRODUCT":
          return !!data.productId || !!data.createProduct;
        case "COMPOUND":
          return !!data.compoundId;
        case "COMPOUND_FORM":
          return !!data.compoundFormId || !!data.createCompoundForm;
        case "FOOD":
          return !!data.foodId;
        case "FOOD_VARIANT":
          return !!data.foodVariantId;
        default:
          return false;
      }
    },
    {
      message:
        "EvaluatesTargetRefInput: must provide a connect ID or create payload matching the given kind",
    }
  );

export type EvaluatesTargetRefInput = z.infer<
  typeof EvaluatesTargetRefInputSchema
>;

// ============================================================================
// Relationship Input Schemas — Study edges (create-or-connect only)
// ============================================================================

// EVALUATES (Study -> Product | Compound | CompoundForm | Food | FoodVariant)
export const StudyEvaluatesRelationshipInputSchema = z.object({
  target: EvaluatesTargetRefInputSchema,
  role: StudyEvaluatesRoleEnum,
  audit: EdgeAuditInputSchema,
});

export type StudyEvaluatesRelationshipInput = z.infer<
  typeof StudyEvaluatesRelationshipInputSchema
>;

// SPONSORED_BY (Study -> Organization)
export const StudySponsoredByRelationshipInputSchema = z.object({
  organization: z.lazy(() => OrganizationRelateInputSchema),
  role: StudySponsorRoleEnum.nullable().optional(),
  audit: EdgeAuditInputSchema,
});

export type StudySponsoredByRelationshipInput = z.infer<
  typeof StudySponsoredByRelationshipInputSchema
>;

// RUN_BY (Study -> Organization)
export const StudyRunByRelationshipInputSchema = z.object({
  organization: z.lazy(() => OrganizationRelateInputSchema),
  role: StudyRunByRoleEnum.nullable().optional(),
  audit: EdgeAuditInputSchema,
});

export type StudyRunByRelationshipInput = z.infer<
  typeof StudyRunByRelationshipInputSchema
>;

// INVESTIGATED_BY (Study -> Person)
export const StudyInvestigatedByRelationshipInputSchema = z.object({
  person: PersonRelateInputSchema,
  role: StudyInvestigatorRoleEnum.nullable().optional(),
  affiliation: z.string().nullable().optional(),
  audit: EdgeAuditInputSchema,
});

export type StudyInvestigatedByRelationshipInput = z.infer<
  typeof StudyInvestigatedByRelationshipInputSchema
>;

// STUDIES_POPULATION (Study -> Population)
export const StudyStudiesPopulationRelationshipInputSchema = z.object({
  population: PopulationRelateInputSchema,
  role: StudyPopulationRoleEnum.nullable().optional(),
  audit: EdgeAuditInputSchema,
});

export type StudyStudiesPopulationRelationshipInput = z.infer<
  typeof StudyStudiesPopulationRelationshipInputSchema
>;

// HAS_DATASET (Study -> Dataset)
export const StudyHasDatasetRelationshipInputSchema = z.object({
  dataset: DatasetRelateInputSchema,
  role: StudyDatasetRoleEnum.nullable().optional(),
  accessNotes: z.string().nullable().optional(),
  audit: EdgeAuditInputSchema,
});

export type StudyHasDatasetRelationshipInput = z.infer<
  typeof StudyHasDatasetRelationshipInputSchema
>;

// INVESTIGATES_CONDITION (Study -> Condition)
export const StudyInvestigatesConditionRelationshipInputSchema = z.object({
  condition: ConditionRelateInputSchema,
  role: StudyInvestigatesRoleEnum.nullable().optional(),
  audit: EdgeAuditInputSchema,
});

export type StudyInvestigatesConditionRelationshipInput = z.infer<
  typeof StudyInvestigatesConditionRelationshipInputSchema
>;

// HAS_OUTCOME (Study -> StudyOutcome)
export const StudyHasOutcomeRelationshipInputSchema = z.object({
  outcome: StudyOutcomeRelateInputSchema,
  priority: StudyOutcomePriorityEnum,
  role: StudyOutcomeRoleEnum.nullable().optional(),
  audit: EdgeAuditInputSchema,
});

export type StudyHasOutcomeRelationshipInput = z.infer<
  typeof StudyHasOutcomeRelationshipInputSchema
>;

// ============================================================================
// UpsertCaseStudyInput — top-level bundle input (one input to rule them all)
// ============================================================================

export const UpsertCaseStudyInputSchema = z.object({
  study: UpsertStudyInputSchema,
  evaluates: z.array(StudyEvaluatesRelationshipInputSchema).optional(),
  sponsoredBy: z.array(StudySponsoredByRelationshipInputSchema).optional(),
  runBy: z.array(StudyRunByRelationshipInputSchema).optional(),
  investigatedBy: z.array(StudyInvestigatedByRelationshipInputSchema).optional(),
  studiesPopulations: z.array(StudyStudiesPopulationRelationshipInputSchema).optional(),
  hasDatasets: z.array(StudyHasDatasetRelationshipInputSchema).optional(),
  investigatesConditions: z.array(StudyInvestigatesConditionRelationshipInputSchema).optional(),
  hasOutcomes: z.array(StudyHasOutcomeRelationshipInputSchema).optional(),
});

export type UpsertCaseStudyInput = z.infer<typeof UpsertCaseStudyInputSchema>;
