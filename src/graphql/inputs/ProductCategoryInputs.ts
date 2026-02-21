import { z } from "zod";
import { Neo4jDateTimeString } from "../utils/dateTimeUtils.js";

// ============================================================================
// ProductCategory Input Schema
// ============================================================================

export const ProductCategoryInputSchema = z.object({
  categoryId: z.string().optional(),
  name: z.string(),
  description: z.string().nullable().optional(),
  aliases: z.array(z.string()).nullable().optional(),
  validAt: Neo4jDateTimeString.optional(),
  invalidAt: Neo4jDateTimeString.optional(),
  expiredAt: Neo4jDateTimeString.optional(),
  createdAt: Neo4jDateTimeString.optional(),
});

export type ProductCategoryInput = z.infer<typeof ProductCategoryInputSchema>;

// ============================================================================
// ProductCategory Update Input Schema
// ============================================================================

export const ProductCategoryUpdateInputSchema =
  ProductCategoryInputSchema.partial().extend({
    categoryId: z.string().optional(),
  });

export type ProductCategoryUpdateInput = z.infer<
  typeof ProductCategoryUpdateInputSchema
>;

// ============================================================================
// ProductCategory Relate Input Schema (Create/Connect)
// ============================================================================

export const ProductCategoryRelateInputSchema = z
  .object({
    create: ProductCategoryInputSchema.optional(),
    connect: z.object({ categoryId: z.string() }).optional(),
  })
  .refine((data) => (data.create ? 1 : 0) + (data.connect ? 1 : 0) === 1, {
    message: "Exactly one of 'create' or 'connect' must be provided",
  });

// ============================================================================
// ProductCategory Relate Update Input Schema (Create/Connect/Update)
// ============================================================================

export const ProductCategoryRelateUpdateInputSchema = z
  .object({
    create: ProductCategoryInputSchema.optional(),
    connect: z.object({ categoryId: z.string() }).optional(),
    update: ProductCategoryUpdateInputSchema.optional(),
  })
  .refine(
    (data) =>
      (data.create ? 1 : 0) + (data.connect ? 1 : 0) + (data.update ? 1 : 0) ===
      1,
    {
      message:
        "Exactly one of 'create', 'connect', or 'update' must be provided",
    }
  );

