import { z } from "zod";
import { Neo4jDateTimeString } from "../utils/dateTimeUtils.js";

// ============================================================================
// Specimen Input Schema
// ============================================================================

export const SpecimenInputSchema = z.object({
  specimenId: z.string().optional(),
  canonicalName: z.string(),
  specimenType: z.string(),
  matrix: z.string().nullable().optional(),
  biologicalDomain: z.string(),
  collectionContextCategory: z.string(),
  validAt: Neo4jDateTimeString.optional(),
  invalidAt: Neo4jDateTimeString.optional(),
  expiredAt: Neo4jDateTimeString.optional(),
  createdAt: Neo4jDateTimeString.optional(),
});

export type SpecimenInput = z.infer<typeof SpecimenInputSchema>;

// ============================================================================
// Specimen Update Input Schema
// ============================================================================

export const SpecimenUpdateInputSchema = SpecimenInputSchema.partial().extend({
  specimenId: z.string().optional(),
});

export type SpecimenUpdateInput = z.infer<typeof SpecimenUpdateInputSchema>;

// ============================================================================
// Specimen Relate Input Schema (Create/Connect)
// ============================================================================

export const SpecimenRelateInputSchema = z
  .object({
    create: SpecimenInputSchema.optional(),
    connect: z.object({ specimenId: z.string() }).optional(),
  })
  .refine((data) => (data.create ? 1 : 0) + (data.connect ? 1 : 0) === 1, {
    message: "Exactly one of 'create' or 'connect' must be provided",
  });

// ============================================================================
// Specimen Relate Update Input Schema (Create/Connect/Update)
// ============================================================================

export const SpecimenRelateUpdateInputSchema = z
  .object({
    create: SpecimenInputSchema.optional(),
    connect: z.object({ specimenId: z.string() }).optional(),
    update: SpecimenUpdateInputSchema.optional(),
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
