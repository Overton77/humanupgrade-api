import { z } from "zod";
import { Neo4jDateTimeString } from "../utils/dateTimeUtils.js";

// ============================================================================
// LabTest Input Schema
// ============================================================================

export const LabTestInputSchema = z.object({
  labTestId: z.string().optional(),
  name: z.string(),
  synonyms: z.array(z.string()).nullable().optional(),
  loincCodes: z.array(z.string()).nullable().optional(),
  cptCodes: z.array(z.string()).nullable().optional(),
  whatItMeasures: z.string().nullable().optional(),
  prepRequirements: z.string().nullable().optional(),
  validAt: Neo4jDateTimeString.optional(),
  invalidAt: Neo4jDateTimeString.optional(),
  expiredAt: Neo4jDateTimeString.optional(),
  createdAt: Neo4jDateTimeString.optional(),
});

export type LabTestInput = z.infer<typeof LabTestInputSchema>;

// ============================================================================
// LabTest Update Input Schema
// ============================================================================

export const LabTestUpdateInputSchema = LabTestInputSchema.partial().extend({
  labTestId: z.string().optional(),
});

export type LabTestUpdateInput = z.infer<typeof LabTestUpdateInputSchema>;

// ============================================================================
// LabTest Relate Input Schema (Create/Connect)
// ============================================================================

export const LabTestRelateInputSchema = z
  .object({
    create: LabTestInputSchema.optional(),
    connect: z.object({ labTestId: z.string() }).optional(),
  })
  .refine((data) => (data.create ? 1 : 0) + (data.connect ? 1 : 0) === 1, {
    message: "Exactly one of 'create' or 'connect' must be provided",
  });

// ============================================================================
// LabTest Relate Update Input Schema (Create/Connect/Update)
// ============================================================================

export const LabTestRelateUpdateInputSchema = z
  .object({
    create: LabTestInputSchema.optional(),
    connect: z.object({ labTestId: z.string() }).optional(),
    update: LabTestUpdateInputSchema.optional(),
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

