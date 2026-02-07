import { z } from "zod";
import { Neo4jDateTimeString } from "../utils/dateTimeUtils.js";

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
});

export type PanelDefinition = z.infer<typeof PanelDefinitionSchema>;

