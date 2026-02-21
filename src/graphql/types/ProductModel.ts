import { z } from "zod";
import { ProductDomainEnum, LabTestRoleEnum, PanelRoleEnum, CompoundFormRoleEnum } from "../enums/index.js";
import { Neo4jDateTimeString } from "../utils/dateTimeUtils.js";
import { TemporalValiditySchema } from "./TemporalValidityModel.js";
import { LabTestSchema } from "./LabTestModel.js";
import { PanelDefinitionSchema } from "./PanelDefinitionModel.js";
import { ProductCategorySchema } from "./ProductCategoryModel.js";
import { RegulatoryPathwaySchema } from "./RegulatoryPathwayModel.js";
import { RegulatoryStatusSchema } from "./RegulatoryStatusModel.js";
import { CompoundFormSchema } from "./CompoundFormModel.js";
import { TechnologyPlatformSchema } from "./TechnologyPlatformModel.js";
import { OrganizationSchema } from "./OrganizationModel.js";
import { ResearchRunRefSchema } from "./ResearchRunRefModel.js";

// ============================================================================
// Edge Type Schemas (Relationship + Node)
// ============================================================================

// DeliversLabTestEdge (Product -> LabTest)
export const DeliversLabTestEdgeSchema = TemporalValiditySchema.extend({
  labTest: LabTestSchema,
  role: LabTestRoleEnum,
  quantity: z.number().int().nullable(),
  componentName: z.string().nullable(),
  claimIds: z.array(z.string()),
});

export type DeliversLabTestEdge = z.infer<typeof DeliversLabTestEdgeSchema>;

// ImplementsPanelEdge (Product -> PanelDefinition)
export const ImplementsPanelEdgeSchema = TemporalValiditySchema.extend({
  panelDefinition: PanelDefinitionSchema,
  panelRole: PanelRoleEnum.nullable(),
  versionLabel: z.string().nullable(),
  claimIds: z.array(z.string()),
});

export type ImplementsPanelEdge = z.infer<typeof ImplementsPanelEdgeSchema>;

// ContainsCompoundFormEdge (Product -> CompoundForm)
export const ContainsCompoundFormEdgeSchema = TemporalValiditySchema.extend({
  compoundForm: CompoundFormSchema,
  dose: z.number().nullable(),
  doseUnit: z.string().nullable(),
  role: CompoundFormRoleEnum.nullable(),
  standardizedTo: z.string().nullable(),
  claimIds: z.array(z.string()),
});

export type ContainsCompoundFormEdge = z.infer<typeof ContainsCompoundFormEdgeSchema>;

// FollowsPathwayEdge (Product -> RegulatoryPathway)
export const FollowsPathwayEdgeSchema = TemporalValiditySchema.extend({
  regulatoryPathway: RegulatoryPathwaySchema,
  jurisdictionId: z.string().nullable(),
  claimIds: z.array(z.string()),
});

export type FollowsPathwayEdge = z.infer<typeof FollowsPathwayEdgeSchema>;

// InCategoryEdge (Product -> ProductCategory)
export const InCategoryEdgeSchema = TemporalValiditySchema.extend({
  productCategory: ProductCategorySchema,
  claimIds: z.array(z.string()),
});

export type InCategoryEdge = z.infer<typeof InCategoryEdgeSchema>;

// UsesPlatformEdge (Product -> TechnologyPlatform)
export const ProductUsesPlatformEdgeSchema = TemporalValiditySchema.extend({
  technologyPlatform: TechnologyPlatformSchema,
  claimIds: z.array(z.string()),
});

export type ProductUsesPlatformEdge = z.infer<typeof ProductUsesPlatformEdgeSchema>;

// HasRegulatoryStatusEdge (Product -> RegulatoryStatus)
export const HasRegulatoryStatusEdgeSchema = TemporalValiditySchema.extend({
  regulatoryStatus: RegulatoryStatusSchema,
  status: z.string().nullable(),
  effectiveDate: Neo4jDateTimeString.nullable(),
  statusDetails: z.string().nullable(),
  claimIds: z.array(z.string()),
});

export type HasRegulatoryStatusEdge = z.infer<typeof HasRegulatoryStatusEdgeSchema>;

// ManufacturedByEdge (Product -> Organization) - incoming relationship exposed as outgoing
export const ManufacturedByEdgeSchema = TemporalValiditySchema.extend({
  organization: OrganizationSchema,
  claimIds: z.array(z.string()),
});

export type ManufacturedByEdge = z.infer<typeof ManufacturedByEdgeSchema>;

// GeneratedByEdge (Product -> ResearchRunRef)
export const GeneratedByEdgeSchema = TemporalValiditySchema.extend({
  researchRunRef: ResearchRunRefSchema,
  operation: z.string(), // CREATED | UPDATED | EXTRACTED | LINKED | SUMMARIZED | EMBEDDED
  stageKey: z.string().nullable(),
  subStageKey: z.string().nullable(),
  extractorVersion: z.string().nullable(),
  extractedAt: Neo4jDateTimeString,
});

export type GeneratedByEdge = z.infer<typeof GeneratedByEdgeSchema>;

// ============================================================================
// Product Schema
// ============================================================================

export const ProductSchema = z.object({
  productId: z.string(),
  name: z.string(),
  synonyms: z.array(z.string()).nullable(),
  productDomain: ProductDomainEnum,
  productType: z.string().nullable(), 
  productFingerprint: z.string(), 
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

  // Lifecycle fields
  validAt: Neo4jDateTimeString,
  invalidAt: Neo4jDateTimeString.nullable(),
  expiredAt: Neo4jDateTimeString.nullable(),
  createdAt: Neo4jDateTimeString,

  // Relationships as arrays of edge types
  deliversLabTest: z.array(DeliversLabTestEdgeSchema).nullable(),
  implementsPanel: z.array(ImplementsPanelEdgeSchema).nullable(),
  containsCompoundForm: z.array(ContainsCompoundFormEdgeSchema).nullable(),
  followsPathway: z.array(FollowsPathwayEdgeSchema).nullable(),
  inCategory: z.array(InCategoryEdgeSchema).nullable(),
  usesPlatform: z.array(ProductUsesPlatformEdgeSchema).nullable(),
  hasRegulatoryStatus: z.array(HasRegulatoryStatusEdgeSchema).nullable(),
  manufacturedBy: z.array(ManufacturedByEdgeSchema).nullable(),
  generatedBy: z.array(GeneratedByEdgeSchema).nullable(),
});

export type Product = z.infer<typeof ProductSchema>;
