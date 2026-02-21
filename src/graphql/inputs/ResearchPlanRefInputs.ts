import { z } from "zod";
import { Neo4jDateTimeString } from "../utils/dateTimeUtils.js";

// ============================================================================
// ResearchPlanRef Input Schema
// ============================================================================

export const UpsertResearchPlanRefInputSchema = z.object({
  mongoPlanId: z.string(), // unique idempotency key
  label: z.string().nullable().optional(),
  version: z.string().nullable().optional(),
  // Temporal fields (required for upserts)
  validAt: Neo4jDateTimeString,
  expiredAt: Neo4jDateTimeString.optional(),
  invalidAt: Neo4jDateTimeString.optional(),
  createdAt: Neo4jDateTimeString,
  updatedAt: Neo4jDateTimeString
});

export type UpsertResearchPlanRefInput = z.infer<
  typeof UpsertResearchPlanRefInputSchema
>;
