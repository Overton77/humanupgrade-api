import { z } from "zod";
import { MediaPlatformTypeEnum, MediaSeriesTypeEnum } from "../enums/index.js";
import { Neo4jDateTimeString } from "../utils/dateTimeUtils.js";
import { TemporalValidityInputSchema } from "./TemporalValidityInputs.js";

// ============================================================================
// Platform
// ============================================================================

export const PlatformInputSchema = z.object({
  platformId: z.string().optional(),
  canonicalName: z.string(),
  aliases: z.array(z.string()).nullable().optional(),
  platformType: MediaPlatformTypeEnum,
  description: z.string().nullable().optional(),
  websiteUrl: z.string().nullable().optional(),
  validAt: Neo4jDateTimeString.optional(),
  invalidAt: Neo4jDateTimeString.optional(),
  expiredAt: Neo4jDateTimeString.optional(),
});

export type PlatformInput = z.infer<typeof PlatformInputSchema>;

export const PlatformRelateUpsertInputSchema = z
  .object({
    connect: z.object({ platformId: z.string() }).optional(),
    connectByKey: z.object({ canonicalName: z.string() }).optional(),
    upsert: PlatformInputSchema.optional(),
  })
  .refine(
    (data) =>
      (data.connect ? 1 : 0) +
        (data.connectByKey ? 1 : 0) +
        (data.upsert ? 1 : 0) ===
      1,
    {
      message:
        "PlatformRelateUpsertInput: exactly one of 'connect', 'connectByKey', or 'upsert' must be provided",
    }
  );

export type PlatformRelateUpsertInput = z.infer<
  typeof PlatformRelateUpsertInputSchema
>;

// ============================================================================
// Series
// ============================================================================

export const SeriesInputSchema = z.object({
  seriesId: z.string().optional(),
  canonicalName: z.string(),
  aliases: z.array(z.string()).nullable().optional(),
  description: z.string().nullable().optional(),
  seriesType: MediaSeriesTypeEnum,
  webPageUrl: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  validAt: Neo4jDateTimeString.optional(),
  invalidAt: Neo4jDateTimeString.optional(),
  expiredAt: Neo4jDateTimeString.optional(),
});

export type SeriesInput = z.infer<typeof SeriesInputSchema>;

export const SeriesRelateUpsertInputSchema = z
  .object({
    connect: z.object({ seriesId: z.string() }).optional(),
    connectByKey: z
      .object({ channelId: z.string(), canonicalName: z.string() })
      .optional(),
    upsert: SeriesInputSchema.optional(),
  })
  .refine(
    (data) =>
      (data.connect ? 1 : 0) +
        (data.connectByKey ? 1 : 0) +
        (data.upsert ? 1 : 0) ===
      1,
    {
      message:
        "SeriesRelateUpsertInput: exactly one of 'connect', 'connectByKey', or 'upsert' must be provided",
    }
  );

export type SeriesRelateUpsertInput = z.infer<
  typeof SeriesRelateUpsertInputSchema
>;

// ============================================================================
// EpisodeSegment
// ============================================================================

export const EpisodeSegmentInputSchema = z.object({
  episodeSegmentId: z.string().optional(),
  canonicalName: z.string(),
  description: z.string().nullable().optional(),
  orderIndex: z.number().int().nullable().optional(),
  startTimeSec: z.number().int().nullable().optional(),
  endTimeSec: z.number().int().nullable().optional(),
  timeRangeJson: z.string().nullable().optional(),
  validAt: Neo4jDateTimeString.optional(),
  invalidAt: Neo4jDateTimeString.optional(),
  expiredAt: Neo4jDateTimeString.optional(),
});

export type EpisodeSegmentInput = z.infer<typeof EpisodeSegmentInputSchema>;

// ============================================================================
// EpisodeSegment Relate
// ============================================================================

export const EpisodeSegmentRelateUpsertInputSchema = z
  .object({
    connect: z.object({ episodeSegmentId: z.string() }).optional(),
    connectByKey: z
      .object({ episodeId: z.string(), orderIndex: z.number().int() })
      .optional(),
    upsert: EpisodeSegmentInputSchema.optional(),
  })
  .refine(
    (data) =>
      (data.connect ? 1 : 0) +
        (data.connectByKey ? 1 : 0) +
        (data.upsert ? 1 : 0) ===
      1,
    {
      message:
        "EpisodeSegmentRelateUpsertInput: exactly one of 'connect', 'connectByKey', or 'upsert' must be provided",
    }
  );

export type EpisodeSegmentRelateUpsertInput = z.infer<
  typeof EpisodeSegmentRelateUpsertInputSchema
>;

// ============================================================================
// Edge Input Schemas (define before Channel/Episode - they reference these)
// ============================================================================

const PlatformOnChannelEdgeInputSchema = TemporalValidityInputSchema.extend({
  platform: PlatformRelateUpsertInputSchema,
});

const SeriesOnChannelEdgeInputSchema = TemporalValidityInputSchema.extend({
  series: SeriesRelateUpsertInputSchema,
  orderIndex: z.number().int().nullable().optional(),
});

const EpisodeHasSegmentEdgeInputSchema = TemporalValidityInputSchema.extend({
  segment: EpisodeSegmentRelateUpsertInputSchema,
  orderIndex: z.number().int().nullable().optional(),
});

// EpisodeRelateUpsertInput - forward ref for edges
const EpisodeRelateUpsertInputSchemaDef: z.ZodTypeAny = z.lazy(() =>
  z
    .object({
      connect: z.object({ episodeId: z.string() }).optional(),
      connectByKey: z.object({ webPageUrl: z.string() }).optional(),
      upsert: EpisodeInputSchemaDef.optional(),
    })
    .refine(
      (data) =>
        (data.connect ? 1 : 0) +
          (data.connectByKey ? 1 : 0) +
          (data.upsert ? 1 : 0) ===
        1,
      {
        message:
          "EpisodeRelateUpsertInput: exactly one of 'connect', 'connectByKey', or 'upsert' must be provided",
      }
    )
);

const EpisodeOnChannelEdgeInputSchema = TemporalValidityInputSchema.extend({
  episode: EpisodeRelateUpsertInputSchemaDef,
  publishedAt: Neo4jDateTimeString.optional(),
});

const ChannelRelateUpsertInputSchemaDef: z.ZodTypeAny = z.lazy(() =>
  z
    .object({
      connect: z.object({ channelId: z.string() }).optional(),
      connectByKey: z
        .object({
          platformId: z.string(),
          platformChannelId: z.string().optional(),
          channelHandle: z.string().optional(),
        })
        .optional(),
      upsert: ChannelInputSchemaDef.optional(),
    })
    .refine(
      (data) =>
        (data.connect ? 1 : 0) +
          (data.connectByKey ? 1 : 0) +
          (data.upsert ? 1 : 0) ===
        1,
      {
        message:
          "ChannelRelateUpsertInput: exactly one of 'connect', 'connectByKey', or 'upsert' must be provided",
      }
    )
);

const HostsChannelEdgeInputSchema = TemporalValidityInputSchema.extend({
  channel: ChannelRelateUpsertInputSchemaDef,
});

const ChannelOnEpisodeEdgeInputSchema = TemporalValidityInputSchema.extend({
  channel: ChannelRelateUpsertInputSchemaDef,
});

const SeriesOnEpisodeEdgeInputSchema = TemporalValidityInputSchema.extend({
  series: SeriesRelateUpsertInputSchema,
  orderIndex: z.number().int().nullable().optional(),
});

const PlatformOnEpisodeEdgeInputSchema = TemporalValidityInputSchema.extend({
  platform: PlatformRelateUpsertInputSchema,
});

// ============================================================================
// Episode
// ============================================================================

const EpisodeInputSchemaDef: z.ZodTypeAny = z.lazy(() =>
  z.object({
    episodeId: z.string().optional(),
    canonicalName: z.string(),
    description: z.string().nullable().optional(),
    publishedAt: Neo4jDateTimeString.optional(),
    durationSec: z.number().int().nullable().optional(),
    language: z.string().nullable().optional(),
    s3TranscriptUrl: z.string().nullable().optional(),
    transcriptUrl: z.string().nullable().optional(),
    webPageUrl: z.string().nullable().optional(),
    webPageSummary: z.string().nullable().optional(),
    searchText: z.string().nullable().optional(),
    embedding: z.string().nullable().optional(),
    youtubeUrl: z.string().nullable().optional(),
    youtubeWatchUrl: z.string().nullable().optional(),
    youtubeEmbedUrl: z.string().nullable().optional(),
    socialUrlsJson: z.string().nullable().optional(),
    timestampsJson: z.string().nullable().optional(),
    validAt: Neo4jDateTimeString.optional(),
    invalidAt: Neo4jDateTimeString.optional(),
    expiredAt: Neo4jDateTimeString.optional(),
    inChannel: z.array(ChannelOnEpisodeEdgeInputSchema).optional(),
    inSeries: z.array(SeriesOnEpisodeEdgeInputSchema).optional(),
    onPlatform: z.array(PlatformOnEpisodeEdgeInputSchema).optional(),
    hasSegment: z.array(EpisodeHasSegmentEdgeInputSchema).optional(),
  })
);

export const EpisodeInputSchema = EpisodeInputSchemaDef;
export type EpisodeInput = z.infer<typeof EpisodeInputSchema>;

export const EpisodeRelateUpsertInputSchema = EpisodeRelateUpsertInputSchemaDef;
export type EpisodeRelateUpsertInput = z.infer<
  typeof EpisodeRelateUpsertInputSchema
>;

// ============================================================================
// Channel
// ============================================================================

const ChannelInputSchemaDef: z.ZodTypeAny = z.lazy(() =>
  z.object({
    channelId: z.string().optional(),
    canonicalName: z.string(),
    aliases: z.array(z.string()).nullable().optional(),
    description: z.string().nullable().optional(),
    channelHandle: z.string().nullable().optional(),
    platformChannelId: z.string().nullable().optional(),
    webPageUrl: z.string().nullable().optional(),
    rssUrl: z.string().nullable().optional(),
    imageUrl: z.string().nullable().optional(),
    validAt: Neo4jDateTimeString.optional(),
    invalidAt: Neo4jDateTimeString.optional(),
    expiredAt: Neo4jDateTimeString.optional(),
    onPlatform: z.array(PlatformOnChannelEdgeInputSchema).optional(),
    hasSeries: z.array(SeriesOnChannelEdgeInputSchema).optional(),
    hasEpisode: z.array(EpisodeOnChannelEdgeInputSchema).optional(),
  })
);

export const ChannelInputSchema = ChannelInputSchemaDef;
export type ChannelInput = z.infer<typeof ChannelInputSchema>;

export const ChannelRelateUpsertInputSchema = ChannelRelateUpsertInputSchemaDef;
export type ChannelRelateUpsertInput = z.infer<
  typeof ChannelRelateUpsertInputSchema
>;

// ============================================================================
// Upsert Input Schemas
// ============================================================================

export const UpsertPlatformInputSchema = PlatformInputSchema.extend({
  hostsChannel: z.array(HostsChannelEdgeInputSchema).optional(),
});

export type UpsertPlatformInput = z.infer<typeof UpsertPlatformInputSchema>;

export const UpsertChannelInputSchema = ChannelInputSchema;

export type UpsertChannelInput = z.infer<typeof UpsertChannelInputSchema>;

export const UpsertSeriesInputSchema = z.lazy(() =>
  SeriesInputSchema.extend({
    inChannel: z
      .array(
        TemporalValidityInputSchema.extend({
          channel: ChannelRelateUpsertInputSchema,
        })
      )
      .optional(),
    includesEpisode: z
      .array(
        TemporalValidityInputSchema.extend({
          episode: EpisodeRelateUpsertInputSchema,
          orderIndex: z.number().int().nullable().optional(),
        })
      )
      .optional(),
  })
);

export type UpsertSeriesInput = z.infer<typeof UpsertSeriesInputSchema>;

export const UpsertEpisodeInputSchema = EpisodeInputSchema;

export type UpsertEpisodeInput = z.infer<typeof UpsertEpisodeInputSchema>;

export const UpsertEpisodeSegmentsInputSchema = z.object({
  episode: EpisodeRelateUpsertInputSchema,
  segments: z.array(
    TemporalValidityInputSchema.extend({
      segment: EpisodeSegmentRelateUpsertInputSchema,
      orderIndex: z.number().int().nullable().optional(),
    })
  ),
});

export type UpsertEpisodeSegmentsInput = z.infer<
  typeof UpsertEpisodeSegmentsInputSchema
>;
