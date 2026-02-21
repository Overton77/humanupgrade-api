import { z } from "zod";
import { Neo4jDateTimeString } from "../utils/dateTimeUtils.js";

// ============================================================================
// ResearchPlanRef Schema
// ============================================================================

export const ResearchPlanRefSchema = z.object({
  researchPlanRefId: z.string(),
  mongoPlanId: z.string(), // unique
  label: z.string().nullable(),
  version: z.string().nullable(),

  // Temporal + audit
  validAt: Neo4jDateTimeString,
  expiredAt: Neo4jDateTimeString.nullable(),
  invalidAt: Neo4jDateTimeString.nullable(),
  createdAt: Neo4jDateTimeString,
  updatedAt: Neo4jDateTimeString,
});

export type ResearchPlanRef = z.infer<typeof ResearchPlanRefSchema>;
