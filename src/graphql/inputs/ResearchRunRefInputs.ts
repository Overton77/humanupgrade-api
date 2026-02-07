import { z } from "zod";
import { Neo4jDateTimeString } from "../utils/dateTimeUtils.js";
import { TemporalValidityInputSchema } from "./TemporalValidityInputs.js";

// ============================================================================
// ResearchRunRef Input Schema
// ============================================================================

export const UpsertResearchRunRefInputSchema = z.object({
  mongoRunId: z.string(), // unique idempotency key
  label: z.string().nullable().optional(),
  startedAt: Neo4jDateTimeString.optional(),
  endedAt: Neo4jDateTimeString.optional(),
  // Temporal fields (required for upserts)
  validAt: Neo4jDateTimeString,
  expiredAt: Neo4jDateTimeString.optional(),
  invalidAt: Neo4jDateTimeString.optional(),
  createdAt: Neo4jDateTimeString,
  updatedAt: Neo4jDateTimeString,
});

export type UpsertResearchRunRefInput = z.infer<
  typeof UpsertResearchRunRefInputSchema
>;

// ============================================================================
// Link ResearchRunRef Uses Plan Input Schema
// ============================================================================

export const LinkResearchRunUsesPlanInputSchema = z.object({
  mongoRunId: z.string(),
  mongoPlanId: z.string(),
  // Temporal fields for relationship
  validAt: Neo4jDateTimeString.optional(),
  expiredAt: Neo4jDateTimeString.optional(),
  invalidAt: Neo4jDateTimeString.optional(),
  createdAt: Neo4jDateTimeString.optional(),
  updatedAt: Neo4jDateTimeString.optional(),
});

export type LinkResearchRunUsesPlanInput = z.infer<
  typeof LinkResearchRunUsesPlanInputSchema
>;
