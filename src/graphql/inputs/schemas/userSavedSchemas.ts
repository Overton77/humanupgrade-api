import { z } from "zod";

export const SavedEntityTypeSchema = z.enum([
  "product",
  "compound",
  "person",
  "business",
  "protocol_system",
  "protocol_user",
  "episode",
  "caseStudy",
  "article",
]);

export const SaveSourceSchema = z.enum([
  "dashboard",
  "episode",
  "assistant",
  "search",
  "protocol_builder",
  "profile",
  "other",
]);

export const SaveEntityInputSchema = z.object({
  targetType: SavedEntityTypeSchema,
  targetId: z.string(),

  note: z.string().optional(),
  tags: z.array(z.string()).optional(),
  pinned: z.boolean().optional(),
  source: SaveSourceSchema.optional(),
});

export const UnsaveEntityInputSchema = z.object({
  targetType: SavedEntityTypeSchema,
  targetId: z.string(),
});

export const SavedEntitiesFilterInputSchema = z.object({
  targetType: SavedEntityTypeSchema.optional(),
  search: z.string().optional(),
  tags: z.array(z.string()).optional(),
  pinned: z.boolean().optional(),
});

export const CursorPageInputSchema = z.object({
  first: z.number().int().min(1).max(100).optional(),
  after: z.string().optional(),
});
