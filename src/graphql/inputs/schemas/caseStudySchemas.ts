import { z } from "zod";
import {
  ObjectIdSchema,
  ObjectIdArraySchema,
  OptionalUrlSchema,
} from "../../../lib/validation.js";

/**
 * Case study source type enum
 */
export const CaseStudySourceTypeSchema = z.enum([
  "pubmed",
  "clinical-trial",
  "article",
  "other",
]);

/**
 * Case study create input
 */
export const CaseStudyCreateWithOptionalIdsInputSchema = z.object({
  title: z.string().min(1, "Title is required").max(500),
  summary: z.string().min(1, "Summary is required").max(10000),
  url: OptionalUrlSchema,
  sourceType: CaseStudySourceTypeSchema.default("other"),
  episodeIds: ObjectIdArraySchema.optional(),
  compoundIds: ObjectIdArraySchema.optional(),
  productIds: ObjectIdArraySchema.optional(),
  protocolIds: ObjectIdArraySchema.optional(),
});

/**
 * Case study update input
 */
export const CaseStudyUpdateWithOptionalIdsInputSchema =
  CaseStudyCreateWithOptionalIdsInputSchema.partial().extend({
    id: ObjectIdSchema,
  });
