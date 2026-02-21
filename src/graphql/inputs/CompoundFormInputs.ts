import z from "zod";

export const CompoundFormInputSchema = z.object({
  compoundFormId: z.string().optional(),
  canonicalName: z.string(),
  formType: z.string(),
  chemicalDifferences: z.string().nullable().optional(),
  stabilityProfile: z.string().nullable().optional(),
  solubilityProfile: z.string().nullable().optional(),
  bioavailabilityNotes: z.string().nullable().optional(),
  regulatoryStatusSummary: z.string().nullable().optional(),
});

export type CompoundFormInput = z.infer<typeof CompoundFormInputSchema>;

export const CompoundFormUpdateInputSchema =
  CompoundFormInputSchema.partial().extend({
    compoundFormId: z.string().optional(),
  });

export type CompoundFormUpdateInput = z.infer<
  typeof CompoundFormUpdateInputSchema
>;

export const CompoundFormRelateInputSchema = z
  .object({
    create: CompoundFormInputSchema.optional(),
    connect: z.object({ compoundFormId: z.string() }).optional(),
  })
  .refine((data) => (data.create ? 1 : 0) + (data.connect ? 1 : 0) === 1, {
    message: "Exactly one of 'create' or 'connect' must be provided",
  });

// SuppliesCompoundFormRelationshipUpdateInput (Create/Connect/Update)
export const CompoundFormRelateUpdateInputSchema = z
  .object({
    create: CompoundFormInputSchema.optional(),
    connect: z.object({ compoundFormId: z.string() }).optional(),
    update: CompoundFormUpdateInputSchema.optional(),
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
