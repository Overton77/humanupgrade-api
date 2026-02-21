import { z } from "zod";
import { Neo4jDateTimeString } from "../utils/dateTimeUtils.js";

// ============================================================================
// RegulatoryStatus Schema
// ============================================================================

export const RegulatoryStatusSchema = z.object({
  regulatoryStatusId: z.string(),
  status: z.string().nullable(),
  effectiveDate: Neo4jDateTimeString.nullable(),
  statusDetails: z.string().nullable(),
  validAt: Neo4jDateTimeString,
  invalidAt: Neo4jDateTimeString.nullable(),
  expiredAt: Neo4jDateTimeString.nullable(),
  createdAt: Neo4jDateTimeString,
});

export type RegulatoryStatus = z.infer<typeof RegulatoryStatusSchema>;

