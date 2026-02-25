import { z } from "zod";
import { Neo4jDateTimeString } from "../utils/dateTimeUtils.js";
import { TemporalValiditySchema } from "./TemporalValidityModel.js";
import { LabTestSchema } from "./LabTestModel.js";
import { BiomarkerSchema } from "./BiomarkerModel.js";

// ============================================================================
// Edge: PanelDefinition -[:INCLUDES_LAB_TEST]-> LabTest
// ============================================================================

export const IncludesLabTestEdgeSchema = TemporalValiditySchema.extend({
  labTest: LabTestSchema,
  required: z.boolean().nullable(),
  quantity: z.number().int().nullable(),
  notes: z.string().nullable(),
  claimIds: z.array(z.string()).nullable(),
});

export type IncludesLabTestEdge = z.infer<typeof IncludesLabTestEdgeSchema>;

// ============================================================================
// Edge: PanelDefinition -[:INCLUDES_BIOMARKER]-> Biomarker
// ============================================================================

export const IncludesBiomarkerEdgeSchema = TemporalValiditySchema.extend({
  biomarker: BiomarkerSchema,
  claimIds: z.array(z.string()).nullable(),
});

export type IncludesBiomarkerEdge = z.infer<typeof IncludesBiomarkerEdgeSchema>;

// ============================================================================
// PanelDefinition Schema
// ============================================================================

export const PanelDefinitionSchema = z.object({
  panelDefinitionId: z.string(),
  canonicalName: z.string(),
  aliases: z.array(z.string()).nullable(),
  description: z.string().nullable(),
  validAt: Neo4jDateTimeString,
  invalidAt: Neo4jDateTimeString.nullable(),
  expiredAt: Neo4jDateTimeString.nullable(),
  createdAt: Neo4jDateTimeString,

  // Relationships
  includesLabTest: z.array(IncludesLabTestEdgeSchema).nullable(),
  includesBiomarker: z.array(IncludesBiomarkerEdgeSchema).nullable(),
});

export type PanelDefinition = z.infer<typeof PanelDefinitionSchema>;
