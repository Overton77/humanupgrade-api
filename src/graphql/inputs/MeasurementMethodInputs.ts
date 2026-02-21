import { z } from "zod";
import { Neo4jDateTimeString } from "../utils/dateTimeUtils.js";

// ============================================================================
// MeasurementMethod Input Schema
// ============================================================================

export const MeasurementMethodInputSchema = z.object({
  methodId: z.string().optional(),
  canonicalName: z.string(),
  methodFamily: z.string(),
  analyticPrinciple: z.string().nullable().optional(),
  typicalCvPercentMin: z.number().nullable().optional(),
  typicalCvPercentMax: z.number().nullable().optional(),
  validAt: Neo4jDateTimeString.optional(),
  invalidAt: Neo4jDateTimeString.optional(),
  expiredAt: Neo4jDateTimeString.optional(),
  createdAt: Neo4jDateTimeString.optional(),
});

export type MeasurementMethodInput = z.infer<typeof MeasurementMethodInputSchema>;

// ============================================================================
// MeasurementMethod Update Input Schema
// ============================================================================

export const MeasurementMethodUpdateInputSchema = MeasurementMethodInputSchema.partial().extend({
  methodId: z.string().optional(),
});

export type MeasurementMethodUpdateInput = z.infer<typeof MeasurementMethodUpdateInputSchema>;

// ============================================================================
// MeasurementMethod Relate Input Schema (Create/Connect)
// ============================================================================

export const MeasurementMethodRelateInputSchema = z
  .object({
    create: MeasurementMethodInputSchema.optional(),
    connect: z.object({ methodId: z.string() }).optional(),
  })
  .refine((data) => (data.create ? 1 : 0) + (data.connect ? 1 : 0) === 1, {
    message: "Exactly one of 'create' or 'connect' must be provided",
  });

// ============================================================================
// MeasurementMethod Relate Update Input Schema (Create/Connect/Update)
// ============================================================================

export const MeasurementMethodRelateUpdateInputSchema = z
  .object({
    create: MeasurementMethodInputSchema.optional(),
    connect: z.object({ methodId: z.string() }).optional(),
    update: MeasurementMethodUpdateInputSchema.optional(),
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
