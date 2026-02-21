import { z } from "zod";
import { Neo4jDateTimeString } from "../utils/dateTimeUtils.js";

// ============================================================================
// Biomarker Input Schema
// ============================================================================

export const BiomarkerInputSchema = z.object({
  biomarkerId: z.string().optional(),
  name: z.string(),
  synonyms: z.array(z.string()).nullable().optional(),
  description: z.string().nullable().optional(),
  clinicalDomains: z.array(z.string()).nullable().optional(),
  unitsCommon: z.array(z.string()).nullable().optional(),
  interpretationNotes: z.string().nullable().optional(),
  validAt: Neo4jDateTimeString.optional(),
  invalidAt: Neo4jDateTimeString.optional(),
  expiredAt: Neo4jDateTimeString.optional(),
  createdAt: Neo4jDateTimeString.optional(),
});

export type BiomarkerInput = z.infer<typeof BiomarkerInputSchema>;

// ============================================================================
// Biomarker Update Input Schema
// ============================================================================

export const BiomarkerUpdateInputSchema = BiomarkerInputSchema.partial().extend({
  biomarkerId: z.string().optional(),
});

export type BiomarkerUpdateInput = z.infer<typeof BiomarkerUpdateInputSchema>;

// ============================================================================
// Biomarker Relate Input Schema (Create/Connect)
// ============================================================================

export const BiomarkerRelateInputSchema = z
  .object({
    create: BiomarkerInputSchema.optional(),
    connect: z.object({ biomarkerId: z.string() }).optional(),
  })
  .refine((data) => (data.create ? 1 : 0) + (data.connect ? 1 : 0) === 1, {
    message: "Exactly one of 'create' or 'connect' must be provided",
  });

// ============================================================================
// Biomarker Relate Update Input Schema (Create/Connect/Update)
// ============================================================================

export const BiomarkerRelateUpdateInputSchema = z
  .object({
    create: BiomarkerInputSchema.optional(),
    connect: z.object({ biomarkerId: z.string() }).optional(),
    update: BiomarkerUpdateInputSchema.optional(),
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
