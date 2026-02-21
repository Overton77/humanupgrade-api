import { z } from "zod";
import { Neo4jDateTimeString } from "../utils/dateTimeUtils.js";

export const TemporalValidityInputSchema = z.object({
  validAt: Neo4jDateTimeString.optional(),
  invalidAt: Neo4jDateTimeString.optional(),
  expiredAt: Neo4jDateTimeString.optional(),
  createdAt: Neo4jDateTimeString.optional(), // Optional in input, will default to now in DB logic if desired
});

export type TemporalValidityInput = z.infer<typeof TemporalValidityInputSchema>;
