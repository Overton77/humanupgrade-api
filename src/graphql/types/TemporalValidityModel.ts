import z from "zod";
import { Neo4jDateTimeString } from "../utils/dateTimeUtils.js";

export const TemporalValiditySchema = z.object({
  validAt: Neo4jDateTimeString, // was z.date().nullable()
  invalidAt: Neo4jDateTimeString, // was z.date().nullable()
  expiredAt: Neo4jDateTimeString, // was z.date().nullable()
  createdAt: Neo4jDateTimeString, // was z.date()
});

export type TemporalValidity = z.infer<typeof TemporalValiditySchema>;
