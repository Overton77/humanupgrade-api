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
  Neo4jDateString,
  Neo4jDateTimeString,
} from "../utils/dateTimeUtils.js";
import { PhysicalLocationSchema } from "./PhysicalLocationModel.js";
import { ListingSchema } from "./ListingModel.js";
import { ProductSchema } from "./ProductModel.js";
import { TemporalValiditySchema } from "./TemporalValidityModel.js";
import { CompoundFormSchema } from "./CompoundFormModel.js";
import { ManufacturingProcessSchema } from "./ManufacturingProcessModel.js";
import { TechnologyPlatformSchema } from "./TechnologyPlatformModel.js";

// TODO: Change Input Types to manufacturesCompoundForm - manufactures is far too vague

// ============================================================================
// Edge Type Schemas (Relationship + Node)
// ============================================================================

// HasLocationEdge
export const HasLocationEdgeSchema = TemporalValiditySchema.extend({
  location: PhysicalLocationSchema,
  locationRole: z.string(),
  isPrimary: z.boolean().nullable(),
  startDate: Neo4jDateString, // was z.date().nullable()
  endDate: Neo4jDateString, // was z.date().nullable()
  claimIds: z.array(z.string()),
});

export type HasLocationEdge = z.infer<typeof HasLocationEdgeSchema>;

// OwnsOrControlsEdge (Organization -> Organization)
export const OwnsOrControlsEdgeSchema = TemporalValiditySchema.extend({
  organization: z.lazy(() => OrganizationSchema), // Self-reference
  relationshipType: z.string(),
  ownershipPercent: z.number().nullable(),
  controlType: z.string().nullable(),
  effectiveFrom: Neo4jDateString, // was z.date().nullable()
  effectiveTo: Neo4jDateString, // was z.date().nullable()
  isCurrent: z.boolean().nullable(),
  claimIds: z.array(z.string()),
});

export type OwnsOrControlsEdge = z.infer<typeof OwnsOrControlsEdgeSchema>;

// ListsEdge
export const ListsEdgeSchema = TemporalValiditySchema.extend({
  listing: ListingSchema,
  listRole: ListRoleEnum,
  channel: ChannelEnum.nullable(),
  regionsOverrides: z.array(z.string()).nullable(),
  collectionModesOverrides: z.array(z.string()).nullable(),
  availabilityNotes: z.string().nullable(),
  claimIds: z.array(z.string()),
});

export type ListsEdge = z.infer<typeof ListsEdgeSchema>;

// OffersProductEdge
export const OffersProductEdgeSchema = TemporalValiditySchema.extend({
  product: ProductSchema,
  // No additional properties specified in the document, but includes temporal validity
});

export type OffersProductEdge = z.infer<typeof OffersProductEdgeSchema>;

// SuppliesCompoundFormEdge
export const SuppliesCompoundFormEdgeSchema = TemporalValiditySchema.extend({
  compoundForm: CompoundFormSchema,
  // No additional properties specified in the document, but includes temporal validity
});

export type SuppliesCompoundFormEdge = z.infer<
  typeof SuppliesCompoundFormEdgeSchema
>;

// ManufacturesEdge (Organization -> CompoundForm)
export const ManufacturesCompoundFormEdgeSchema = TemporalValiditySchema.extend(
  {
    compoundForm: CompoundFormSchema,
    claimIds: z.array(z.string()),
  }
);

export type ManufacturesCompoundFormEdge = z.infer<
  typeof ManufacturesCompoundFormEdgeSchema
>;

// ManufacturesProductEdge (Organization -> Product)
export const ManufacturesProductEdgeSchema = TemporalValiditySchema.extend({
  product: ProductSchema,
  claimIds: z.array(z.string()),
});

export type ManufacturesProductEdge = z.infer<
  typeof ManufacturesProductEdgeSchema
>;

// ContractManufacturerForOrganizationEdge (Organization -> Organization)
export const ContractManufacturerForOrganizationEdgeSchema =
  TemporalValiditySchema.extend({
    organization: z.lazy(() => OrganizationSchema),
    claimIds: z.array(z.string()),
  });

export type ContractManufacturerForOrganizationEdge = z.infer<
  typeof ContractManufacturerForOrganizationEdgeSchema
>;

// ContractManufacturerForProductEdge (Organization -> Product)
export const ContractManufacturerForProductEdgeSchema =
  TemporalValiditySchema.extend({
    product: ProductSchema,
    claimIds: z.array(z.string()),
  });

export type ContractManufacturerForProductEdge = z.infer<
  typeof ContractManufacturerForProductEdgeSchema
>;

// ContractManufacturerForCompoundFormEdge (Organization -> CompoundForm)
export const ContractManufacturerForCompoundFormEdgeSchema =
  TemporalValiditySchema.extend({
    compoundForm: CompoundFormSchema,
    claimIds: z.array(z.string()),
  });

export type ContractManufacturerForCompoundFormEdge = z.infer<
  typeof ContractManufacturerForCompoundFormEdgeSchema
>;

// PerformsManufacturingProcessEdge (Organization -> ManufacturingProcess)
export const PerformsManufacturingProcessEdgeSchema =
  TemporalValiditySchema.extend({
    manufacturingProcess: ManufacturingProcessSchema,
    role: ManufacturingRoleEnum,
    claimIds: z.array(z.string()),
  });

export type PerformsManufacturingProcessEdge = z.infer<
  typeof PerformsManufacturingProcessEdgeSchema
>;

// DevelopsPlatformEdge (Organization -> TechnologyPlatform)
export const DevelopsPlatformEdgeSchema = TemporalValiditySchema.extend({
  technologyPlatform: TechnologyPlatformSchema,
  relationshipRole: RelationshipRoleEnum.nullable(),
  notes: z.string().nullable(),
  source: SourceEnum.nullable(),
  claimIds: z.array(z.string()),
});

export type DevelopsPlatformEdge = z.infer<typeof DevelopsPlatformEdgeSchema>;

// UsesPlatformEdge (Organization -> TechnologyPlatform)
export const UsesPlatformEdgeSchema = TemporalValiditySchema.extend({
  technologyPlatform: TechnologyPlatformSchema,
  usageContext: UsageContextEnum.nullable(),
  isPrimary: z.boolean().nullable(),
  notes: z.string().nullable(),
  source: SourceEnum.nullable(),
  claimIds: z.array(z.string()),
});

export type UsesPlatformEdge = z.infer<typeof UsesPlatformEdgeSchema>;

// ============================================================================
// Organization Schema
// ============================================================================

// Define Organization schema with lazy reference for self-referential edge
export const OrganizationSchema: z.ZodType<any> = z.object({
  organizationId: z.string(),
  name: z.string(),
  aliases: z.array(z.string()).nullable(),
  orgType: OrgTypeEnum,
  description: z.string().nullable(),
  businessModel: BusinessModelEnum.nullable(),
  primaryIndustryTags: z.array(z.string()).nullable(),
  regionsServed: z.array(z.string()).nullable(),
  legalName: z.string().nullable(),
  legalStructure: z.string().nullable(),
  ownershipType: z.string().nullable(),
  jurisdictionsOfIncorporation: z.array(z.string()).nullable(),
  websiteUrl: z.string().nullable(),
  defaultCollectionModes: z.array(z.string()).nullable(),
  defaultRegionsAvailable: z.array(z.string()).nullable(),
  publicTicker: z.string().nullable(),
  fundingStage: z.string().nullable(),
  employeeCountMin: z.number().int().nullable(),
  employeeCountMax: z.number().int().nullable(),

  // DATE-only
  employeeCountAsOf: Neo4jDateString, // was z.date().nullable()

  revenueAnnualMin: z.number().nullable(),
  revenueAnnualMax: z.number().nullable(),
  revenueAnnualCurrency: z.string().nullable(),

  // DATE-only
  revenueAnnualAsOf: Neo4jDateString, // was z.date().nullable()

  valuationMin: z.number().nullable(),
  valuationMax: z.number().nullable(),
  valuationCurrency: z.string().nullable(),

  // DATE-only
  valuationAsOf: Neo4jDateString, // was z.date().nullable()

  // DATETIME
  validAt: Neo4jDateTimeString, // was z.date().nullable()
  invalidAt: Neo4jDateTimeString, // was z.date().nullable()
  expiredAt: Neo4jDateTimeString, // was z.date().nullable()
  createdAt: Neo4jDateTimeString, // was z.date()

  // Relationships as arrays of edge types
  hasLocation: z.array(HasLocationEdgeSchema).nullable(),
  ownsOrControls: z.array(OwnsOrControlsEdgeSchema).nullable(),
  lists: z.array(ListsEdgeSchema).nullable(),
  offersProduct: z.array(OffersProductEdgeSchema).nullable(),
  suppliesCompoundForm: z.array(SuppliesCompoundFormEdgeSchema).nullable(),
  manufactures: z.array(ManufacturesCompoundFormEdgeSchema).nullable(),
  manufacturesProduct: z.array(ManufacturesProductEdgeSchema).nullable(),
  contractManufacturerForOrganization: z
    .array(ContractManufacturerForOrganizationEdgeSchema)
    .nullable(),
  contractManufacturerForProduct: z
    .array(ContractManufacturerForProductEdgeSchema)
    .nullable(),
  contractManufacturerForCompoundForm: z
    .array(ContractManufacturerForCompoundFormEdgeSchema)
    .nullable(),
  performsManufacturingProcess: z
    .array(PerformsManufacturingProcessEdgeSchema)
    .nullable(),
  developsPlatform: z.array(DevelopsPlatformEdgeSchema).nullable(),
  usesPlatform: z.array(UsesPlatformEdgeSchema).nullable(),
});

export type Organization = z.infer<typeof OrganizationSchema>;
