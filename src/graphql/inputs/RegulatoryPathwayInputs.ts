import { z } from "zod";
import { Neo4jDateTimeString } from "../utils/dateTimeUtils.js";

// ============================================================================
// RegulatoryPathway Input Schema
// ============================================================================

export const RegulatoryPathwayInputSchema = z.object({
  pathwayId: z.string().optional(),
  authority: z.string(),
  pathwayType: z.string(),
  pathwayName: z.string(),
  requirementsSummary: z.string().nullable().optional(),
  validAt: Neo4jDateTimeString.optional(),
  invalidAt: Neo4jDateTimeString.optional(),
  expiredAt: Neo4jDateTimeString.optional(),
  createdAt: Neo4jDateTimeString.optional(),
});

export type RegulatoryPathwayInput = z.infer<
  typeof RegulatoryPathwayInputSchema
>;

// ============================================================================
// RegulatoryPathway Update Input Schema
// ============================================================================

export const RegulatoryPathwayUpdateInputSchema =
  RegulatoryPathwayInputSchema.partial().extend({
    pathwayId: z.string().optional(),
  });

export type RegulatoryPathwayUpdateInput = z.infer<
  typeof RegulatoryPathwayUpdateInputSchema
>;

// ============================================================================
// RegulatoryPathway Relate Input Schema (Create/Connect)
// ============================================================================

export const RegulatoryPathwayRelateInputSchema = z
  .object({
    create: RegulatoryPathwayInputSchema.optional(),
    connect: z.object({ pathwayId: z.string() }).optional(),
  })
  .refine((data) => (data.create ? 1 : 0) + (data.connect ? 1 : 0) === 1, {
    message: "Exactly one of 'create' or 'connect' must be provided",
  });

// ============================================================================
// RegulatoryPathway Relate Update Input Schema (Create/Connect/Update)
// ============================================================================

export const RegulatoryPathwayRelateUpdateInputSchema = z
  .object({
    create: RegulatoryPathwayInputSchema.optional(),
    connect: z.object({ pathwayId: z.string() }).optional(),
    update: RegulatoryPathwayUpdateInputSchema.optional(),
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

