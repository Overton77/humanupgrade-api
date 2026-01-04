import { z } from "zod";
import {
  OrgTypeEnum,
  BusinessModelEnum,
  LocationTypeEnum,
  ListingDomainEnum,
  PriceTypeEnum,
  CollectionModeEnum,
  ProductDomainEnum,
  ListRoleEnum,
  ChannelEnum,
} from "../enums/index.js";
import {
  Neo4jDateTimeString,
  Neo4jDateString,
} from "../utils/dateTimeUtils.js";

// ============================================================================
// Temporal Validity Input Schema (for relationships)
// ============================================================================

export const TemporalValidityInputSchema = z.object({
  validAt: Neo4jDateTimeString.optional(),
  invalidAt: Neo4jDateTimeString.optional(),
  expiredAt: Neo4jDateTimeString.optional(),
  createdAt: Neo4jDateTimeString.optional(), // Optional in input, will default to now in DB logic if desired
});

export type TemporalValidityInput = z.infer<typeof TemporalValidityInputSchema>;

// ============================================================================
// Base Node Input Schemas (Create/Upsert)
// ============================================================================

// PhysicalLocationInput
export const PhysicalLocationInputSchema = z.object({
  locationId: z.string().optional(), // Optional for create, will be generated if not provided
  canonicalName: z.string(),
  locationType: LocationTypeEnum,
  addressLine1: z.string().nullable().optional(),
  addressLine2: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  region: z.string().nullable().optional(),
  postalCode: z.string().nullable().optional(),
  countryCode: z.string().nullable().optional(),
  geoLat: z.number().nullable().optional(),
  geoLon: z.number().nullable().optional(),
  timezone: z.string().nullable().optional(),
  jurisdiction: z.string().nullable().optional(),
  placeTags: z.array(z.string()).nullable().optional(),
  hoursOfOperation: z.string().nullable().optional(),
  contactPhone: z.string().nullable().optional(),
  contactEmail: z.string().nullable().optional(),
});

export type PhysicalLocationInput = z.infer<typeof PhysicalLocationInputSchema>;

// ListingInput
export const ListingInputSchema = z.object({
  listingId: z.string().optional(),
  listingDomain: ListingDomainEnum,
  title: z.string(),
  description: z.string().nullable().optional(),
  sku: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
  brandName: z.string().nullable().optional(),
  currency: z.string(),
  priceAmount: z.number().nullable().optional(),
  priceType: PriceTypeEnum.nullable().optional(),
  pricingNotes: z.string().nullable().optional(),
  constraints: z.string().nullable().optional(),
  regionsAvailable: z.array(z.string()).nullable().optional(),
  requiresAppointment: z.boolean().nullable().optional(),
  collectionMode: CollectionModeEnum.nullable().optional(),
  turnaroundTime: z.string().nullable().optional(),
});

export type ListingInput = z.infer<typeof ListingInputSchema>;

// ProductInput
export const ProductInputSchema = z.object({
  productId: z.string().optional(),
  name: z.string(),
  synonyms: z.array(z.string()).nullable().optional(),
  productDomain: ProductDomainEnum,
  productType: z.string().nullable().optional(),
  intendedUse: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  brandName: z.string().nullable().optional(),
  modelNumber: z.string().nullable().optional(),
  ndcCode: z.string().nullable().optional(),
  upc: z.string().nullable().optional(),
  gtin: z.string().nullable().optional(),
  riskClass: z.string().nullable().optional(),
  currency: z.string().nullable().optional(),
  priceAmount: z.number().nullable().optional(),
});

export type ProductInput = z.infer<typeof ProductInputSchema>;

// CompoundFormInput
export const CompoundFormInputSchema = z.object({
  compoundFormId: z.string().optional(),
  canonicalName: z.string(),
  formType: z.string(),
  chemicalDifferences: z.string().nullable().optional(),
  stabilityProfile: z.string().nullable().optional(),
  solubilityProfile: z.string().nullable().optional(),
  bioavailabilityNotes: z.string().nullable().optional(),
  regulatoryStatusSummary: z.string().nullable().optional(),
});

export type CompoundFormInput = z.infer<typeof CompoundFormInputSchema>;

// ============================================================================
// Update Input Schemas (all fields optional for partial updates)
// ============================================================================

// PhysicalLocationUpdateInput
export const PhysicalLocationUpdateInputSchema =
  PhysicalLocationInputSchema.partial().extend({
    locationId: z.string().optional(), // Keep ID as optional for updates
  });

export type PhysicalLocationUpdateInput = z.infer<
  typeof PhysicalLocationUpdateInputSchema
>;

// ListingUpdateInput
export const ListingUpdateInputSchema = ListingInputSchema.partial().extend({
  listingId: z.string().optional(),
});

export type ListingUpdateInput = z.infer<typeof ListingUpdateInputSchema>;

// ProductUpdateInput
export const ProductUpdateInputSchema = ProductInputSchema.partial().extend({
  productId: z.string().optional(),
});

export type ProductUpdateInput = z.infer<typeof ProductUpdateInputSchema>;

// CompoundFormUpdateInput
export const CompoundFormUpdateInputSchema =
  CompoundFormInputSchema.partial().extend({
    compoundFormId: z.string().optional(),
  });

export type CompoundFormUpdateInput = z.infer<
  typeof CompoundFormUpdateInputSchema
>;

// ============================================================================
// Relationship Input Schemas (with nested create/connect/update support)
// ============================================================================

// HasLocationRelationshipInput (Create/Connect)
export const PhysicalLocationRelateInputSchema = z
  .object({
    create: PhysicalLocationInputSchema.optional(),
    connect: z.object({ locationId: z.string() }).optional(),
  })
  .refine((data) => (data.create ? 1 : 0) + (data.connect ? 1 : 0) === 1, {
    message: "Exactly one of 'create' or 'connect' must be provided",
  });

// HasLocationRelationshipUpdateInput (Create/Connect/Update)
export const PhysicalLocationRelateUpdateInputSchema = z
  .object({
    create: PhysicalLocationInputSchema.optional(),
    connect: z.object({ locationId: z.string() }).optional(),
    update: PhysicalLocationUpdateInputSchema.optional(),
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
export const ListingRelateInputSchema = z
  .object({
    create: ListingInputSchema.optional(),
    connect: z.object({ listingId: z.string() }).optional(),
  })
  .refine((data) => (data.create ? 1 : 0) + (data.connect ? 1 : 0) === 1, {
    message: "Exactly one of 'create' or 'connect' must be provided",
  });

// ListsRelationshipUpdateInput (Create/Connect/Update)
export const ListingRelateUpdateInputSchema = z
  .object({
    create: ListingInputSchema.optional(),
    connect: z.object({ listingId: z.string() }).optional(),
    update: ListingUpdateInputSchema.optional(),
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
export const ProductRelateInputSchema = z
  .object({
    create: ProductInputSchema.optional(),
    connect: z.object({ productId: z.string() }).optional(),
  })
  .refine((data) => (data.create ? 1 : 0) + (data.connect ? 1 : 0) === 1, {
    message: "Exactly one of 'create' or 'connect' must be provided",
  });

// OffersProductRelationshipUpdateInput (Create/Connect/Update)
export const ProductRelateUpdateInputSchema = z
  .object({
    create: ProductInputSchema.optional(),
    connect: z.object({ productId: z.string() }).optional(),
    update: ProductUpdateInputSchema.optional(),
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

export const OffersProductRelationshipInputSchema =
  TemporalValidityInputSchema.extend({
    product: ProductRelateInputSchema,
    // No additional properties, just temporal validity
  });

export const OffersProductRelationshipUpdateInputSchema =
  TemporalValidityInputSchema.extend({
    product: ProductRelateUpdateInputSchema,
    // No additional properties, just temporal validity
  });

export type OffersProductRelationshipInput = z.infer<
  typeof OffersProductRelationshipInputSchema
>;

// SuppliesCompoundFormRelationshipInput (Create/Connect)
export const CompoundFormRelateInputSchema = z
  .object({
    create: CompoundFormInputSchema.optional(),
    connect: z.object({ compoundFormId: z.string() }).optional(),
  })
  .refine((data) => (data.create ? 1 : 0) + (data.connect ? 1 : 0) === 1, {
    message: "Exactly one of 'create' or 'connect' must be provided",
  });

// SuppliesCompoundFormRelationshipUpdateInput (Create/Connect/Update)
export const CompoundFormRelateUpdateInputSchema = z
  .object({
    create: CompoundFormInputSchema.optional(),
    connect: z.object({ compoundFormId: z.string() }).optional(),
    update: CompoundFormUpdateInputSchema.optional(),
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
  createdAt: Neo4jDateTimeString.optional(), // was z.coerce.date()

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
});

export type UpdateOrganizationInput = z.infer<
  typeof UpdateOrganizationInputSchema
>;
