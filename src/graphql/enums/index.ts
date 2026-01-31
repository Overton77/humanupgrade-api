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
export type SearchMode = z.infer<typeof SearchModeEnum>;
export type SearchReasonKind = z.infer<typeof SearchReasonKindEnum>;
export type OrganizationSortField = z.infer<typeof OrganizationSortFieldEnum>;
export type SortDirection = z.infer<typeof SortDirectionEnum>;
export type EmbeddingTargetType = z.infer<typeof EmbeddingTargetTypeEnum>;
export type EmbeddingJobStatus = z.infer<typeof EmbeddingJobStatusEnum>;
