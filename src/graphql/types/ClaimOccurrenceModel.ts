import { z } from "zod";
import {
  ClaimOccurrenceSourceTypeEnum,
  ClaimOccurrenceExtractionMethodEnum,
} from "../enums/index.js";
import { Neo4jDateTimeString } from "../utils/dateTimeUtils.js";
import { TemporalValiditySchema } from "./TemporalValidityModel.js";
import { EpisodeSchema } from "./EpisodeModel.js";
import { EpisodeSegmentSchema } from "./EpisodeSegmentModel.js";
import { PersonSchema } from "./PersonModel.js";

// ============================================================================
// Edge: ClaimOccurrence -[:OCCURS_IN]-> Episode
// ============================================================================

export const ClaimOccurrenceOccursInEdgeSchema = TemporalValiditySchema.extend({
  episode: z.lazy(() => EpisodeSchema),
});

export type ClaimOccurrenceOccursInEdge = z.infer<
  typeof ClaimOccurrenceOccursInEdgeSchema
>;

// ============================================================================
// Edge: ClaimOccurrence -[:OCCURS_IN_SEGMENT]-> EpisodeSegment
// ============================================================================

export const ClaimOccurrenceOccursInSegmentEdgeSchema =
  TemporalValiditySchema.extend({
    segment: z.lazy(() => EpisodeSegmentSchema),
    startTimeSec: z.number().int().nullable(),
    endTimeSec: z.number().int().nullable(),
    confidence: z.number().nullable(),
  });

export type ClaimOccurrenceOccursInSegmentEdge = z.infer<
  typeof ClaimOccurrenceOccursInSegmentEdgeSchema
>;

// ============================================================================
// Edge: ClaimOccurrence -[:UTTERED_BY]-> Person
// ============================================================================

export const ClaimOccurrenceUtteredByEdgeSchema = TemporalValiditySchema.extend({
  person: PersonSchema,
  confidence: z.number().nullable(),
});

export type ClaimOccurrenceUtteredByEdge = z.infer<
  typeof ClaimOccurrenceUtteredByEdgeSchema
>;

// ============================================================================
// ClaimOccurrence Schema (instance of a claim in episode/segment)
// ============================================================================

export const ClaimOccurrenceSchema = z.object({
  claimOccurrenceId: z.string(),
  canonicalText: z.string(),
  normalizedText: z.string().nullable(),
  occurrenceKey: z.string().nullable(),
  confidence: z.number().nullable(),

  // Anchoring
  startTimeSec: z.number().int().nullable(),
  endTimeSec: z.number().int().nullable(),
  startChar: z.number().int().nullable(),
  endChar: z.number().int().nullable(),

  // Metadata
  language: z.string().nullable(),
  sourceType: ClaimOccurrenceSourceTypeEnum.nullable(),
  extractionMethod: ClaimOccurrenceExtractionMethodEnum.nullable(),
  searchText: z.string().nullable(),
  embedding: z.string().nullable(),

  // Temporal validity
  validAt: Neo4jDateTimeString.nullable(),
  invalidAt: Neo4jDateTimeString.nullable(),
  expiredAt: Neo4jDateTimeString.nullable(),
  createdAt: Neo4jDateTimeString.nullable(),
  updatedAt: Neo4jDateTimeString.nullable(),

  // Relationships
  occursIn: z.array(ClaimOccurrenceOccursInEdgeSchema).nullable(),
  occursInSegment: z.array(ClaimOccurrenceOccursInSegmentEdgeSchema).nullable(),
  utteredBy: z.array(ClaimOccurrenceUtteredByEdgeSchema).nullable(),
});

export type ClaimOccurrence = z.infer<typeof ClaimOccurrenceSchema>;
