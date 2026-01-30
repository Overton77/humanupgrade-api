import { z } from "zod";
import { Neo4jDateTimeString } from "../utils/dateTimeUtils.js";

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

