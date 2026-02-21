import { z } from "zod";
import { Neo4jDateTimeString } from "../utils/dateTimeUtils.js";


// ============================================================================
// Related Node Schemas (output shapes)
// ============================================================================

export const PersonSchema = z.object({
  personId: z.string(),
  canonicalName: z.string(),
  aliases: z.array(z.string()).nullable(),
  validAt: Neo4jDateTimeString.nullable(),
  invalidAt: Neo4jDateTimeString.nullable(),
  expiredAt: Neo4jDateTimeString.nullable(),
  createdAt: Neo4jDateTimeString.nullable(),
});

export type Person = z.infer<typeof PersonSchema>;