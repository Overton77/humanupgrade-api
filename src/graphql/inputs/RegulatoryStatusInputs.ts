import { z } from "zod";
import { Neo4jDateTimeString } from "../utils/dateTimeUtils.js";

// ============================================================================
// RegulatoryStatus Input Schema
// ============================================================================

export const RegulatoryStatusInputSchema = z.object({
  regulatoryStatusId: z.string().optional(),
  status: z.string().nullable().optional(),
  effectiveDate: Neo4jDateTimeString.nullable().optional(),
  statusDetails: z.string().nullable().optional(),
  validAt: Neo4jDateTimeString.optional(),
  invalidAt: Neo4jDateTimeString.optional(),
  expiredAt: Neo4jDateTimeString.optional(),
  createdAt: Neo4jDateTimeString.optional(),
});

export type RegulatoryStatusInput = z.infer<typeof RegulatoryStatusInputSchema>;

// ============================================================================
// RegulatoryStatus Update Input Schema
// ============================================================================

export const RegulatoryStatusUpdateInputSchema =
  RegulatoryStatusInputSchema.partial().extend({
    regulatoryStatusId: z.string().optional(),
  });

export type RegulatoryStatusUpdateInput = z.infer<
  typeof RegulatoryStatusUpdateInputSchema
>;

// ============================================================================
// RegulatoryStatus Relate Input Schema (Create/Connect)
// ============================================================================

export const RegulatoryStatusRelateInputSchema = z
  .object({
    create: RegulatoryStatusInputSchema.optional(),
    connect: z.object({ regulatoryStatusId: z.string() }).optional(),
  })
  .refine((data) => (data.create ? 1 : 0) + (data.connect ? 1 : 0) === 1, {
    message: "Exactly one of 'create' or 'connect' must be provided",
  });

// ============================================================================
// RegulatoryStatus Relate Update Input Schema (Create/Connect/Update)
// ============================================================================

export const RegulatoryStatusRelateUpdateInputSchema = z
  .object({
    create: RegulatoryStatusInputSchema.optional(),
    connect: z.object({ regulatoryStatusId: z.string() }).optional(),
    update: RegulatoryStatusUpdateInputSchema.optional(),
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

