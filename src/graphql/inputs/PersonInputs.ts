import { z } from "zod";
import { Neo4jDateTimeString } from "../utils/dateTimeUtils.js";



export const PersonInputSchema = z.object({
  personId: z.string().optional(),
  canonicalName: z.string(),
  aliases: z.array(z.string()).nullable().optional(),
  validAt: Neo4jDateTimeString.optional(),
  expiredAt: Neo4jDateTimeString.optional(),
  invalidAt: Neo4jDateTimeString.optional(),
  createdAt: Neo4jDateTimeString.optional(),
});

export type PersonInput = z.infer<typeof PersonInputSchema>;

export const PersonRelateInputSchema = z
  .object({
    create: PersonInputSchema.optional(),
    connect: z.object({ personId: z.string() }).optional(),
  })
  .refine((data) => (data.create ? 1 : 0) + (data.connect ? 1 : 0) === 1, {
    message: "PersonRelateInput: exactly one of 'create' or 'connect' must be provided",
  });

export type PersonRelateInput = z.infer<typeof PersonRelateInputSchema>;