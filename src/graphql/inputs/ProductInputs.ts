import { z } from "zod";
import { ProductDomainEnum, LabTestRoleEnum, PanelRoleEnum, CompoundFormRoleEnum } from "../enums/index.js";
import { Neo4jDateTimeString } from "../utils/dateTimeUtils.js";
import { TemporalValidityInputSchema } from "./TemporalValidityInputs.js";
import { LabTestRelateInputSchema, LabTestRelateUpdateInputSchema } from "./LabTestInputs.js";
import { PanelDefinitionRelateInputSchema, PanelDefinitionRelateUpdateInputSchema } from "./PanelDefinitionInputs.js";
import { ProductCategoryRelateInputSchema, ProductCategoryRelateUpdateInputSchema } from "./ProductCategoryInputs.js";
import { RegulatoryPathwayRelateInputSchema, RegulatoryPathwayRelateUpdateInputSchema } from "./RegulatoryPathwayInputs.js";
import { RegulatoryStatusRelateInputSchema, RegulatoryStatusRelateUpdateInputSchema } from "./RegulatoryStatusInputs.js";
import { CompoundFormRelateInputSchema, CompoundFormRelateUpdateInputSchema } from "./CompoundFormInputs.js";
import { TechnologyPlatformRelateInputSchema, TechnologyPlatformRelateUpdateInputSchema } from "./TechnologyPlatformInputs.js"; 
import {
  OrganizationRelateInputSchema,
  OrganizationRelateUpdateInputSchema,
} from "./OrganizationInputs.js"; // static ESM import
// Note: OrganizationRelateInputSchema is defined lazily to avoid circular dependency
// We'll import it at the bottom after all schemas are defined

// ============================================================================
// Product Base Input Schema (without relationships)
// ============================================================================

const ProductBaseInputSchema = z.object({
  productId: z.string().optional(),
  name: z.string(),
  synonyms: z.array(z.string()).nullable().optional(),
  productDomain: ProductDomainEnum,
  productType: z.string().nullable().optional(),
  productFingerprint: z.string().nullable().optional(),
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

  // Lifecycle fields
  validAt: Neo4jDateTimeString.optional(),
  invalidAt: Neo4jDateTimeString.optional(),
  expiredAt: Neo4jDateTimeString.optional(),
  createdAt: Neo4jDateTimeString.optional(),
});

// ============================================================================
// Product Update Base Input Schema (without relationships)
// ============================================================================

const ProductBaseUpdateInputSchema = ProductBaseInputSchema.partial().extend({
  productId: z.string().optional(),
});

// ============================================================================
// Product Relate Input Schema (Create/Connect)
// ============================================================================

// ============================================================================
// Product Relate Input Schema (Create/Connect)
// ============================================================================

export const ProductRelateInputSchema = z
  .object({
    create: ProductBaseInputSchema.optional(),
    connect: z.object({ productId: z.string() }).optional(),
  })
  .refine((data) => (data.create ? 1 : 0) + (data.connect ? 1 : 0) === 1, {
    message: "Exactly one of 'create' or 'connect' must be provided",
  });

// ============================================================================
// Product Relate Update Input Schema (Create/Connect/Update)
// ============================================================================

export const ProductRelateUpdateInputSchema = z
  .object({
    create: ProductBaseInputSchema.optional(),
    connect: z.object({ productId: z.string() }).optional(),
    update: ProductBaseUpdateInputSchema.optional(),
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

// ============================================================================
// Relationship Input Schemas (with nested create/connect/update support)
// ============================================================================

// DeliversLabTestRelationshipInput (Create/Connect)
export const DeliversLabTestRelationshipInputSchema =
  TemporalValidityInputSchema.extend({
    labTest: LabTestRelateInputSchema,
    role: LabTestRoleEnum,
    quantity: z.number().int().nullable().optional(),
    componentName: z.string().nullable().optional(),
    claimIds: z.array(z.string()).optional(),
  });

export const DeliversLabTestRelationshipUpdateInputSchema =
  TemporalValidityInputSchema.extend({
    labTest: LabTestRelateUpdateInputSchema,
    role: LabTestRoleEnum.optional(),
    quantity: z.number().int().nullable().optional(),
    componentName: z.string().nullable().optional(),
    claimIds: z.array(z.string()).optional(),
  });

export type DeliversLabTestRelationshipInput = z.infer<
  typeof DeliversLabTestRelationshipInputSchema
>;

// ImplementsPanelRelationshipInput (Create/Connect)
export const ImplementsPanelRelationshipInputSchema =
  TemporalValidityInputSchema.extend({
    panelDefinition: PanelDefinitionRelateInputSchema,
    panelRole: PanelRoleEnum.nullable().optional(),
    versionLabel: z.string().nullable().optional(),
    claimIds: z.array(z.string()).optional(),
  });

export const ImplementsPanelRelationshipUpdateInputSchema =
  TemporalValidityInputSchema.extend({
    panelDefinition: PanelDefinitionRelateUpdateInputSchema,
    panelRole: PanelRoleEnum.nullable().optional(),
    versionLabel: z.string().nullable().optional(),
    claimIds: z.array(z.string()).optional(),
  });

export type ImplementsPanelRelationshipInput = z.infer<
  typeof ImplementsPanelRelationshipInputSchema
>;

// ContainsCompoundFormRelationshipInput (Create/Connect)
export const ContainsCompoundFormRelationshipInputSchema =
  TemporalValidityInputSchema.extend({
    compoundForm: CompoundFormRelateInputSchema,
    dose: z.number().nullable().optional(),
    doseUnit: z.string().nullable().optional(),
    role: CompoundFormRoleEnum.nullable().optional(),
    standardizedTo: z.string().nullable().optional(),
    claimIds: z.array(z.string()).optional(),
  });

export const ContainsCompoundFormRelationshipUpdateInputSchema =
  TemporalValidityInputSchema.extend({
    compoundForm: CompoundFormRelateUpdateInputSchema,
    dose: z.number().nullable().optional(),
    doseUnit: z.string().nullable().optional(),
    role: CompoundFormRoleEnum.nullable().optional(),
    standardizedTo: z.string().nullable().optional(),
    claimIds: z.array(z.string()).optional(),
  });

export type ContainsCompoundFormRelationshipInput = z.infer<
  typeof ContainsCompoundFormRelationshipInputSchema
>;

// FollowsPathwayRelationshipInput (Create/Connect)
export const FollowsPathwayRelationshipInputSchema =
  TemporalValidityInputSchema.extend({
    regulatoryPathway: RegulatoryPathwayRelateInputSchema,
    jurisdictionId: z.string().nullable().optional(),
    claimIds: z.array(z.string()).optional(),
  });

export const FollowsPathwayRelationshipUpdateInputSchema =
  TemporalValidityInputSchema.extend({
    regulatoryPathway: RegulatoryPathwayRelateUpdateInputSchema,
    jurisdictionId: z.string().nullable().optional(),
    claimIds: z.array(z.string()).optional(),
  });

export type FollowsPathwayRelationshipInput = z.infer<
  typeof FollowsPathwayRelationshipInputSchema
>;

// InCategoryRelationshipInput (Create/Connect)
export const InCategoryRelationshipInputSchema =
  TemporalValidityInputSchema.extend({
    productCategory: ProductCategoryRelateInputSchema,
    claimIds: z.array(z.string()).optional(),
  });

export const InCategoryRelationshipUpdateInputSchema =
  TemporalValidityInputSchema.extend({
    productCategory: ProductCategoryRelateUpdateInputSchema,
    claimIds: z.array(z.string()).optional(),
  });

export type InCategoryRelationshipInput = z.infer<
  typeof InCategoryRelationshipInputSchema
>;

// UsesPlatformRelationshipInput (Create/Connect)
export const ProductUsesPlatformRelationshipInputSchema =
  TemporalValidityInputSchema.extend({
    technologyPlatform: TechnologyPlatformRelateInputSchema,
    claimIds: z.array(z.string()).optional(),
  });

export const ProductUsesPlatformRelationshipUpdateInputSchema =
  TemporalValidityInputSchema.extend({
    technologyPlatform: TechnologyPlatformRelateUpdateInputSchema,
    claimIds: z.array(z.string()).optional(),
  });

export type ProductUsesPlatformRelationshipInput = z.infer<
  typeof ProductUsesPlatformRelationshipInputSchema
>;

// HasRegulatoryStatusRelationshipInput (Create/Connect)
export const HasRegulatoryStatusRelationshipInputSchema =
  TemporalValidityInputSchema.extend({
    regulatoryStatus: RegulatoryStatusRelateInputSchema,
    status: z.string().nullable().optional(),
    effectiveDate: Neo4jDateTimeString.nullable().optional(),
    statusDetails: z.string().nullable().optional(),
    claimIds: z.array(z.string()).optional(),
  });

export const HasRegulatoryStatusRelationshipUpdateInputSchema =
  TemporalValidityInputSchema.extend({
    regulatoryStatus: RegulatoryStatusRelateUpdateInputSchema,
    status: z.string().nullable().optional(),
    effectiveDate: Neo4jDateTimeString.nullable().optional(),
    statusDetails: z.string().nullable().optional(),
    claimIds: z.array(z.string()).optional(),
  });

export type HasRegulatoryStatusRelationshipInput = z.infer<
  typeof HasRegulatoryStatusRelationshipInputSchema
>;

// // ManufacturedByRelationshipInput (Create/Connect) - incoming relationship exposed as outgoing
// // Use lazy schema definition to avoid circular dependency with OrganizationInputs
// let OrganizationRelateInputSchemaLazy: z.ZodType<any>;
// let OrganizationRelateUpdateInputSchemaLazy: z.ZodType<any>;

// export const ManufacturedByRelationshipInputSchema: z.ZodType<any> =
//   TemporalValidityInputSchema.extend({
//     organization: z.lazy(() => {
//       if (!OrganizationRelateInputSchemaLazy) {
//         // Dynamic import to break circular dependency
//         const orgInputs = require("./OrganizationInputs.js");
//         OrganizationRelateInputSchemaLazy = orgInputs.OrganizationRelateInputSchema;
//       }
//       return OrganizationRelateInputSchemaLazy;
//     }),
//     claimIds: z.array(z.string()).optional(),
//   });

// export const ManufacturedByRelationshipUpdateInputSchema: z.ZodType<any> =
//   TemporalValidityInputSchema.extend({
//     organization: z.lazy(() => {
//       if (!OrganizationRelateUpdateInputSchemaLazy) {
//         // Dynamic import to break circular dependency
//         const orgInputs = require("./OrganizationInputs.js");
//         OrganizationRelateUpdateInputSchemaLazy = orgInputs.OrganizationRelateUpdateInputSchema;
//       }
//       return OrganizationRelateUpdateInputSchemaLazy;
//     }),
//     claimIds: z.array(z.string()).optional(),
//   });


export const ManufacturedByRelationshipInputSchema = TemporalValidityInputSchema.extend({
  organization: z.lazy(() => OrganizationRelateInputSchema),
  claimIds: z.array(z.string()).optional(),
});

export const ManufacturedByRelationshipUpdateInputSchema = TemporalValidityInputSchema.extend({
  organization: z.lazy(() => OrganizationRelateUpdateInputSchema),
  claimIds: z.array(z.string()).optional(),
});


export type ManufacturedByRelationshipInput = z.infer<
  typeof ManufacturedByRelationshipInputSchema
>;

// ============================================================================
// Product Input Schema (with Relationships)
// ============================================================================

export const ProductInputSchema = ProductBaseInputSchema.extend({
  // Relationships
  deliversLabTest: z.array(DeliversLabTestRelationshipInputSchema).optional(),
  implementsPanel: z.array(ImplementsPanelRelationshipInputSchema).optional(),
  containsCompoundForm: z
    .array(ContainsCompoundFormRelationshipInputSchema)
    .optional(),
  followsPathway: z.array(FollowsPathwayRelationshipInputSchema).optional(),
  inCategory: z.array(InCategoryRelationshipInputSchema).optional(),
  usesPlatform: z.array(ProductUsesPlatformRelationshipInputSchema).optional(),
  hasRegulatoryStatus: z
    .array(HasRegulatoryStatusRelationshipInputSchema)
    .optional(),
  manufacturedBy: z.array(ManufacturedByRelationshipInputSchema).optional(),
});

export type ProductInput = z.infer<typeof ProductInputSchema>;

// ============================================================================
// Update Product Input Schema (with Relationships)
// ============================================================================

export const UpdateProductInputSchema = ProductBaseUpdateInputSchema.extend({
  // Relationships use update versions
  deliversLabTest: z
    .array(DeliversLabTestRelationshipUpdateInputSchema)
    .optional(),
  implementsPanel: z
    .array(ImplementsPanelRelationshipUpdateInputSchema)
    .optional(),
  containsCompoundForm: z
    .array(ContainsCompoundFormRelationshipUpdateInputSchema)
    .optional(),
  followsPathway: z
    .array(FollowsPathwayRelationshipUpdateInputSchema)
    .optional(),
  inCategory: z.array(InCategoryRelationshipUpdateInputSchema).optional(),
  usesPlatform: z
    .array(ProductUsesPlatformRelationshipUpdateInputSchema)
    .optional(),
  hasRegulatoryStatus: z
    .array(HasRegulatoryStatusRelationshipUpdateInputSchema)
    .optional(),
  manufacturedBy: z
    .array(ManufacturedByRelationshipUpdateInputSchema)
    .optional(),
});

export type UpdateProductInput = z.infer<typeof UpdateProductInputSchema>;
