import { z } from "zod";
import { ProcessTypeEnum, ScalabilityLevelEnum } from "../enums/index.js";
import { Neo4jDateTimeString } from "../utils/dateTimeUtils.js";

// ============================================================================
// ManufacturingProcess Input Schema
// ============================================================================

export const ManufacturingProcessInputSchema = z.object({
  manufacturingProcessId: z.string().optional(),
  canonicalName: z.string(),
  processType: ProcessTypeEnum,
  description: z.string().nullable().optional(),
  inputs: z.array(z.string()).nullable().optional(),
  outputs: z.array(z.string()).nullable().optional(),
  qualityRisks: z.array(z.string()).nullable().optional(),
  scalabilityLevel: ScalabilityLevelEnum.nullable().optional(),
  validAt: Neo4jDateTimeString.optional(),
  invalidAt: Neo4jDateTimeString.optional(),
  expiredAt: Neo4jDateTimeString.optional(),
  createdAt: Neo4jDateTimeString.optional(),
});

export type ManufacturingProcessInput = z.infer<
  typeof ManufacturingProcessInputSchema
>;

// ============================================================================
// ManufacturingProcess Update Input Schema
// ============================================================================

export const ManufacturingProcessUpdateInputSchema =
  ManufacturingProcessInputSchema.partial().extend({
    manufacturingProcessId: z.string().optional(),
  });

export type ManufacturingProcessUpdateInput = z.infer<
  typeof ManufacturingProcessUpdateInputSchema
>;

// ============================================================================
// ManufacturingProcess Relate Input Schema (Create/Connect)
// ============================================================================

export const ManufacturingProcessRelateInputSchema = z
  .object({
    create: ManufacturingProcessInputSchema.optional(),
    connect: z.object({ manufacturingProcessId: z.string() }).optional(),
  })
  .refine((data) => (data.create ? 1 : 0) + (data.connect ? 1 : 0) === 1, {
    message: "Exactly one of 'create' or 'connect' must be provided",
  });

// ============================================================================
// ManufacturingProcess Relate Update Input Schema (Create/Connect/Update)
// ============================================================================

export const ManufacturingProcessRelateUpdateInputSchema = z
  .object({
    create: ManufacturingProcessInputSchema.optional(),
    connect: z.object({ manufacturingProcessId: z.string() }).optional(),
    update: ManufacturingProcessUpdateInputSchema.optional(),
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
