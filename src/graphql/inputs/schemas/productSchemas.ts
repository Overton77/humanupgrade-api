import { z } from "zod";
import { MediaLinkSchema } from "./mediaLinkSchema.js";
import {
  ObjectIdSchema,
  ObjectIdArraySchema,
  OptionalUrlSchema,
} from "../../../lib/validation.js";

/**
 * Protocol categories enum
 */
export const ProtocolCategorySchema = z.enum([
  "sleep",
  "circadian",
  "fitness",
  "nutrition",
  "cognition",
  "stress",
  "recovery",
  "longevity",
  "health",
  "other",
]);

/**
 * Base scalar fields for Product
 */
export const ProductScalarFieldsSchema = z.object({
  name: z.string().min(1, "Product name is required").max(200),
  description: z.string().max(5000).optional(),
  ingredients: z.array(z.string()).optional(),
  price: z.number().nonnegative("Price must be non-negative").optional(),
  mediaLinks: z.array(MediaLinkSchema).optional(),
  sourceUrl: OptionalUrlSchema,
});

/**
 * Update fields
 */
export const ProductScalarUpdateFieldsSchema =
  ProductScalarFieldsSchema.partial().extend({
    id: ObjectIdSchema,
  });

/**
 * Create with optional IDs
 */
export const ProductCreateWithOptionalIdsInputSchema =
  ProductScalarFieldsSchema.extend({
    businessId: ObjectIdSchema,
    compoundIds: ObjectIdArraySchema.optional(),
    protocolIds: ObjectIdArraySchema.optional(),
  });

/**
 * Update with optional IDs
 */
export const ProductUpdateWithOptionalIdsInputSchema =
  ProductScalarUpdateFieldsSchema.extend({
    compoundIds: ObjectIdArraySchema.optional(),
    protocolIds: ObjectIdArraySchema.optional(),
  });

/**
 * Nested compound input
 */
export const ProductCompoundNestedInputSchema = z
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
 * Nested protocol input
 */
export const ProductProtocolNestedInputSchema = z.object({
  id: ObjectIdSchema.optional(),
  name: z.string().min(1, "Protocol name is required").max(200),
  description: z.string().max(5000).optional(),
  categories: z
    .array(ProtocolCategorySchema)
    .min(1, "At least one category is required"),
  goals: z.array(z.string().min(1)).min(1, "At least one goal is required"),
  steps: z.array(z.string().min(1)).min(1, "At least one step is required"),
  cautions: z.array(z.string()).optional(),
  aliases: z.array(z.string()).optional(),
  sourceUrl: OptionalUrlSchema,
});

/**
 * Rich relation update
 */
export const ProductUpdateRelationFieldsInputSchema = z.object({
  id: ObjectIdSchema,
  compoundIds: ObjectIdArraySchema.optional(),
  compoundsNested: z.array(ProductCompoundNestedInputSchema).optional(),
  protocolIds: ObjectIdArraySchema.optional(),
  protocolsNested: z.array(ProductProtocolNestedInputSchema).optional(),
});
