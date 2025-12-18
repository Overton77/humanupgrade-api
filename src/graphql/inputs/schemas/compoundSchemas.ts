import { z } from "zod";
import { MediaLinkSchema } from "./mediaLinkSchema.js";
import {
  ObjectIdSchema,
  ObjectIdArraySchema,
} from "../../../lib/validation.js";

/**
 * Compound create input
 */
export const CompoundCreateWithOptionalIdsInputSchema = z.object({
  name: z.string().min(1, "Compound name is required").max(200),
  description: z.string().max(5000).optional(),
  aliases: z.array(z.string()).optional(),
  mediaLinks: z.array(MediaLinkSchema).optional(),
  productIds: ObjectIdArraySchema.optional(),
});

/**
 * Compound update input
 */
export const CompoundUpdateWithOptionalIdsInputSchema =
  CompoundCreateWithOptionalIdsInputSchema.partial().extend({
    id: ObjectIdSchema,
  });

/**
 * Compound product nested input
 */
export const CompoundProductNestedInputSchema = z
  .object({
    id: ObjectIdSchema.optional(),
    name: z.string().min(1).max(200).optional(),
    description: z.string().max(5000).optional(),
    ingredients: z.array(z.string()).optional(),
    mediaLinks: z.array(MediaLinkSchema).optional(),
    sourceUrl: z.string().url().optional().or(z.literal("")),
  })
  .refine((data) => data.id || data.name, {
    message: "Either 'id' or 'name' must be provided",
    path: ["name"],
  });

/**
 * Compound update relation fields input
 */
export const CompoundUpdateRelationFieldsInputSchema = z.object({
  id: ObjectIdSchema,
  productIds: ObjectIdArraySchema.optional(),
  productsNested: z.array(CompoundProductNestedInputSchema).optional(),
});
