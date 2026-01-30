import { z } from "zod";
import { Neo4jDateTimeString } from "../utils/dateTimeUtils.js";

// ============================================================================
// ProductCategory Schema
// ============================================================================

export const ProductCategorySchema = z.object({
  categoryId: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  aliases: z.array(z.string()).nullable(),
  validAt: Neo4jDateTimeString,
  invalidAt: Neo4jDateTimeString,
  expiredAt: Neo4jDateTimeString,
  createdAt: Neo4jDateTimeString,
});

export type ProductCategory = z.infer<typeof ProductCategorySchema>;

