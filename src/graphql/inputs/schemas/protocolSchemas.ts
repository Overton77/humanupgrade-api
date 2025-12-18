import { z } from "zod";
import { MediaLinkSchema } from "./mediaLinkSchema.js";
import { ProtocolCategorySchema } from "./productSchemas.js";
import {
  ObjectIdSchema,
  ObjectIdArraySchema,
  OptionalUrlSchema,
} from "../../../lib/validation.js";

/**
 * Protocol scalar fields
 */

export const ProtocolCategoryCoerceSchema = z
  .string()
  .transform((s) => s.trim().toLowerCase())
  .pipe(ProtocolCategorySchema);

export const ProtocolScalarFieldsSchema = z.object({
  name: z.string().min(1, "Protocol name is required").max(200),
  description: z.string().max(5000).optional(),
  categories: z
    .array(ProtocolCategoryCoerceSchema)
    .min(1, "At least one category is required"),
  goals: z.array(z.string().min(1)).min(1, "At least one goal is required"),
  steps: z.array(z.string().min(1)).min(1, "At least one step is required"),
  cautions: z.array(z.string()).optional(),
  aliases: z.array(z.string()).optional(),
  sourceUrl: OptionalUrlSchema,
});

/**
 * Protocol scalar update fields
 */
export const ProtocolScalarUpdateFieldsSchema =
  ProtocolScalarFieldsSchema.partial().extend({
    id: ObjectIdSchema,
  });

/**
 * Protocol create with optional IDs
 */
export const ProtocolCreateWithOptionalIdsInputSchema =
  ProtocolScalarFieldsSchema.extend({
    productIds: ObjectIdArraySchema.optional(),
    compoundIds: ObjectIdArraySchema.optional(),
  });

/**
 * Protocol update with optional IDs
 */
export const ProtocolUpdateWithOptionalIdsInputSchema =
  ProtocolScalarUpdateFieldsSchema.extend({
    productIds: ObjectIdArraySchema.optional(),
    compoundIds: ObjectIdArraySchema.optional(),
  });

/**
 * Protocol product nested input
 */
export const ProtocolProductNestedInputSchema = z
  .object({
    id: ObjectIdSchema.optional(),
    name: z.string().min(1).max(200).optional(),
    businessId: ObjectIdSchema.optional(),
    description: z.string().max(5000).optional(),
    ingredients: z.array(z.string()).optional(),
    price: z.number().nonnegative().optional(),
    mediaLinks: z.array(MediaLinkSchema).optional(),
    sourceUrl: OptionalUrlSchema,
  })
  .refine((data) => data.id || data.name, {
    message: "Either 'id' or 'name' must be provided",
    path: ["name"],
  })
  .refine((data) => data.id || data.businessId, {
    message: "businessId is required when creating a new product",
    path: ["businessId"],
  });

/**
 * Protocol compound nested input
 */
export const ProtocolCompoundNestedInputSchema = z
  .object({
    id: ObjectIdSchema.optional(),
    name: z.string().min(1).max(200).optional(),
    description: z.string().max(5000).optional(),
    aliases: z.array(z.string()).optional(),
    mediaLinks: z.array(MediaLinkSchema).optional(),
  })
  .refine((data) => data.id || data.name, {
    message: "Either 'id' or 'name' must be provided",
    path: ["name"],
  });

/**
 * Protocol update relation fields input
 */
export const ProtocolUpdateRelationFieldsInputSchema = z.object({
  id: ObjectIdSchema,
  productIds: ObjectIdArraySchema.optional(),
  productsNested: z.array(ProtocolProductNestedInputSchema).optional(),
  compoundIds: ObjectIdArraySchema.optional(),
  compoundsNested: z.array(ProtocolCompoundNestedInputSchema).optional(),
});
