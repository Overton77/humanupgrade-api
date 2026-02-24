import { z } from "zod";
import { Neo4jDateTimeString } from "../utils/dateTimeUtils.js";
import { TemporalValiditySchema } from "./TemporalValidityModel.js";
import { EpisodeSchema } from "./EpisodeModel.js";

// ============================================================================
// Edge: EpisodeSegment -[:IN_EPISODE]-> Episode
// ============================================================================

export const EpisodeSegmentInEpisodeEdgeSchema: z.ZodTypeAny =
  TemporalValiditySchema.extend({
    episode: z.lazy(() => EpisodeSchema),
  });

export type EpisodeSegmentInEpisodeEdge = z.infer<
  typeof EpisodeSegmentInEpisodeEdgeSchema
>;

// ============================================================================
// EpisodeSegment Schema (timestamp-anchored segment within an episode)
// ============================================================================

export const EpisodeSegmentSchema: z.ZodTypeAny = z.object({
  episodeSegmentId: z.string(),
  canonicalName: z.string(),
  description: z.string().nullable(),
  orderIndex: z.number().int().nullable(),
  startTimeSec: z.number().int().nullable(),
  endTimeSec: z.number().int().nullable(),
  timeRangeJson: z.string().nullable(),

  // Temporal validity
  validAt: Neo4jDateTimeString.nullable(),
  invalidAt: Neo4jDateTimeString.nullable(),
  expiredAt: Neo4jDateTimeString.nullable(),
  createdAt: Neo4jDateTimeString.nullable(),
  updatedAt: Neo4jDateTimeString.nullable(),

  // Relationships
  inEpisode: z.array(EpisodeSegmentInEpisodeEdgeSchema).nullable(),
});

export type EpisodeSegment = z.infer<typeof EpisodeSegmentSchema>;
