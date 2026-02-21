import { z } from "zod";
import { Neo4jDateTimeString } from "../utils/dateTimeUtils.js";

// ============================================================================
// RegulatoryPathway Schema
// ============================================================================

export const RegulatoryPathwaySchema = z.object({
  pathwayId: z.string(),
  authority: z.string(),
  pathwayType: z.string(),
  pathwayName: z.string(),
  requirementsSummary: z.string().nullable(),
  validAt: Neo4jDateTimeString,
  invalidAt: Neo4jDateTimeString.nullable(),
  expiredAt: Neo4jDateTimeString.nullable(),
  createdAt: Neo4jDateTimeString,
});

export type RegulatoryPathway = z.infer<typeof RegulatoryPathwaySchema>;

