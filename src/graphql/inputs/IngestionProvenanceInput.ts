import { z } from "zod";
import { Neo4jDateTimeString } from "../utils/dateTimeUtils.js";

export const EvidenceProvenanceSchema = z.object({
    mongoRunId: z.string(),
    mongoPlanId: z.string().nullable().optional(),
    stageKey: z.string().nullable().optional(),
    subStageKey: z.string().nullable().optional(),
    extractorVersion: z.string().nullable().optional(),
    extractedAt: Neo4jDateTimeString,
  });
  
export type EvidenceProvenance = z.infer<typeof EvidenceProvenanceSchema>;