import { z } from "zod";
import { Neo4jDateTimeString } from "../utils/dateTimeUtils.js";
import { TemporalValidityInputSchema } from "./TemporalValidityInputs.js";
import { LabTestRelateInputSchema, LabTestRelateUpdateInputSchema } from "./LabTestInputs.js";
import { BiomarkerRelateInputSchema, BiomarkerRelateUpdateInputSchema } from "./BiomarkerInputs.js";

// ============================================================================
// PanelDefinition Input Schema
// ============================================================================

export const PanelDefinitionInputSchema = z.object({
  panelDefinitionId: z.string().optional(),
  canonicalName: z.string(),
  aliases: z.array(z.string()).nullable().optional(),
  description: z.string().nullable().optional(),
  validAt: Neo4jDateTimeString.optional(),
  invalidAt: Neo4jDateTimeString.optional(),
  expiredAt: Neo4jDateTimeString.optional(),
  createdAt: Neo4jDateTimeString.optional(),
});

export type PanelDefinitionInput = z.infer<typeof PanelDefinitionInputSchema>;

// ============================================================================
// PanelDefinition Update Input Schema
// ============================================================================

export const PanelDefinitionUpdateInputSchema =
  PanelDefinitionInputSchema.partial().extend({
    panelDefinitionId: z.string().optional(),
  });

export type PanelDefinitionUpdateInput = z.infer<
  typeof PanelDefinitionUpdateInputSchema
>;

// ============================================================================
// PanelDefinition Relate Input Schema (Create/Connect)
// ============================================================================

export const PanelDefinitionRelateInputSchema = z
  .object({
    create: PanelDefinitionInputSchema.optional(),
    connect: z.object({ panelDefinitionId: z.string() }).optional(),
  })
  .refine((data) => (data.create ? 1 : 0) + (data.connect ? 1 : 0) === 1, {
    message: "Exactly one of 'create' or 'connect' must be provided",
  });

// ============================================================================
// PanelDefinition Relate Update Input Schema (Create/Connect/Update)
// ============================================================================

export const PanelDefinitionRelateUpdateInputSchema = z
  .object({
    create: PanelDefinitionInputSchema.optional(),
    connect: z.object({ panelDefinitionId: z.string() }).optional(),
    update: PanelDefinitionUpdateInputSchema.optional(),
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

// IncludesLabTestRelationshipInput (Create/Connect)
export const IncludesLabTestRelationshipInputSchema =
  TemporalValidityInputSchema.extend({
    labTest: LabTestRelateInputSchema,
    required: z.boolean().nullable().optional(),
    quantity: z.number().int().nullable().optional(),
    notes: z.string().nullable().optional(),
    claimIds: z.array(z.string()).optional(),
  });

export const IncludesLabTestRelationshipUpdateInputSchema =
  TemporalValidityInputSchema.extend({
    labTest: LabTestRelateUpdateInputSchema,
    required: z.boolean().nullable().optional(),
    quantity: z.number().int().nullable().optional(),
    notes: z.string().nullable().optional(),
    claimIds: z.array(z.string()).optional(),
  });

export type IncludesLabTestRelationshipInput = z.infer<
  typeof IncludesLabTestRelationshipInputSchema
>;

// IncludesBiomarkerRelationshipInput (Create/Connect)
export const IncludesBiomarkerRelationshipInputSchema =
  TemporalValidityInputSchema.extend({
    biomarker: BiomarkerRelateInputSchema,
    claimIds: z.array(z.string()).optional(),
  });

export const IncludesBiomarkerRelationshipUpdateInputSchema =
  TemporalValidityInputSchema.extend({
    biomarker: BiomarkerRelateUpdateInputSchema,
    claimIds: z.array(z.string()).optional(),
  });

export type IncludesBiomarkerRelationshipInput = z.infer<
  typeof IncludesBiomarkerRelationshipInputSchema
>;

// ============================================================================
// PanelDefinition Input Schema (with Relationships)
// ============================================================================

export const PanelDefinitionInputWithRelationsSchema = PanelDefinitionInputSchema.extend({
  // Relationships
  includesLabTest: z.array(IncludesLabTestRelationshipInputSchema).optional(),
  includesBiomarker: z.array(IncludesBiomarkerRelationshipInputSchema).optional(),
});

export type PanelDefinitionInputWithRelations = z.infer<
  typeof PanelDefinitionInputWithRelationsSchema
>;

// ============================================================================
// Update PanelDefinition Input Schema (with Relationships)
// ============================================================================

export const UpdatePanelDefinitionInputWithRelationsSchema = PanelDefinitionUpdateInputSchema.extend({
  // Relationships use update versions
  includesLabTest: z.array(IncludesLabTestRelationshipUpdateInputSchema).optional(),
  includesBiomarker: z.array(IncludesBiomarkerRelationshipUpdateInputSchema).optional(),
});

export type UpdatePanelDefinitionInputWithRelations = z.infer<
  typeof UpdatePanelDefinitionInputWithRelationsSchema
>;
