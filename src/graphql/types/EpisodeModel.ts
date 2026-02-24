import { z } from "zod";
import { Neo4jDateTimeString } from "../utils/dateTimeUtils.js";
import { TemporalValiditySchema } from "./TemporalValidityModel.js";
import { TranscriptRoleEnum } from "../enums/index.js";
import { EpisodeSegmentSchema } from "./EpisodeSegmentModel.js";
import { ChannelSchema } from "./ChannelModel.js";
import { SeriesSchema } from "./SeriesModel.js";
import { PlatformSchema } from "./PlatformModel.js";
import { DocumentSchema } from "./DocumentModel.js";

// ============================================================================
// Edge: Episode -[:HAS_SEGMENT]-> EpisodeSegment
// ============================================================================

export const EpisodeHasSegmentEdgeSchema: z.ZodTypeAny =
  TemporalValiditySchema.extend({
    segment: z.lazy(() => EpisodeSegmentSchema),
    orderIndex: z.number().int().nullable(),
  });

export type EpisodeHasSegmentEdge = z.infer<typeof EpisodeHasSegmentEdgeSchema>;

// ============================================================================
// Edge: Episode -[:IN_CHANNEL]-> Channel
// ============================================================================

export const EpisodeInChannelEdgeSchema: z.ZodTypeAny =
  TemporalValiditySchema.extend({
    channel: z.lazy(() => ChannelSchema),
  });

export type EpisodeInChannelEdge = z.infer<typeof EpisodeInChannelEdgeSchema>;

// ============================================================================
// Edge: Episode -[:IN_SERIES]-> Series
// ============================================================================

export const EpisodeInSeriesEdgeSchema: z.ZodTypeAny =
  TemporalValiditySchema.extend({
    series: z.lazy(() => SeriesSchema),
    orderIndex: z.number().int().nullable(),
  });

export type EpisodeInSeriesEdge = z.infer<typeof EpisodeInSeriesEdgeSchema>;

// ============================================================================
// Edge: Episode -[:ON_PLATFORM]-> Platform
// ============================================================================

export const EpisodeOnPlatformEdgeSchema: z.ZodTypeAny =
  TemporalValiditySchema.extend({
    platform: z.lazy(() => PlatformSchema),
  });

export type EpisodeOnPlatformEdge = z.infer<typeof EpisodeOnPlatformEdgeSchema>;

// ============================================================================
// Edge: Episode -[:HAS_TRANSCRIPT]-> Document
// ============================================================================

export const EpisodeHasTranscriptEdgeSchema = TemporalValiditySchema.extend({
  document: DocumentSchema,
  role: TranscriptRoleEnum.nullable(),
  rank: z.number().int().nullable(),
  updatedAt: Neo4jDateTimeString.nullable(),
});

export type EpisodeHasTranscriptEdge = z.infer<
  typeof EpisodeHasTranscriptEdgeSchema
>;

// ============================================================================
// Episode Schema (single published media item)
// ============================================================================

export const EpisodeSchema: z.ZodTypeAny = z.object({
  episodeId: z.string(),
  canonicalName: z.string(),
  description: z.string().nullable(),
  publishedAt: Neo4jDateTimeString.nullable(),
  durationSec: z.number().int().nullable(),
  language: z.string().nullable(),

  // Content & retrieval
  s3TranscriptUrl: z.string().nullable(),
  transcriptUrl: z.string().nullable(),
  webPageUrl: z.string().nullable(),
  webPageSummary: z.string().nullable(),
  searchText: z.string().nullable(),
  embedding: z.string().nullable(),

  // Platform / social URLs
  youtubeUrl: z.string().nullable(),
  youtubeWatchUrl: z.string().nullable(),
  youtubeEmbedUrl: z.string().nullable(),
  socialUrlsJson: z.string().nullable(),
  timestampsJson: z.string().nullable(),

  // Temporal validity
  validAt: Neo4jDateTimeString.nullable(),
  invalidAt: Neo4jDateTimeString.nullable(),
  expiredAt: Neo4jDateTimeString.nullable(),
  createdAt: Neo4jDateTimeString.nullable(),
  updatedAt: Neo4jDateTimeString.nullable(),

  // Relationships
  hasSegment: z.array(EpisodeHasSegmentEdgeSchema).nullable(),
  inChannel: z.array(EpisodeInChannelEdgeSchema).nullable(),
  inSeries: z.array(EpisodeInSeriesEdgeSchema).nullable(),
  onPlatform: z.array(EpisodeOnPlatformEdgeSchema).nullable(),
  hasTranscript: z.array(EpisodeHasTranscriptEdgeSchema).nullable(),
});

export type Episode = z.infer<typeof EpisodeSchema>;
