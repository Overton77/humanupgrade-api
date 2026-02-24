import { z } from "zod";
import { Neo4jDateTimeString } from "../utils/dateTimeUtils.js";
import { TemporalValiditySchema } from "./TemporalValidityModel.js";
import { PlatformSchema } from "./PlatformModel.js";
import { SeriesSchema } from "./SeriesModel.js";
import { EpisodeSchema } from "./EpisodeModel.js";

// ============================================================================
// Edge: Channel -[:ON_PLATFORM]-> Platform
// ============================================================================

export const ChannelOnPlatformEdgeSchema: z.ZodTypeAny =
  TemporalValiditySchema.extend({
    platform: z.lazy(() => PlatformSchema),
  });

export type ChannelOnPlatformEdge = z.infer<typeof ChannelOnPlatformEdgeSchema>;

// ============================================================================
// Edge: Channel -[:HAS_SERIES]-> Series
// ============================================================================

export const ChannelHasSeriesEdgeSchema: z.ZodTypeAny =
  TemporalValiditySchema.extend({
    series: z.lazy(() => SeriesSchema),
    orderIndex: z.number().int().nullable(),
  });

export type ChannelHasSeriesEdge = z.infer<typeof ChannelHasSeriesEdgeSchema>;

// ============================================================================
// Edge: Channel -[:HAS_EPISODE]-> Episode
// ============================================================================

export const ChannelHasEpisodeEdgeSchema: z.ZodTypeAny =
  TemporalValiditySchema.extend({
    episode: z.lazy(() => EpisodeSchema),
    publishedAt: Neo4jDateTimeString.nullable(),
  });

export type ChannelHasEpisodeEdge = z.infer<typeof ChannelHasEpisodeEdgeSchema>;

// ============================================================================
// Channel Schema (publisher identity on a platform)
// ============================================================================

export const ChannelSchema: z.ZodTypeAny = z.object({
  channelId: z.string(),
  canonicalName: z.string(),
  aliases: z.array(z.string()).nullable(),
  description: z.string().nullable(),
  channelHandle: z.string().nullable(),
  platformChannelId: z.string().nullable(),
  webPageUrl: z.string().nullable(),
  rssUrl: z.string().nullable(),
  imageUrl: z.string().nullable(),

  // Temporal validity
  validAt: Neo4jDateTimeString.nullable(),
  invalidAt: Neo4jDateTimeString.nullable(),
  expiredAt: Neo4jDateTimeString.nullable(),
  createdAt: Neo4jDateTimeString.nullable(),
  updatedAt: Neo4jDateTimeString.nullable(),

  // Relationships
  onPlatform: z.array(ChannelOnPlatformEdgeSchema).nullable(),
  hasSeries: z.array(ChannelHasSeriesEdgeSchema).nullable(),
  hasEpisode: z.array(ChannelHasEpisodeEdgeSchema).nullable(),
});

export type Channel = z.infer<typeof ChannelSchema>;
