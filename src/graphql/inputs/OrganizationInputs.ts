import { z } from "zod";
import {
  OrgTypeEnum,
  BusinessModelEnum,
  ListRoleEnum,
  ChannelEnum,
  RelationshipRoleEnum,
  UsageContextEnum,
  SourceEnum,
  ManufacturingRoleEnum,
} from "../enums/index.js";
import {
  Neo4jDateTimeString,
  Neo4jDateString,
} from "../utils/dateTimeUtils.js";
import { TemporalValidityInputSchema } from "./TemporalValidityInputs.js";
import { PhysicalLocationRelateInputSchema } from "./PhysicalLocationInputs.js";
import { PhysicalLocationRelateUpdateInputSchema } from "./PhysicalLocationInputs.js";
import { ListingRelateInputSchema } from "./ListingInputs.js";
import { ListingRelateUpdateInputSchema } from "./ListingInputs.js";
import { ProductRelateInputSchema } from "./ProductInputs.js";
import { ProductRelateUpdateInputSchema } from "./ProductInputs.js";
import { CompoundFormRelateInputSchema } from "./CompoundFormInputs.js";
import { CompoundFormRelateUpdateInputSchema } from "./CompoundFormInputs.js";
import { ManufacturingProcessRelateInputSchema } from "./ManufacturingProcessInputs.js";
import { ManufacturingProcessRelateUpdateInputSchema } from "./ManufacturingProcessInputs.js";
import { TechnologyPlatformRelateInputSchema } from "./TechnologyPlatformInputs.js";
import { TechnologyPlatformRelateUpdateInputSchema } from "./TechnologyPlatformInputs.js";

// PhysicalLocationUpdateInput

// ListingUpdateInput

// ProductUpdateInput

// CompoundFormUpdateInput

// ============================================================================
// Relationship Input Schemas (with nested create/connect/update support)
// ============================================================================

// HasLocationRelationshipInput (Create/Connect)

export const HasLocationRelationshipInputSchema =
  TemporalValidityInputSchema.extend({
    location: PhysicalLocationRelateInputSchema,
    locationRole: z.string(),
    isPrimary: z.boolean().nullable().optional(),
    startDate: Neo4jDateString.optional(), // was z.coerce.date()
    endDate: Neo4jDateString.optional(), // was z.coerce.date()
    claimIds: z.array(z.string()).optional(),
  });

export const HasLocationRelationshipUpdateInputSchema =
  TemporalValidityInputSchema.extend({
    location: PhysicalLocationRelateUpdateInputSchema,
    locationRole: z.string().optional(),
    isPrimary: z.boolean().nullable().optional(),
    startDate: Neo4jDateString.optional(), // was z.coerce.date()
    endDate: Neo4jDateString.optional(), // was z.coerce.date()
    claimIds: z.array(z.string()).optional(),
  });

export type HasLocationRelationshipInput = z.infer<
  typeof HasLocationRelationshipInputSchema
>;

// OwnsOrControlsRelationshipInput (Create/Connect)
export const OrganizationRelateInputSchema: z.ZodType<any> = z
  .object({
    create: z.lazy(() => OrganizationInputSchema).optional(),
    connect: z.object({ organizationId: z.string() }).optional(),
  })
  .refine((data) => (data.create ? 1 : 0) + (data.connect ? 1 : 0) === 1, {
    message: "Exactly one of 'create' or 'connect' must be provided",
  });

// OwnsOrControlsRelationshipUpdateInput (Create/Connect/Update)
export const OrganizationRelateUpdateInputSchema: z.ZodType<any> = z
  .object({
    create: z.lazy(() => OrganizationInputSchema).optional(),
    connect: z.object({ organizationId: z.string() }).optional(),
    update: z.lazy(() => UpdateOrganizationInputSchema).optional(),
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

export const OwnsOrControlsRelationshipInputSchema =
  TemporalValidityInputSchema.extend({
    organization: OrganizationRelateInputSchema,
    relationshipType: z.string(),
    ownershipPercent: z.number().nullable().optional(),
    controlType: z.string().nullable().optional(),
    effectiveFrom: Neo4jDateString.optional(), // was z.coerce.date()
    effectiveTo: Neo4jDateString.optional(), // was z.coerce.date()
    isCurrent: z.boolean().nullable().optional(),
    claimIds: z.array(z.string()).optional(),
  });

export const OwnsOrControlsRelationshipUpdateInputSchema =
  TemporalValidityInputSchema.extend({
    organization: OrganizationRelateUpdateInputSchema,
    relationshipType: z.string().optional(),
    ownershipPercent: z.number().nullable().optional(),
    controlType: z.string().nullable().optional(),
    effectiveFrom: Neo4jDateString.optional(), // was z.coerce.date()
    effectiveTo: Neo4jDateString.optional(), // was z.coerce.date()
    isCurrent: z.boolean().nullable().optional(),
    claimIds: z.array(z.string()).optional(),
  });

export type OwnsOrControlsRelationshipInput = z.infer<
  typeof OwnsOrControlsRelationshipInputSchema
>;

// ListsRelationshipInput (Create/Connect)

export const ListsRelationshipInputSchema = TemporalValidityInputSchema.extend({
  listing: ListingRelateInputSchema,
  listRole: ListRoleEnum,
  channel: ChannelEnum.nullable().optional(),
  regionsOverrides: z.array(z.string()).nullable().optional(),
  collectionModesOverrides: z.array(z.string()).nullable().optional(),
  availabilityNotes: z.string().nullable().optional(),
  claimIds: z.array(z.string()).optional(),
});

export const ListsRelationshipUpdateInputSchema =
  TemporalValidityInputSchema.extend({
    listing: ListingRelateUpdateInputSchema,
    listRole: ListRoleEnum.optional(),
    channel: ChannelEnum.nullable().optional(),
    regionsOverrides: z.array(z.string()).nullable().optional(),
    collectionModesOverrides: z.array(z.string()).nullable().optional(),
    availabilityNotes: z.string().nullable().optional(),
    claimIds: z.array(z.string()).optional(),
  });

export type ListsRelationshipInput = z.infer<
  typeof ListsRelationshipInputSchema
>;

// OffersProductRelationshipInput (Create/Connect)

export const OffersProductRelationshipInputSchema =
  TemporalValidityInputSchema.extend({
    product: z.lazy(() => ProductRelateInputSchema),
    // No additional properties, just temporal validity
  });

export const OffersProductRelationshipUpdateInputSchema =
  TemporalValidityInputSchema.extend({
    product: z.lazy(() => ProductRelateUpdateInputSchema),
    // No additional properties, just temporal validity
  });

export type OffersProductRelationshipInput = z.infer<
  typeof OffersProductRelationshipInputSchema
>;

// SuppliesCompoundFormRelationshipInput (Create/Connect)

export const SuppliesCompoundFormRelationshipInputSchema =
  TemporalValidityInputSchema.extend({
    compoundForm: CompoundFormRelateInputSchema,
    // No additional properties, just temporal validity
  });

export const SuppliesCompoundFormRelationshipUpdateInputSchema =
  TemporalValidityInputSchema.extend({
    compoundForm: CompoundFormRelateUpdateInputSchema,
    // No additional properties, just temporal validity
  });

export type SuppliesCompoundFormRelationshipInput = z.infer<
  typeof SuppliesCompoundFormRelationshipInputSchema
>;

// ManufacturesRelationshipInput (Create/Connect)
export const ManufacturesRelationshipInputSchema =
  TemporalValidityInputSchema.extend({
    compoundForm: CompoundFormRelateInputSchema,
    claimIds: z.array(z.string()).optional(),
  });

export const ManufacturesRelationshipUpdateInputSchema =
  TemporalValidityInputSchema.extend({
    compoundForm: CompoundFormRelateUpdateInputSchema,
    claimIds: z.array(z.string()).optional(),
  });

export type ManufacturesRelationshipInput = z.infer<
  typeof ManufacturesRelationshipInputSchema
>;

// ManufacturesProductRelationshipInput (Create/Connect)
export const ManufacturesProductRelationshipInputSchema =
  TemporalValidityInputSchema.extend({
    product: z.lazy(() => ProductRelateInputSchema),
    claimIds: z.array(z.string()).optional(),
  });

export const ManufacturesProductRelationshipUpdateInputSchema =
  TemporalValidityInputSchema.extend({
    product: z.lazy(() => ProductRelateUpdateInputSchema),
    claimIds: z.array(z.string()).optional(),
  });

export type ManufacturesProductRelationshipInput = z.infer<
  typeof ManufacturesProductRelationshipInputSchema
>;

// ContractManufacturerForOrganizationRelationshipInput (Create/Connect)
export const ContractManufacturerForOrganizationRelationshipInputSchema =
  TemporalValidityInputSchema.extend({
    organization: OrganizationRelateInputSchema,
    claimIds: z.array(z.string()).optional(),
  });

export const ContractManufacturerForOrganizationRelationshipUpdateInputSchema =
  TemporalValidityInputSchema.extend({
    organization: OrganizationRelateUpdateInputSchema,
    claimIds: z.array(z.string()).optional(),
  });

export type ContractManufacturerForOrganizationRelationshipInput = z.infer<
  typeof ContractManufacturerForOrganizationRelationshipInputSchema
>;

// ContractManufacturerForProductRelationshipInput (Create/Connect)
export const ContractManufacturerForProductRelationshipInputSchema =
  TemporalValidityInputSchema.extend({
    product: z.lazy(() => ProductRelateInputSchema),
    claimIds: z.array(z.string()).optional(),
  });

export const ContractManufacturerForProductRelationshipUpdateInputSchema =
  TemporalValidityInputSchema.extend({
    product: z.lazy(() => ProductRelateUpdateInputSchema),
    claimIds: z.array(z.string()).optional(),
  });

export type ContractManufacturerForProductRelationshipInput = z.infer<
  typeof ContractManufacturerForProductRelationshipInputSchema
>;

// ContractManufacturerForCompoundFormRelationshipInput (Create/Connect)
export const ContractManufacturerForCompoundFormRelationshipInputSchema =
  TemporalValidityInputSchema.extend({
    compoundForm: CompoundFormRelateInputSchema,
    claimIds: z.array(z.string()).optional(),
  });

export const ContractManufacturerForCompoundFormRelationshipUpdateInputSchema =
  TemporalValidityInputSchema.extend({
    compoundForm: CompoundFormRelateUpdateInputSchema,
    claimIds: z.array(z.string()).optional(),
  });

export type ContractManufacturerForCompoundFormRelationshipInput = z.infer<
  typeof ContractManufacturerForCompoundFormRelationshipInputSchema
>;

// PerformsManufacturingProcessRelationshipInput (Create/Connect)
export const PerformsManufacturingProcessRelationshipInputSchema =
  TemporalValidityInputSchema.extend({
    manufacturingProcess: ManufacturingProcessRelateInputSchema,
    role: ManufacturingRoleEnum,
    claimIds: z.array(z.string()).optional(),
  });

export const PerformsManufacturingProcessRelationshipUpdateInputSchema =
  TemporalValidityInputSchema.extend({
    manufacturingProcess: ManufacturingProcessRelateUpdateInputSchema,
    role: ManufacturingRoleEnum.optional(),
    claimIds: z.array(z.string()).optional(),
  });

export type PerformsManufacturingProcessRelationshipInput = z.infer<
  typeof PerformsManufacturingProcessRelationshipInputSchema
>;

// DevelopsPlatformRelationshipInput (Create/Connect)
export const DevelopsPlatformRelationshipInputSchema =
  TemporalValidityInputSchema.extend({
    technologyPlatform: TechnologyPlatformRelateInputSchema,
    relationshipRole: RelationshipRoleEnum.nullable().optional(),
    notes: z.string().nullable().optional(),
    source: SourceEnum.nullable().optional(),
    claimIds: z.array(z.string()).optional(),
  });

export const DevelopsPlatformRelationshipUpdateInputSchema =
  TemporalValidityInputSchema.extend({
    technologyPlatform: TechnologyPlatformRelateUpdateInputSchema,
    relationshipRole: RelationshipRoleEnum.nullable().optional(),
    notes: z.string().nullable().optional(),
    source: SourceEnum.nullable().optional(),
    claimIds: z.array(z.string()).optional(),
  });

export type DevelopsPlatformRelationshipInput = z.infer<
  typeof DevelopsPlatformRelationshipInputSchema
>;

// UsesPlatformRelationshipInput (Create/Connect)
export const UsesPlatformRelationshipInputSchema =
  TemporalValidityInputSchema.extend({
    technologyPlatform: TechnologyPlatformRelateInputSchema,
    usageContext: UsageContextEnum.nullable().optional(),
    isPrimary: z.boolean().nullable().optional(),
    notes: z.string().nullable().optional(),
    source: SourceEnum.nullable().optional(),
    claimIds: z.array(z.string()).optional(),
  });

export const UsesPlatformRelationshipUpdateInputSchema =
  TemporalValidityInputSchema.extend({
    technologyPlatform: TechnologyPlatformRelateUpdateInputSchema,
    usageContext: UsageContextEnum.nullable().optional(),
    isPrimary: z.boolean().nullable().optional(),
    notes: z.string().nullable().optional(),
    source: SourceEnum.nullable().optional(),
    claimIds: z.array(z.string()).optional(),
  });

export type UsesPlatformRelationshipInput = z.infer<
  typeof UsesPlatformRelationshipInputSchema
>;

// ============================================================================
// Organization Input Schema
// ============================================================================

// Define OrganizationInput with lazy reference for self-referential relationships
export const OrganizationInputSchema: z.ZodType<any> = z.object({
  organizationId: z.string().optional(),
  name: z.string(),
  aliases: z.array(z.string()).nullable().optional(),
  orgType: OrgTypeEnum,
  description: z.string().nullable().optional(),
  businessModel: BusinessModelEnum.nullable().optional(),
  primaryIndustryTags: z.array(z.string()).nullable().optional(),
  regionsServed: z.array(z.string()).nullable().optional(),
  legalName: z.string().nullable().optional(),
  legalStructure: z.string().nullable().optional(),
  ownershipType: z.string().nullable().optional(),
  jurisdictionsOfIncorporation: z.array(z.string()).nullable().optional(),
  websiteUrl: z.string().nullable().optional(),
  defaultCollectionModes: z.array(z.string()).nullable().optional(),
  defaultRegionsAvailable: z.array(z.string()).nullable().optional(),
  publicTicker: z.string().nullable().optional(),
  fundingStage: z.string().nullable().optional(),
  employeeCountMin: z.number().int().nullable().optional(),
  employeeCountMax: z.number().int().nullable().optional(),

  // DATE-only
  employeeCountAsOf: Neo4jDateString.optional(), // was z.coerce.date()

  revenueAnnualMin: z.number().nullable().optional(),
  revenueAnnualMax: z.number().nullable().optional(),
  revenueAnnualCurrency: z.string().nullable().optional(),

  // DATE-only
  revenueAnnualAsOf: Neo4jDateString.optional(), // was z.coerce.date()

  valuationMin: z.number().nullable().optional(),
  valuationMax: z.number().nullable().optional(),
  valuationCurrency: z.string().nullable().optional(),

  // DATE-only
  valuationAsOf: Neo4jDateString.optional(), // was z.coerce.date()

  // DATETIME
  validAt: Neo4jDateTimeString.optional(), // was z.coerce.date()
  invalidAt: Neo4jDateTimeString.optional(), // was z.coerce.date()
  expiredAt: Neo4jDateTimeString.optional(), // was z.coerce.date()
  createdAt: Neo4jDateTimeString.optional(), // was z.coerce.date()

  // Relationships
  hasLocation: z.array(HasLocationRelationshipInputSchema).optional(),
  ownsOrControls: z.array(OwnsOrControlsRelationshipInputSchema).optional(),
  lists: z.array(ListsRelationshipInputSchema).optional(),
  offersProduct: z.array(OffersProductRelationshipInputSchema).optional(),
  suppliesCompoundForm: z
    .array(SuppliesCompoundFormRelationshipInputSchema)
    .optional(),
  manufactures: z.array(ManufacturesRelationshipInputSchema).optional(),
  manufacturesProduct: z
    .array(ManufacturesProductRelationshipInputSchema)
    .optional(),
  contractManufacturerForOrganization: z
    .array(ContractManufacturerForOrganizationRelationshipInputSchema)
    .optional(),
  contractManufacturerForProduct: z
    .array(ContractManufacturerForProductRelationshipInputSchema)
    .optional(),
  contractManufacturerForCompoundForm: z
    .array(ContractManufacturerForCompoundFormRelationshipInputSchema)
    .optional(),
  performsManufacturingProcess: z
    .array(PerformsManufacturingProcessRelationshipInputSchema)
    .optional(),
  developsPlatform: z.array(DevelopsPlatformRelationshipInputSchema).optional(),
  usesPlatform: z.array(UsesPlatformRelationshipInputSchema).optional(),
});

export type OrganizationInput = z.infer<typeof OrganizationInputSchema>;

// ============================================================================
// UpdateOrganizationInput Schema (all fields optional for partial updates)
// ============================================================================

// Define UpdateOrganizationInput with lazy reference for self-referential relationships
// Since OrganizationInputSchema uses lazy types, we manually create the partial version
export const UpdateOrganizationInputSchema: z.ZodType<any> = z.object({
  organizationId: z.string().optional(),
  name: z.string().optional(),
  aliases: z.array(z.string()).nullable().optional(),
  orgType: OrgTypeEnum.optional(),
  description: z.string().nullable().optional(),
  businessModel: BusinessModelEnum.nullable().optional(),
  primaryIndustryTags: z.array(z.string()).nullable().optional(),
  regionsServed: z.array(z.string()).nullable().optional(),
  legalName: z.string().nullable().optional(),
  legalStructure: z.string().nullable().optional(),
  ownershipType: z.string().nullable().optional(),
  jurisdictionsOfIncorporation: z.array(z.string()).nullable().optional(),
  websiteUrl: z.string().nullable().optional(),
  defaultCollectionModes: z.array(z.string()).nullable().optional(),
  defaultRegionsAvailable: z.array(z.string()).nullable().optional(),
  publicTicker: z.string().nullable().optional(),
  fundingStage: z.string().nullable().optional(),
  employeeCountMin: z.number().int().nullable().optional(),
  employeeCountMax: z.number().int().nullable().optional(),

  // DATE-only
  employeeCountAsOf: Neo4jDateString.optional(), // was z.coerce.date()

  revenueAnnualMin: z.number().nullable().optional(),
  revenueAnnualMax: z.number().nullable().optional(),
  revenueAnnualCurrency: z.string().nullable().optional(),

  // DATE-only
  revenueAnnualAsOf: Neo4jDateString.optional(), // was z.coerce.date()

  valuationMin: z.number().nullable().optional(),
  valuationMax: z.number().nullable().optional(),
  valuationCurrency: z.string().nullable().optional(),

  // DATE-only
  valuationAsOf: Neo4jDateString.optional(), // was z.coerce.date()

  // DATETIME
  validAt: Neo4jDateTimeString.optional(), // was z.coerce.date()
  invalidAt: Neo4jDateTimeString.optional(), // was z.coerce.date()
  expiredAt: Neo4jDateTimeString.optional(), // was z.coerce.date()

  // Relationships use update versions
  hasLocation: z.array(HasLocationRelationshipUpdateInputSchema).optional(),
  ownsOrControls: z
    .array(OwnsOrControlsRelationshipUpdateInputSchema)
    .optional(),
  lists: z.array(ListsRelationshipUpdateInputSchema).optional(),
  offersProduct: z.array(OffersProductRelationshipUpdateInputSchema).optional(),
  suppliesCompoundForm: z
    .array(SuppliesCompoundFormRelationshipUpdateInputSchema)
    .optional(),
  manufactures: z.array(ManufacturesRelationshipUpdateInputSchema).optional(),
  manufacturesProduct: z
    .array(ManufacturesProductRelationshipUpdateInputSchema)
    .optional(),
  contractManufacturerForOrganization: z
    .array(ContractManufacturerForOrganizationRelationshipUpdateInputSchema)
    .optional(),
  contractManufacturerForProduct: z
    .array(ContractManufacturerForProductRelationshipUpdateInputSchema)
    .optional(),
  contractManufacturerForCompoundForm: z
    .array(ContractManufacturerForCompoundFormRelationshipUpdateInputSchema)
    .optional(),
  performsManufacturingProcess: z
    .array(PerformsManufacturingProcessRelationshipUpdateInputSchema)
    .optional(),
  developsPlatform: z
    .array(DevelopsPlatformRelationshipUpdateInputSchema)
    .optional(),
  usesPlatform: z.array(UsesPlatformRelationshipUpdateInputSchema).optional(),
});

export type UpdateOrganizationInput = z.infer<
  typeof UpdateOrganizationInputSchema
>;
