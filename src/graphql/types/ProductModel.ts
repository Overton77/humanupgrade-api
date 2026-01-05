import z from "zod";
import { ProductDomainEnum } from "../enums/index.js";

export const ProductSchema = z.object({
  productId: z.string(),
  name: z.string(),
  synonyms: z.array(z.string()).nullable(),
  productDomain: ProductDomainEnum,
  productType: z.string().nullable(),
  intendedUse: z.string().nullable(),
  description: z.string().nullable(),
  brandName: z.string().nullable(),
  modelNumber: z.string().nullable(),
  ndcCode: z.string().nullable(),
  upc: z.string().nullable(),
  gtin: z.string().nullable(),
  riskClass: z.string().nullable(),
  currency: z.string().nullable(),
  priceAmount: z.number().nullable(),
});

export type Product = z.infer<typeof ProductSchema>;
