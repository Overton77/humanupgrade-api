import { z } from "zod";
import { Neo4jDateTimeString } from "../utils/dateTimeUtils.js";
import { TemporalValiditySchema } from "./TemporalValidityModel.js";
import { ResearchPlanRefSchema } from "./ResearchPlanRefModel.js";

// ============================================================================
// Edge Type Schemas (Relationship + Node)
// ============================================================================

// UsesPlanEdge (ResearchRunRef -> ResearchPlanRef)
export const UsesPlanEdgeSchema = TemporalValiditySchema.extend({
  researchPlanRef: ResearchPlanRefSchema,
});

export type UsesPlanEdge = z.infer<typeof UsesPlanEdgeSchema>;

// ============================================================================
// ResearchRunRef Schema
// ============================================================================

export const ResearchRunRefSchema = z.object({
  researchRunRefId: z.string(),
  mongoRunId: z.string(), // unique
  label: z.string().nullable(), // e.g. "synthetic_run_2026_02_06"
  startedAt: Neo4jDateTimeString,
  endedAt: Neo4jDateTimeString,

  // Temporal + audit
  validAt: Neo4jDateTimeString,
  expiredAt: Neo4jDateTimeString.nullable(),
  invalidAt: Neo4jDateTimeString.nullable(),
  createdAt: Neo4jDateTimeString,
  updatedAt: Neo4jDateTimeString,

  // Relationships as arrays of edge types
  usesPlan: z.array(UsesPlanEdgeSchema).nullable(),
});

export type ResearchRunRef = z.infer<typeof ResearchRunRefSchema>;
