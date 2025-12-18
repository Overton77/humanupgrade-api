import { z } from "zod";

/**
 * Vector search arguments
 */
export const VectorSearchArgsSchema = z.object({
  query: z.string().min(1, "Query is required"),
  numCandidates: z.number().int().positive().default(100),
  limit: z.number().int().positive().max(100).default(10),
});
