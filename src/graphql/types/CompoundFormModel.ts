import z from "zod";

export const CompoundFormSchema = z.object({
  compoundFormId: z.string(),
  canonicalName: z.string(),
  formType: z.string(),
  chemicalDifferences: z.string().nullable(),
  stabilityProfile: z.string().nullable(),
  solubilityProfile: z.string().nullable(),
  bioavailabilityNotes: z.string().nullable(),
  regulatoryStatusSummary: z.string().nullable(),
});

export type CompoundForm = z.infer<typeof CompoundFormSchema>;
