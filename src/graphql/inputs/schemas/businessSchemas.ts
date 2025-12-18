import { z } from "zod";
import { MediaLinkSchema } from "./mediaLinkSchema.js";
import {
  ObjectIdSchema,
  ObjectIdArraySchema,
  OptionalUrlSchema,
} from "../../../lib/validation.js";

/**
 * Base scalar fields for Business
 */
export const BusinessScalarFieldsSchema = z.object({
  name: z.string().min(1, "Business name is required").max(200),
  description: z.string().max(5000).optional(),
  website: OptionalUrlSchema,
  biography: z.string().max(10000).optional(),
  mediaLinks: z.array(MediaLinkSchema).optional(),
});

/**
 * Update fields (all optional except id)
 */
export const BusinessScalarUpdateFieldsSchema =
  BusinessScalarFieldsSchema.partial().extend({ id: ObjectIdSchema });

/**
 * Executive relation input
 */
export const BusinessExecutiveRelationInputSchema = z.object({
  personId: ObjectIdSchema,
  title: z.string().max(100).optional(),
  role: z.string().max(100).optional(),
});

/**
 * Create with optional IDs
 */
export const BusinessCreateWithOptionalIdsInputSchema =
  BusinessScalarFieldsSchema.extend({
    ownerIds: ObjectIdArraySchema.optional(),
    productIds: ObjectIdArraySchema.optional(),
    executives: z.array(BusinessExecutiveRelationInputSchema).optional(),
    sponsorEpisodeIds: ObjectIdArraySchema.optional(),
  });

/**
 * Update with optional IDs
 */
export const BusinessUpdateWithOptionalIdsInputSchema =
  BusinessScalarUpdateFieldsSchema.extend({
    ownerIds: ObjectIdArraySchema.optional(),
    productIds: ObjectIdArraySchema.optional(),
    sponsorEpisodeIds: ObjectIdArraySchema.optional(),
  });

/**
 * Nested owner input
 */
export const BusinessOwnerNestedInputSchema = z
  .object({
    id: ObjectIdSchema.optional(),
    name: z.string().min(1).max(200).optional(),
    role: z.string().max(100).optional(),
    bio: z.string().max(5000).optional(),
    mediaLinks: z.array(MediaLinkSchema).optional(),
  })
  .refine((data) => data.id || data.name, {
    message: "Either 'id' or 'name' must be provided",
    path: ["name"],
  });

/**
 * Nested product input
 */
export const BusinessProductNestedInputSchema = z
  .object({
    id: ObjectIdSchema.optional(),
    name: z.string().min(1).max(200).optional(),
    description: z.string().max(5000).optional(),
    ingredients: z.array(z.string()).optional(),
    mediaLinks: z.array(MediaLinkSchema).optional(),
    sourceUrl: OptionalUrlSchema,
  })
  .refine((data) => data.id || data.name, {
    message: "Either 'id' or 'name' must be provided",
    path: ["name"],
  });

/**
 * Sponsor link object schema (from Episode model)
 */
export const SponsorLinkObjectSchema = z.object({
  text: z.string().optional(),
  links: z.array(z.string()).optional(),
  hasCodeDave: z.boolean().optional(),
  code: z.string().optional(),
  brand: z.string().optional(),
  discountPercent: z.number().optional(),
});

/**
 * Web page timeline schema (from Episode model)
 */
export const WebPageTimelineSchema = z.object({
  from: z.string(),
  to: z.string(),
  title: z.string().optional(),
  description: z.string().optional(),
});

/**
 * Nested episode input
 */
export const BusinessEpisodeNestedInputSchema = z
  .object({
    id: ObjectIdSchema.optional(),
    channelName: z.string().min(1),
    episodeNumber: z.number().int().positive().optional(),
    episodeTitle: z.string().min(1).optional(),
    episodePageUrl: OptionalUrlSchema,
    episodeTranscriptUrl: OptionalUrlSchema,
    publishedAt: z.coerce.date().optional(),
    summaryShort: z.string().max(1000).optional(),
    webPageSummary: z.string().max(5000).optional(),
    summaryDetailed: z.string().max(50000).optional(),
    youtubeVideoId: z.string().max(50).optional(),
    youtubeWatchUrl: OptionalUrlSchema,
    youtubeEmbedUrl: OptionalUrlSchema,
    takeaways: z.array(z.string()).optional(),
    s3TranscriptKey: z.string().optional(),
    s3TranscriptUrl: OptionalUrlSchema,
    mediaLinks: z.array(MediaLinkSchema).optional(),
    sponsorLinkObjects: z.array(SponsorLinkObjectSchema).optional(),
    webPageTimelines: z.array(WebPageTimelineSchema).optional(),
  })
  .refine(
    (data) =>
      data.id ||
      (data.channelName &&
        data.episodeNumber !== undefined &&
        data.episodeTitle),
    {
      message:
        "Either 'id' or 'channelName', 'episodeNumber', and 'episodeTitle' must be provided",
      path: ["episodeTitle"],
    }
  );

export const BusinessExecutiveNestedInputSchema = z.object({
  name: z.string().min(1).max(200),
  title: z.string().min(1).max(100),
  role: z.string().min(1).max(100),
  mediaLinks: z.array(MediaLinkSchema).optional(),
});

/**
 * Rich relation update
 */

export const BusinessCreateWithRelationsInputSchema =
  BusinessScalarFieldsSchema.extend({
    // Optional connects by id
    ownerIds: ObjectIdArraySchema.optional(),
    productIds: ObjectIdArraySchema.optional(),
    sponsorEpisodeIds: ObjectIdArraySchema.optional(),
    executivesNested: z.array(BusinessExecutiveNestedInputSchema).optional(),

    // Optional nested upserts/creates
    ownersNested: z.array(BusinessOwnerNestedInputSchema).optional(),
    productsNested: z.array(BusinessProductNestedInputSchema).optional(),
    sponsorEpisodesNested: z.array(BusinessEpisodeNestedInputSchema).optional(),

    // Executives are canonical on Business
    executives: z.array(BusinessExecutiveRelationInputSchema).optional(),
  });

export const BusinessUpdateWithRelationFieldsInputSchema = z.object({
  id: ObjectIdSchema,
  ownerIds: ObjectIdArraySchema.optional(),
  ownersNested: z.array(BusinessOwnerNestedInputSchema).optional(),
  executivesNested: z.array(BusinessExecutiveNestedInputSchema).optional(),
  productIds: ObjectIdArraySchema.optional(),
  productsNested: z.array(BusinessProductNestedInputSchema).optional(),
  executives: z.array(BusinessExecutiveRelationInputSchema).optional(),
  sponsorEpisodeIds: ObjectIdArraySchema.optional(),
  sponsorEpisodesNested: z.array(BusinessEpisodeNestedInputSchema).optional(),
});
