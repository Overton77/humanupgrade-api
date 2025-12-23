import { z } from "zod";
import { ObjectIdSchema } from "../../../lib/validation.js";

import {
  ProtocolStepGroupInputSchema,
  EvidenceRefInputSchema,
  SafetyBucketInputSchema,
} from "./protocolPartsSchemas.js";

export const UserProtocolStatusSchema = z.enum(["draft", "active", "archived"]);

export const UserGoalTypeSchema = z.enum([
  "sleep",
  "energy",
  "fatLoss",
  "cognition",
  "longevity",
  "strength",
  "stress",
  "recovery",
  "other",
]);

export const UserProtocolScalarFieldsSchema = z.object({
  title: z.string().min(1, "title is required").max(200),
  goalType: UserGoalTypeSchema.optional(),
  status: UserProtocolStatusSchema.optional(),
  sourceProtocolId: ObjectIdSchema.optional(),
});

export const UserProtocolScalarUpdateFieldsSchema =
  UserProtocolScalarFieldsSchema.partial().extend({
    id: ObjectIdSchema,
  });

export const UserProtocolCreateInputSchema =
  UserProtocolScalarFieldsSchema.extend({
    stepsStructured: z.array(ProtocolStepGroupInputSchema).optional(),
    evidenceRefs: z.array(EvidenceRefInputSchema).optional(),
    safety: SafetyBucketInputSchema.optional(),
  });

export const UserProtocolUpdateInputSchema =
  UserProtocolScalarUpdateFieldsSchema.extend({
    stepsStructured: z.array(ProtocolStepGroupInputSchema).optional(),
    evidenceRefs: z.array(EvidenceRefInputSchema).optional(),
    safety: SafetyBucketInputSchema.optional(),
  });

export const UserProtocolsFilterInputSchema = z.object({
  status: UserProtocolStatusSchema.optional(),
  goalType: UserGoalTypeSchema.optional(),
  search: z.string().max(200).optional(),
});
