import { z } from "zod";
import {
  OrgTypeEnum,
  BusinessModelEnum,
  SearchModeEnum,
  OrganizationSortFieldEnum,
  SortDirectionEnum,
} from "../enums/index.js";

// ============================================================================
// Page Input
// ============================================================================

export const PageInputSchema = z.object({
  first: z.number().int().positive().default(20),
  after: z.string().nullable().optional(),
});

export type PageInput = z.infer<typeof PageInputSchema>;

// ============================================================================
// Organization Filter Input
// ============================================================================

export const OrganizationFilterInputSchema = z.object({
  orgTypeIn: z.array(OrgTypeEnum).nullable().optional(),
  businessModelIn: z.array(BusinessModelEnum).nullable().optional(),
  regionsServedAny: z.array(z.string()).nullable().optional(),
  primaryIndustryTagsAny: z.array(z.string()).nullable().optional(),
  publicTicker: z.string().nullable().optional(),
  employeeCountMinGte: z.number().int().nullable().optional(),
  employeeCountMaxLte: z.number().int().nullable().optional(),
  isActive: z.boolean().nullable().optional(),
});

export type OrganizationFilterInput = z.infer<
  typeof OrganizationFilterInputSchema
>;

// ============================================================================
// Organization Sort Input
// ============================================================================

export const OrganizationSortInputSchema = z.object({
  field: OrganizationSortFieldEnum,
  direction: SortDirectionEnum.default("DESC"),
});

export type OrganizationSortInput = z.infer<
  typeof OrganizationSortInputSchema
>;

// ============================================================================
// Organization Search Input
// ============================================================================

export const OrganizationSearchInputSchema = z.object({
  q: z.string().nullable().optional(),
  mode: SearchModeEnum.default("HYBRID"),
  filter: OrganizationFilterInputSchema.nullable().optional(),
  sort: OrganizationSortInputSchema.nullable().optional(),
  page: PageInputSchema.default({ first: 20 }),
  explain: z.boolean().default(false),
});

export type OrganizationSearchInput = z.infer<
  typeof OrganizationSearchInputSchema
>;

