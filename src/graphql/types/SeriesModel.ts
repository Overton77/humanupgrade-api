import { z } from "zod";
import { MediaSeriesTypeEnum } from "../enums/index.js";
import { Neo4jDateTimeString } from "../utils/dateTimeUtils.js";
import { TemporalValiditySchema } from "./TemporalValidityModel.js";
import { ChannelSchema } from "./ChannelModel.js";
import { EpisodeSchema } from "./EpisodeModel.js";

// ============================================================================
// Edge: Series -[:IN_CHANNEL]-> Channel
// ============================================================================

export const SeriesInChannelEdgeSchema: z.ZodTypeAny =
  TemporalValiditySchema.extend({
    channel: z.lazy(() => ChannelSchema),
  });

export type SeriesInChannelEdge = z.infer<typeof SeriesInChannelEdgeSchema>;

// ============================================================================
// Edge: Series -[:INCLUDES_EPISODE]-> Episode
// ============================================================================

export const SeriesIncludesEpisodeEdgeSchema: z.ZodTypeAny =
  TemporalValiditySchema.extend({
    episode: z.lazy(() => EpisodeSchema),
    orderIndex: z.number().int().nullable(),
  });

export type SeriesIncludesEpisodeEdge = z.infer<
  typeof SeriesIncludesEpisodeEdgeSchema
>;

// ============================================================================
// Series Schema (show / playlist / feed grouping under a channel)
// ============================================================================

export const SeriesSchema: z.ZodTypeAny = z.object({
  seriesId: z.string(),
  canonicalName: z.string(),
  aliases: z.array(z.string()).nullable(),
  description: z.string().nullable(),
  seriesType: MediaSeriesTypeEnum,
  webPageUrl: z.string().nullable(),
  imageUrl: z.string().nullable(),

  // Temporal validity
  validAt: Neo4jDateTimeString.nullable(),
  invalidAt: Neo4jDateTimeString.nullable(),
  expiredAt: Neo4jDateTimeString.nullable(),
  createdAt: Neo4jDateTimeString.nullable(),
  updatedAt: Neo4jDateTimeString.nullable(),

  // Relationships
  inChannel: z.array(SeriesInChannelEdgeSchema).nullable(),
  includesEpisode: z.array(SeriesIncludesEpisodeEdgeSchema).nullable(),
});

export type Series = z.infer<typeof SeriesSchema>;
