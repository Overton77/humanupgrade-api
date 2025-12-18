import { z } from "zod";
import { MediaLinkSchema } from "./mediaLinkSchema.js";
import {
  ObjectIdSchema,
  ObjectIdArraySchema,
  OptionalUrlSchema,
} from "../../../lib/validation.js";
import { EpisodeCreateWithOptionalIdsInputSchema } from "./episodeSchemas.js";

/**
 * Person scalar fields
 */
export const PersonScalarFieldsSchema = z.object({
  name: z.string().min(1, "Person name is required").max(200),
  role: z.string().max(100).optional(),
  bio: z.string().max(5000).optional(),
  mediaLinks: z.array(MediaLinkSchema).optional(),
});

/**
 * Person scalar update fields
 */
export const PersonScalarUpdateFieldsSchema =
  PersonScalarFieldsSchema.partial().extend({
    id: ObjectIdSchema,
  });

/**
 * Person create with optional IDs
 */
export const PersonCreateWithOptionalIdsInputSchema =
  PersonScalarFieldsSchema.extend({
    businessIds: ObjectIdArraySchema.optional(),
    episodeIds: ObjectIdArraySchema.optional(),
  });

/**
 * Person update with optional IDs
 */
export const PersonUpdateWithOptionalIdsInputSchema =
  PersonScalarUpdateFieldsSchema.extend({
    businessIds: ObjectIdArraySchema.optional(),
    episodeIds: ObjectIdArraySchema.optional(),
  });

/**
 * Person business nested input
 */
export const PersonBusinessNestedInputSchema = z
  .object({
    id: ObjectIdSchema.optional(),
    name: z.string().min(1).max(200).optional(),
    description: z.string().max(5000).optional(),
    website: OptionalUrlSchema,
    mediaLinks: z.array(MediaLinkSchema).optional(),
  })
  .refine((data) => data.id || data.name, {
    message: "Either 'id' or 'name' must be provided",
    path: ["name"],
  });

/**
 * Person episode nested input (simplified - uses episode create schema structure)
 */
export const PersonEpisodeNestedInputSchema =
  EpisodeCreateWithOptionalIdsInputSchema.pick({
    channelName: true,
    episodeNumber: true,
    episodePageUrl: true,
    episodeTranscriptUrl: true,
    episodeTitle: true,
    publishedAt: true,
    summaryShort: true,
    webPageSummary: true,
    summaryDetailed: true,
    youtubeVideoId: true,
    youtubeWatchUrl: true,
    youtubeEmbedUrl: true,
    takeaways: true,
    s3TranscriptKey: true,
    s3TranscriptUrl: true,
    mediaLinks: true,
  })
    .extend({
      id: ObjectIdSchema.optional(),
    })
    .partial();

/**
 * Person update relation fields input
 */
export const PersonUpdateRelationFieldsInputSchema = z.object({
  id: ObjectIdSchema,
  businessIds: ObjectIdArraySchema.optional(),
  businessesNested: z.array(PersonBusinessNestedInputSchema).optional(),
  episodeIds: ObjectIdArraySchema.optional(),
  episodesNested: z.array(PersonEpisodeNestedInputSchema).optional(),
});
