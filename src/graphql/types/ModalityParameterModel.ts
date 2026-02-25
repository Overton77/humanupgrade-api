import { z } from "zod";
import { ModalityParameterValueTypeEnum } from "../enums/index.js";
import { Neo4jDateTimeString } from "../utils/dateTimeUtils.js";

// ============================================================================
// ModalityParameter Schema
// ============================================================================

export const ModalityParameterSchema = z.object({
  modalityParameterId: z.string(),
  canonicalName: z.string(),
  description: z.string().nullable(),
  parameterKey: z.string().nullable(),
  valueType: ModalityParameterValueTypeEnum.nullable(),
  defaultValue: z.string().nullable(),
  unit: z.string().nullable(),
  validAt: Neo4jDateTimeString,
  invalidAt: Neo4jDateTimeString.nullable(),
  expiredAt: Neo4jDateTimeString.nullable(),
  createdAt: Neo4jDateTimeString,
});

export type ModalityParameter = z.infer<typeof ModalityParameterSchema>;
