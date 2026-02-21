import { z } from "zod";
import { Neo4jDateTimeString } from "../utils/dateTimeUtils.js";

/**
 * SearchSurface
 *
 * Represents a derived, retrieval-optimized surface for vector + hybrid search.
 * This is NOT canonical content.
 * It may be regenerated at any time from underlying text/chunks.
 */
export const SearchSurfaceSchema = z.object({
  searchText: z.string().nullable(),
  searchTextEmbedding: z.array(z.number()).nullable(), // float[]
  searchTextModel: z.string().nullable(),              // e.g. text-embedding-3-large
  searchTextVersion: z.string().nullable(),            // pipeline version (v1, v2, etc.)
  searchTextUpdatedAt: Neo4jDateTimeString.nullable(),
});

export type SearchSurface = z.infer<typeof SearchSurfaceSchema>;
