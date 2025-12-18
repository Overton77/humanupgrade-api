import { z } from "zod";
import {
  SponsorLinkObjectSchema,
  WebPageTimelineSchema,
} from "./businessSchemas.js";
import { MediaLinkSchema } from "./mediaLinkSchema.js";
import {
  ObjectIdSchema,
  ObjectIdArraySchema,
  OptionalUrlSchema,
} from "../../../lib/validation.js";

/**
 * Episode create input
 */
export const EpisodeCreateWithOptionalIdsInputSchema = z.object({
  channelName: z.string().min(1, "Channel name is required"),
  episodeNumber: z.number().int().positive().optional(),
  episodeTitle: z.string().optional(),
  episodePageUrl: OptionalUrlSchema,
  episodeTranscriptUrl: OptionalUrlSchema,
  publishedAt: z.coerce.date().optional(),
  summaryShort: z.string().max(1000).optional(),
  webPageSummary: z.string().max(5000).optional(),
  summaryDetailed: z.string().max(50000).optional(),
  publishedSummary: z.string().max(10000).optional(),
  youtubeVideoId: z.string().max(50).optional(),
  youtubeWatchUrl: OptionalUrlSchema,
  youtubeEmbedUrl: OptionalUrlSchema,
  takeaways: z.array(z.string()).optional(),
  s3TranscriptKey: z.string().optional(),
  s3TranscriptUrl: OptionalUrlSchema,
  mediaLinks: z.array(MediaLinkSchema).optional(),
  sponsorLinkObjects: z.array(SponsorLinkObjectSchema).optional(),
  webPageTimelines: z.array(WebPageTimelineSchema).optional(),
  businessLinks: z.array(z.string()).optional(),
  guestIds: ObjectIdArraySchema.optional(),
  sponsorBusinessIds: ObjectIdArraySchema.optional(),
  protocolIds: ObjectIdArraySchema.optional(),
});

/**
 * Episode update input
 */
export const EpisodeUpdateWithOptionalIdsInputSchema =
  EpisodeCreateWithOptionalIdsInputSchema.partial().extend({
    id: ObjectIdSchema,
  });

/**
 * Episode guest nested input
 */
export const EpisodeGuestNestedInputSchema = z
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
 * Episode sponsor business nested input
 */
export const EpisodeSponsorBusinessNestedInputSchema = z
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
 * Episode update relation fields input
 */
export const EpisodeUpdateRelationFieldsInputSchema = z.object({
  id: ObjectIdSchema,
  guestIds: ObjectIdArraySchema.optional(),
  guestsNested: z.array(EpisodeGuestNestedInputSchema).optional(),
  sponsorBusinessIds: ObjectIdArraySchema.optional(),
  sponsorBusinessesNested: z
    .array(EpisodeSponsorBusinessNestedInputSchema)
    .optional(),
  protocolIds: ObjectIdArraySchema.optional(),
});
