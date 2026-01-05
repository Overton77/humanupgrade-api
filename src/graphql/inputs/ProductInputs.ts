import z from "zod";
import { ProductDomainEnum } from "../enums/index.js";

export const ProductInputSchema = z.object({
  productId: z.string().optional(),
  name: z.string(),
  synonyms: z.array(z.string()).nullable().optional(),
  productDomain: ProductDomainEnum,
  productType: z.string().nullable().optional(),
  intendedUse: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  brandName: z.string().nullable().optional(),
  modelNumber: z.string().nullable().optional(),
  ndcCode: z.string().nullable().optional(),
  upc: z.string().nullable().optional(),
  gtin: z.string().nullable().optional(),
  riskClass: z.string().nullable().optional(),
  currency: z.string().nullable().optional(),
  priceAmount: z.number().nullable().optional(),
});

export type ProductInput = z.infer<typeof ProductInputSchema>;

export const ProductUpdateInputSchema = ProductInputSchema.partial().extend({
  productId: z.string().optional(),
});

export type ProductUpdateInput = z.infer<typeof ProductUpdateInputSchema>;

export const ProductRelateInputSchema = z
  .object({
    create: ProductInputSchema.optional(),
    connect: z.object({ productId: z.string() }).optional(),
  })
  .refine((data) => (data.create ? 1 : 0) + (data.connect ? 1 : 0) === 1, {
    message: "Exactly one of 'create' or 'connect' must be provided",
  });

// OffersProductRelationshipUpdateInput (Create/Connect/Update)
export const ProductRelateUpdateInputSchema = z
  .object({
    create: ProductInputSchema.optional(),
    connect: z.object({ productId: z.string() }).optional(),
    update: ProductUpdateInputSchema.optional(),
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
