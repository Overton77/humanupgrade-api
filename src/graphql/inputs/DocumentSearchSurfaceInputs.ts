import { z } from "zod";
import { Neo4jDateTimeString } from "../utils/dateTimeUtils.js";

/**
 * Search Surface = derived retrieval layer.
 * - searchText: the text blob you embed for first-stage retrieval.
 * - searchTextEmbedding: the vector stored in Neo4j for native vector index.
 * - searchTextModel/searchTextVersion: helps with future re-embedding or upgrades.
 * - searchTextUpdatedAt: optional dedicated timestamp (separate from node.updatedAt).
 */
export const SearchSurfaceInputSchema = z.object({
  searchText: z.string().nullable().optional(),
  searchTextEmbedding: z.array(z.number()).nullable().optional(), // float[]
  searchTextModel: z.string().nullable().optional(),            // e.g. "text-embedding-3-large"
  searchTextVersion: z.string().nullable().optional(),          // your pipeline version: "v1"
  searchTextUpdatedAt: Neo4jDateTimeString.optional(),          // optional
});

export type SearchSurfaceInput = z.infer<typeof SearchSurfaceInputSchema>;
