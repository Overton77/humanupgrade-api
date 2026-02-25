import { z } from "zod";
import { Neo4jDateTimeString } from "../utils/dateTimeUtils.js";

// ============================================================================
// ModalityType Schema
// ============================================================================

export const ModalityTypeSchema = z.object({
  modalityTypeId: z.string(),
  canonicalName: z.string(),
  description: z.string().nullable(),
  validAt: Neo4jDateTimeString,
  invalidAt: Neo4jDateTimeString.nullable(),
  expiredAt: Neo4jDateTimeString.nullable(),
  createdAt: Neo4jDateTimeString,
});

export type ModalityType = z.infer<typeof ModalityTypeSchema>;
