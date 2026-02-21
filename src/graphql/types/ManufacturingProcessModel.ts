import { z } from "zod";
import { ProcessTypeEnum, ScalabilityLevelEnum } from "../enums/index.js";
import {
  Neo4jDateString,
  Neo4jDateTimeString,
} from "../utils/dateTimeUtils.js";

// ============================================================================
// ManufacturingProcess Schema
// ============================================================================

export const ManufacturingProcessSchema = z.object({
  manufacturingProcessId: z.string(),
  canonicalName: z.string(),
  processType: ProcessTypeEnum,
  description: z.string().nullable(),
  inputs: z.array(z.string()).nullable(),
  outputs: z.array(z.string()).nullable(),
  qualityRisks: z.array(z.string()).nullable(),
  scalabilityLevel: ScalabilityLevelEnum.nullable(),
  validAt: Neo4jDateTimeString,
  invalidAt: Neo4jDateTimeString.nullable(),
  expiredAt: Neo4jDateTimeString.nullable(),
  createdAt: Neo4jDateTimeString,
});

export type ManufacturingProcess = z.infer<typeof ManufacturingProcessSchema>;
