import { z } from "zod";
import { SearchReasonKindEnum } from "../enums/index.js";
import { OrganizationSchema } from "./OrganizationModel.js";

// ============================================================================
// Page Info
// ============================================================================

export const PageInfoSchema = z.object({
  hasNextPage: z.boolean(),
  endCursor: z.string().nullable(),
});

export type PageInfo = z.infer<typeof PageInfoSchema>;

// ============================================================================
// Search Reason
// ============================================================================

export const SearchReasonSchema = z.object({
  kind: SearchReasonKindEnum,
  field: z.string().nullable().optional(),
  value: z.string().nullable().optional(),
  score: z.number().nullable().optional(),
  detail: z.string().nullable().optional(),
});

export type SearchReason = z.infer<typeof SearchReasonSchema>;

// ============================================================================
// Organization Search Hit
// ============================================================================

export const OrganizationSearchHitSchema = z.object({
  node: OrganizationSchema,
  score: z.number().nullable(),
  reasons: z.array(SearchReasonSchema).nullable().optional(),
});

export type OrganizationSearchHit = z.infer<
  typeof OrganizationSearchHitSchema
>;

// ============================================================================
// Organization Search Result
// ============================================================================

export const OrganizationSearchResultSchema = z.object({
  items: z.array(OrganizationSearchHitSchema),
  pageInfo: PageInfoSchema,
});

export type OrganizationSearchResult = z.infer<
  typeof OrganizationSearchResultSchema
>;

