import { z } from "zod";
import { ModalityRoleEnum } from "../enums/index.js";
import { Neo4jDateTimeString } from "../utils/dateTimeUtils.js";
import { TemporalValiditySchema } from "./TemporalValidityModel.js";
import { ModalityTypeSchema } from "./ModalityTypeModel.js";
import { ModalityParameterSchema } from "./ModalityParameterModel.js";

// ============================================================================
// Edge: Modality -[:INSTANCE_OF]-> ModalityType
// ============================================================================

export const ModalityInstanceOfEdgeSchema = TemporalValiditySchema.extend({
  modalityType: ModalityTypeSchema,
});

export type ModalityInstanceOfEdge = z.infer<
  typeof ModalityInstanceOfEdgeSchema
>;

// ============================================================================
// Edge: Modality -[:HAS_PARAMETER]-> ModalityParameter
// ============================================================================

export const ModalityHasParameterEdgeSchema = TemporalValiditySchema.extend({
  modalityParameter: ModalityParameterSchema,
  value: z.string().nullable(),
  unit: z.string().nullable(),
  min: z.number().nullable(),
  max: z.number().nullable(),
  notes: z.string().nullable(),
});

export type ModalityHasParameterEdge = z.infer<
  typeof ModalityHasParameterEdgeSchema
>;

// ============================================================================
// Modality Schema
// ============================================================================

export const ModalitySchema = z.object({
  modalityId: z.string(),
  canonicalName: z.string(),
  description: z.string().nullable(),
  modalityRole: ModalityRoleEnum.nullable(),
  validAt: Neo4jDateTimeString,
  invalidAt: Neo4jDateTimeString.nullable(),
  expiredAt: Neo4jDateTimeString.nullable(),
  createdAt: Neo4jDateTimeString,

  // Relationships
  instanceOf: z.array(ModalityInstanceOfEdgeSchema).nullable(),
  hasParameter: z.array(ModalityHasParameterEdgeSchema).nullable(),
});

export type Modality = z.infer<typeof ModalitySchema>;
