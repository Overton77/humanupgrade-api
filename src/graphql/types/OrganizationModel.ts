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

// ============================================================================
// Temporal Validity Schema (used on all relationships)
// ============================================================================

export const TemporalValiditySchema = z.object({
  validAt: z.date().nullable(),
  invalidAt: z.date().nullable(),
  expiredAt: z.date().nullable(),
  createdAt: z.date(),
});

export type TemporalValidity = z.infer<typeof TemporalValiditySchema>;

// ============================================================================
// Base Node Schemas
// ============================================================================

// PhysicalLocation
export const PhysicalLocationSchema = z.object({
  locationId: z.string(),
  canonicalName: z.string(),
  locationType: LocationTypeEnum,
  addressLine1: z.string().nullable(),
  addressLine2: z.string().nullable(),
  city: z.string().nullable(),
  region: z.string().nullable(),
  postalCode: z.string().nullable(),
  countryCode: z.string().nullable(),
  // geo: Point - will be handled as JSON/map in GraphQL
  geo: z.record(z.string(), z.unknown()).nullable(),
  timezone: z.string().nullable(),
  jurisdiction: z.string().nullable(),
  placeTags: z.array(z.string()).nullable(),
  hoursOfOperation: z.string().nullable(),
  // contact: Map - will be handled as JSON object
  contact: z
    .object({
      phone: z.string().optional(),
      email: z.string().optional(),
    })
    .nullable(),
});

export type PhysicalLocation = z.infer<typeof PhysicalLocationSchema>;

// Listing
export const ListingSchema = z.object({
  listingId: z.string(),
  listingDomain: ListingDomainEnum,
  title: z.string(),
  description: z.string().nullable(),
  sku: z.string().nullable(),
  url: z.string().nullable(),
  brandName: z.string().nullable(),
  currency: z.string(),
  priceAmount: z.number().nullable(),
  priceType: PriceTypeEnum.nullable(),
  pricingNotes: z.string().nullable(),
  constraints: z.string().nullable(),
  regionsAvailable: z.array(z.string()).nullable(),
  requiresAppointment: z.boolean().nullable(),
  collectionMode: CollectionModeEnum.nullable(),
  turnaroundTime: z.string().nullable(),
});

export type Listing = z.infer<typeof ListingSchema>;

// Product
export const ProductSchema = z.object({
  productId: z.string(),
  name: z.string(),
  synonyms: z.array(z.string()).nullable(),
  productDomain: ProductDomainEnum,
  productType: z.string().nullable(),
  intendedUse: z.string().nullable(),
  description: z.string().nullable(),
  brandName: z.string().nullable(),
  modelNumber: z.string().nullable(),
  ndcCode: z.string().nullable(),
  upc: z.string().nullable(),
  gtin: z.string().nullable(),
  riskClass: z.string().nullable(),
  currency: z.string().nullable(),
  priceAmount: z.number().nullable(),
});

export type Product = z.infer<typeof ProductSchema>;

// CompoundForm
export const CompoundFormSchema = z.object({
  compoundFormId: z.string(),
  canonicalName: z.string(),
  formType: z.string(),
  chemicalDifferences: z.string().nullable(),
  stabilityProfile: z.string().nullable(),
  solubilityProfile: z.string().nullable(),
  bioavailabilityNotes: z.string().nullable(),
  regulatoryStatusSummary: z.string().nullable(),
});

export type CompoundForm = z.infer<typeof CompoundFormSchema>;

// ============================================================================
// Edge Type Schemas (Relationship + Node)
// ============================================================================

// HasLocationEdge
export const HasLocationEdgeSchema = TemporalValiditySchema.extend({
  location: PhysicalLocationSchema,
  locationRole: z.string(),
  isPrimary: z.boolean().nullable(),
  startDate: z.date().nullable(),
  endDate: z.date().nullable(),
  claimIds: z.array(z.string()),
});

export type HasLocationEdge = z.infer<typeof HasLocationEdgeSchema>;

// OwnsOrControlsEdge (Organization -> Organization)
export const OwnsOrControlsEdgeSchema = TemporalValiditySchema.extend({
  organization: z.lazy(() => OrganizationSchema), // Self-reference
  relationshipType: z.string(),
  ownershipPercent: z.number().nullable(),
  controlType: z.string().nullable(),
  effectiveFrom: z.date().nullable(),
  effectiveTo: z.date().nullable(),
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
  // employeeCountRange: Map {min:Int,max:Int,asOf:Date}
  employeeCountRange: z
    .object({
      min: z.number().optional(),
      max: z.number().optional(),
      asOf: z.date().optional(),
    })
    .nullable(),
  // revenueRangeAnnual: Map {min:Float,max:Float,currency:String,asOf:Date}
  revenueRangeAnnual: z
    .object({
      min: z.number().optional(),
      max: z.number().optional(),
      currency: z.string().optional(),
      asOf: z.date().optional(),
    })
    .nullable(),
  // valuationRange: Map {min:Float,max:Float,currency:String,asOf:Date}
  valuationRange: z
    .object({
      min: z.number().optional(),
      max: z.number().optional(),
      currency: z.string().optional(),
      asOf: z.date().optional(),
    })
    .nullable(),
  validAt: z.date().nullable(),
  invalidAt: z.date().nullable(),
  expiredAt: z.date().nullable(),
  createdAt: z.date(),
  // Relationships as arrays of edge types
  hasLocation: z.array(HasLocationEdgeSchema).nullable(),
  ownsOrControls: z.array(OwnsOrControlsEdgeSchema).nullable(),
  lists: z.array(ListsEdgeSchema).nullable(),
  offersProduct: z.array(OffersProductEdgeSchema).nullable(),
  suppliesCompoundForm: z.array(SuppliesCompoundFormEdgeSchema).nullable(),
});

export type Organization = z.infer<typeof OrganizationSchema>;
