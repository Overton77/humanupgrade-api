import { z } from "zod";

// Organization enums
export const OrgTypeEnum = z.enum([
  "COMPANY",
  "NONPROFIT",
  "RESEARCH_GROUP",
  "COMMUNITY",
  "MEDIA_OUTLET",
  "CLINIC",
  "FOUNDATION",
  "REGULATOR",
  "JOURNAL",
  "LAB_NETWORK",
  "DISTRIBUTOR",
  "MANUFACTURER",
  "SUPPLIER",
  "PLATFORM",
  "OTHER",
]);

export const BusinessModelEnum = z.enum([
  "B2C",
  "B2B",
  "B2B2C",
  "HYBRID",
  "UNKNOWN",
]);

// PhysicalLocation enums
export const LocationTypeEnum = z.enum([
  "HEADQUARTERS",
  "REGISTERED_ADDRESS",
  "OFFICE",
  "LAB_FACILITY",
  "CLINIC_SITE",
  "MANUFACTURING_SITE",
  "WAREHOUSE",
  "RETAIL_SITE",
  "DATA_CENTER",
  "RESEARCH_SITE",
  "COLLECTION_SITE",
  "CONFERENCE_VENUE",
  "OTHER",
]);

// Listing enums
export const ListingDomainEnum = z.enum([
  "DIAGNOSTICS",
  "SUPPLEMENT",
  "DEVICE",
  "TELEHEALTH",
  "SOFTWARE",
  "SERVICE",
  "OTHER",
]);

export const PriceTypeEnum = z.enum([
  "LIST",
  "PROMO",
  "MEMBER_ONLY",
  "INSURANCE_ESTIMATE",
  "UNKNOWN",
]);

export const CollectionModeEnum = z.enum([
  "AT_HOME_KIT",
  "IN_PERSON_DRAW",
  "MOBILE_PHLEBOTOMY",
  "TELEHEALTH",
  "IN_CLINIC",
  "SHIPPING",
  "VIRTUAL",
  "OTHER",
]);

// Product enums
export const ProductDomainEnum = z.enum([
  "DIAGNOSTICS",
  "SUPPLEMENT",
  "DEVICE",
  "TELEHEALTH",
  "SOFTWARE",
  "SERVICE",
  "OTHER",
]);

// Relationship edge enums
export const ListRoleEnum = z.enum([
  "OPERATOR",
  "PROVIDER",
  "SELLER",
  "DISTRIBUTOR",
  "MARKETER",
  "FULFILLMENT_PARTNER",
  "BILLING_ENTITY",
  "OTHER",
]);

export const ChannelEnum = z.enum([
  "ONLINE",
  "IN_PERSON",
  "PHONE",
  "PARTNER",
  "MARKETPLACE",
  "OTHER",
]);

// ManufacturingProcess enums
export const ProcessTypeEnum = z.enum([
  "chemical_synthesis",
  "fermentation",
  "extraction",
  "semi_synthesis",
  "formulation",
  "assembly",
  "packaging",
  "qc_release",
  "other",
]);

export const ScalabilityLevelEnum = z.enum([
  "lab",
  "pilot",
  "commercial",
  "unknown",
]);

// TechnologyPlatform enums
export const PlatformTypeEnum = z.enum([
  "THERAPEUTIC_PLATFORM",
  "DIAGNOSTIC_PLATFORM",
  "MANUFACTURING_PLATFORM",
  "MODALITY_PLATFORM",
  "ANALYTICS_PLATFORM",
  "OTHER",
]);

// Relationship enums
export const RelationshipRoleEnum = z.enum([
  "PRIMARY_DEVELOPER",
  "CO_DEVELOPER",
  "MAINTAINER",
  "STEWARD",
  "UNKNOWN",
]);

export const UsageContextEnum = z.enum([
  "R_AND_D",
  "PRODUCTION",
  "QC",
  "CLINICAL",
  "ANALYTICS",
  "OTHER",
  "UNKNOWN",
]);

export const SourceEnum = z.enum(["CURATED", "IMPORTED", "DERIVED"]);

export const ManufacturingRoleEnum = z.enum([
  "primary",
  "subcontractor",
  "cdmo",
  "cmo",
  "api_supplier",
  "other",
]);

// Product relationship enums
export const LabTestRoleEnum = z.enum([
  "primary",
  "component",
  "reflex",
  "add_on",
  "eligibility_gate",
]);

export const PanelRoleEnum = z.enum(["primary", "variant", "legacy"]);

export const CompoundFormRoleEnum = z.enum([
  "active",
  "excipient",
  "carrier",
  "other",
]);

// LabTest relationship enums
export const BiomarkerRoleEnum = z.enum([
  "primary",
  "derived",
  "ratio",
  "composite",
  "other",
]);

export const MethodRoleEnum = z.enum([
  "primary",
  "confirmatory",
  "reflex",
  "backup",
]);

export const SpecimenRoleEnum = z.enum([
  "required",
  "acceptableAlternative",
  "preferred",
]);

// Specimen collection enums
export const CollectionSettingEnum = z.enum([
  "AT_HOME",
  "CLINIC",
  "LAB",
  "MOBILE_PHLEBOTOMY",
  "HOSPITAL",
  "UNKNOWN",
]);

export const CollectionMethodEnum = z.enum([
  "VENIPUNCTURE",
  "FINGERSTICK",
  "SALIVA_TUBE",
  "STOOL_KIT",
  "URINE_CUP",
  "SWAB",
  "OTHER",
  "UNKNOWN",
]);

export const CollectionTimeWindowEnum = z.enum([
  "ANYTIME",
  "MORNING_ONLY",
  "TIMED_DRAW",
  "CYCLE_PHASED",
  "OTHER",
  "UNKNOWN",
]);

export const ProcessingAdditiveEnum = z.enum([
  "NONE",
  "EDTA",
  "HEPARIN",
  "CITRATE",
  "SST",
  "OTHER",
  "UNKNOWN",
]);

export const SexEnum = z.enum([
  "ANY",
  "FEMALE",
  "MALE",
  "INTERSEX",
  "UNKNOWN",
]);

export const MeasurementStateEnum = z.enum([
  "FASTING",
  "NON_FASTING",
  "POSTPRANDIAL",
  "RESTING",
  "EXERCISE",
  "SLEEP",
  "ACUTE_ILLNESS",
  "RECOVERY",
  "UNKNOWN",
]);

export const TimeOfDayEnum = z.enum([
  "MORNING",
  "AFTERNOON",
  "EVENING",
  "NIGHT",
  "UNKNOWN",
]);

export const AppliesWhenEnum = z.enum([
  "BASELINE",
  "CHANGE_FROM_BASELINE",
  "THRESHOLD_EXCEEDED",
  "TREND",
  "UNKNOWN",
]);

export const ThresholdDirectionEnum = z.enum([
  "ABOVE",
  "BELOW",
  "BOTH",
  "UNKNOWN",
]);

// ============================================================================
// Study / CaseStudy enums
// ============================================================================

export const StudyKindEnum = z.enum([
  "CASE_STUDY",
  "CASE_REPORT",
  "CASE_SERIES",
  "COHORT",
  "CROSS_SECTIONAL",
  "RCT",
  "OBSERVATIONAL",
  "SYSTEMATIC_REVIEW",
  "META_ANALYSIS",
  "OTHER",
]);

export const DesignKindEnum = z.enum([
  "CASE_REPORT",
  "CASE_SERIES",
  "RETROSPECTIVE_COHORT",
  "PROSPECTIVE_COHORT",
  "CROSS_SECTIONAL",
  "PARALLEL_GROUP_RCT",
  "CROSSOVER_RCT",
  "FACTORIAL_RCT",
  "SINGLE_ARM_TRIAL",
  "DOSE_ESCALATION",
  "N_OF_1",
  "SYSTEMATIC_REVIEW",
  "META_ANALYSIS",
  "NARRATIVE_REVIEW",
  "OTHER",
]);

export const StudyStatusEnum = z.enum([
  "PLANNED",
  "RECRUITING",
  "ACTIVE",
  "COMPLETED",
  "SUSPENDED",
  "TERMINATED",
  "WITHDRAWN",
  "UNKNOWN",
]);

export const BlindedKindEnum = z.enum([
  "OPEN_LABEL",
  "SINGLE_BLIND",
  "DOUBLE_BLIND",
  "TRIPLE_BLIND",
  "UNKNOWN",
]);

export const ComparatorTypeEnum = z.enum([
  "PLACEBO",
  "ACTIVE_CONTROL",
  "USUAL_CARE",
  "WAITLIST",
  "NO_TREATMENT",
  "DOSE_RESPONSE",
  "HISTORICAL",
  "OTHER",
]);

export const PopulationKindEnum = z.enum([
  "HUMAN",
  "ANIMAL",
  "IN_VITRO",
  "IN_SILICO",
  "MIXED",
  "OTHER",
]);

export const DatasetKindEnum = z.enum([
  "RAW",
  "CLEANED",
  "ANALYTIC",
  "SUMMARY",
  "BIOBANK",
  "REGISTRY",
  "CLAIMS",
  "EHR",
  "OTHER",
]);

export const DatasetAccessLevelEnum = z.enum([
  "PUBLIC",
  "RESTRICTED",
  "PRIVATE",
  "UPON_REQUEST",
  "UNKNOWN",
]);

export const OutcomeCategoryEnum = z.enum([
  "EFFICACY",
  "SAFETY",
  "BIOMARKER",
  "QUALITY_OF_LIFE",
  "PHARMACOKINETIC",
  "PHARMACODYNAMIC",
  "ECONOMIC",
  "OTHER",
]);

export const PolarityHintEnum = z.enum([
  "HIGHER_IS_BETTER",
  "LOWER_IS_BETTER",
  "NEUTRAL",
  "CONTEXT_DEPENDENT",
  "UNKNOWN",
]);

export const OutcomeDomainEnum = z.enum([
  "CARDIOVASCULAR",
  "METABOLIC",
  "COGNITIVE",
  "MUSCULOSKELETAL",
  "IMMUNOLOGICAL",
  "HORMONAL",
  "GASTROINTESTINAL",
  "RENAL",
  "HEPATIC",
  "ONCOLOGICAL",
  "PSYCHOLOGICAL",
  "ANTHROPOMETRIC",
  "OTHER",
]);

export const OutcomeMeasurementTypeEnum = z.enum([
  "CONTINUOUS",
  "BINARY",
  "ORDINAL",
  "COUNT",
  "TIME_TO_EVENT",
  "COMPOSITE",
  "OTHER",
]);

export const EvaluatesTargetKindEnum = z.enum([
  "PRODUCT",
  "COMPOUND",
  "COMPOUND_FORM",
  "FOOD",
  "FOOD_VARIANT",
]);

export const StudyEvaluatesRoleEnum = z.enum([
  "INTERVENTION",
  "COMPARATOR",
  "CO_INTERVENTION",
  "EXPOSURE",
]);

export const StudySponsorRoleEnum = z.enum([
  "PRIMARY",
  "COLLABORATOR",
  "FUNDER",
  "OTHER",
]);

export const StudyRunByRoleEnum = z.enum([
  "CRO",
  "SITE",
  "LAB",
  "PLATFORM",
  "OTHER",
]);

export const StudyInvestigatorRoleEnum = z.enum([
  "PI",
  "COI",
  "AUTHOR",
  "SUBINVESTIGATOR",
  "OTHER",
]);

export const StudyPopulationRoleEnum = z.enum([
  "TARGET",
  "ENROLLED",
  "SAFETY",
  "ITT",
  "PER_PROTOCOL",
  "OTHER",
]);

export const StudyDatasetRoleEnum = z.enum([
  "RAW",
  "CLEANED",
  "ANALYTIC",
  "SUMMARY",
  "OTHER",
]);

export const StudyInvestigatesRoleEnum = z.enum([
  "PRIMARY",
  "SECONDARY",
  "COMORBID",
  "EXCLUSION",
  "OTHER",
]);

export const StudyOutcomePriorityEnum = z.enum([
  "PRIMARY",
  "SECONDARY",
  "EXPLORATORY",
]);

export const StudyOutcomeRoleEnum = z.enum([
  "ENDPOINT",
  "SAFETY_MONITORING",
  "BIOMARKER_PANEL",
  "OTHER",
]);

// Search enums
export const SearchModeEnum = z.enum([
  "FIELD_ONLY",
  "FULLTEXT_ONLY",
  "VECTOR_ONLY",
  "HYBRID",
]);

export const SearchReasonKindEnum = z.enum([
  "FULLTEXT_MATCH",
  "VECTOR_MATCH",
  "EXACT_MATCH",
  "FILTER_APPLIED",
  "BOOST_APPLIED",
]);

export const OrganizationSortFieldEnum = z.enum([
  "NAME",
  "CREATED_AT",
  "EMPLOYEE_COUNT_MIN",
  "EMPLOYEE_COUNT_MAX",
]);

export const SortDirectionEnum = z.enum(["ASC", "DESC"]);

// Embedding enums
export const EmbeddingTargetTypeEnum = z.enum(["ORGANIZATION", "PRODUCT"]);

export const EmbeddingJobStatusEnum = z.enum([
  "QUEUED",
  "RUNNING",
  "COMPLETE",
  "SKIPPED",
  "FAILED",
]);

// Export TypeScript types
export type OrgType = z.infer<typeof OrgTypeEnum>;
export type BusinessModel = z.infer<typeof BusinessModelEnum>;
export type LocationType = z.infer<typeof LocationTypeEnum>;
export type ListingDomain = z.infer<typeof ListingDomainEnum>;
export type PriceType = z.infer<typeof PriceTypeEnum>;
export type CollectionMode = z.infer<typeof CollectionModeEnum>;
export type ProductDomain = z.infer<typeof ProductDomainEnum>;
export type ListRole = z.infer<typeof ListRoleEnum>;
export type Channel = z.infer<typeof ChannelEnum>;
export type ProcessType = z.infer<typeof ProcessTypeEnum>;
export type ScalabilityLevel = z.infer<typeof ScalabilityLevelEnum>;
export type PlatformType = z.infer<typeof PlatformTypeEnum>;
export type RelationshipRole = z.infer<typeof RelationshipRoleEnum>;
export type UsageContext = z.infer<typeof UsageContextEnum>;
export type Source = z.infer<typeof SourceEnum>;
export type ManufacturingRole = z.infer<typeof ManufacturingRoleEnum>;
export type LabTestRole = z.infer<typeof LabTestRoleEnum>;
export type PanelRole = z.infer<typeof PanelRoleEnum>;
export type CompoundFormRole = z.infer<typeof CompoundFormRoleEnum>;
export type BiomarkerRole = z.infer<typeof BiomarkerRoleEnum>;
export type MethodRole = z.infer<typeof MethodRoleEnum>;
export type SpecimenRole = z.infer<typeof SpecimenRoleEnum>;
export type CollectionSetting = z.infer<typeof CollectionSettingEnum>;
export type CollectionMethod = z.infer<typeof CollectionMethodEnum>;
export type CollectionTimeWindow = z.infer<typeof CollectionTimeWindowEnum>;
export type ProcessingAdditive = z.infer<typeof ProcessingAdditiveEnum>;
export type Sex = z.infer<typeof SexEnum>;
export type MeasurementState = z.infer<typeof MeasurementStateEnum>;
export type TimeOfDay = z.infer<typeof TimeOfDayEnum>;
export type AppliesWhen = z.infer<typeof AppliesWhenEnum>;
export type ThresholdDirection = z.infer<typeof ThresholdDirectionEnum>;
export type SearchMode = z.infer<typeof SearchModeEnum>;
export type SearchReasonKind = z.infer<typeof SearchReasonKindEnum>;
export type OrganizationSortField = z.infer<typeof OrganizationSortFieldEnum>;
export type SortDirection = z.infer<typeof SortDirectionEnum>;
export type EmbeddingTargetType = z.infer<typeof EmbeddingTargetTypeEnum>;
export type EmbeddingJobStatus = z.infer<typeof EmbeddingJobStatusEnum>;

// Study / CaseStudy types
export type StudyKind = z.infer<typeof StudyKindEnum>;
export type DesignKind = z.infer<typeof DesignKindEnum>;
export type StudyStatus = z.infer<typeof StudyStatusEnum>;
export type BlindedKind = z.infer<typeof BlindedKindEnum>;
export type ComparatorType = z.infer<typeof ComparatorTypeEnum>;
export type PopulationKind = z.infer<typeof PopulationKindEnum>;
export type DatasetKind = z.infer<typeof DatasetKindEnum>;
export type DatasetAccessLevel = z.infer<typeof DatasetAccessLevelEnum>;
export type OutcomeCategory = z.infer<typeof OutcomeCategoryEnum>;
export type PolarityHint = z.infer<typeof PolarityHintEnum>;
export type OutcomeDomain = z.infer<typeof OutcomeDomainEnum>;
export type OutcomeMeasurementType = z.infer<typeof OutcomeMeasurementTypeEnum>;
export type EvaluatesTargetKind = z.infer<typeof EvaluatesTargetKindEnum>;
export type StudyEvaluatesRole = z.infer<typeof StudyEvaluatesRoleEnum>;
export type StudySponsorRole = z.infer<typeof StudySponsorRoleEnum>;
export type StudyRunByRole = z.infer<typeof StudyRunByRoleEnum>;
export type StudyInvestigatorRole = z.infer<typeof StudyInvestigatorRoleEnum>;
export type StudyPopulationRole = z.infer<typeof StudyPopulationRoleEnum>;
export type StudyDatasetRole = z.infer<typeof StudyDatasetRoleEnum>;
export type StudyInvestigatesRole = z.infer<typeof StudyInvestigatesRoleEnum>;
export type StudyOutcomePriority = z.infer<typeof StudyOutcomePriorityEnum>;
export type StudyOutcomeRole = z.infer<typeof StudyOutcomeRoleEnum>;
