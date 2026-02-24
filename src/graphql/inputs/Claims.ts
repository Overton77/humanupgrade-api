import { z } from "zod";
import {
  ClaimOccurrenceSourceTypeEnum,
  ClaimOccurrenceExtractionMethodEnum,
} from "../enums/index.js";
import { Neo4jDateTimeString } from "../utils/dateTimeUtils.js";
import { TemporalValidityInputSchema } from "./TemporalValidityInputs.js";
import { PersonRelateUpsertInputSchema } from "./PersonInputs.js";
import {
  EpisodeRelateUpsertInputSchema,
  EpisodeSegmentRelateUpsertInputSchema,
} from "./MediaInputs.js";

// ============================================================================
// ClaimOccurrence Input Schema (node data)
// ============================================================================

export const ClaimOccurrenceInputSchema = z.object({
  claimOccurrenceId: z.string().optional(),
  canonicalText: z.string(),
  normalizedText: z.string().nullable().optional(),
  occurrenceKey: z.string().nullable().optional(),
  confidence: z.number().nullable().optional(),
  startTimeSec: z.number().int().nullable().optional(),
  endTimeSec: z.number().int().nullable().optional(),
  startChar: z.number().int().nullable().optional(),
  endChar: z.number().int().nullable().optional(),
  language: z.string().nullable().optional(),
  sourceType: ClaimOccurrenceSourceTypeEnum.nullable().optional(),
  extractionMethod: ClaimOccurrenceExtractionMethodEnum.nullable().optional(),
  searchText: z.string().nullable().optional(),
  embedding: z.string().nullable().optional(),
  validAt: Neo4jDateTimeString.optional(),
  invalidAt: Neo4jDateTimeString.optional(),
  expiredAt: Neo4jDateTimeString.optional(),
  createdAt: Neo4jDateTimeString.optional(),
  updatedAt: Neo4jDateTimeString.optional(),
});

export type ClaimOccurrenceInput = z.infer<typeof ClaimOccurrenceInputSchema>;

// ============================================================================
// ClaimOccurrence Relate Upsert Input (connect | connectByKey | upsert)
// ============================================================================

export const ClaimOccurrenceRelateUpsertInputSchema = z
  .object({
    connect: z.object({ claimOccurrenceId: z.string() }).optional(),
    connectByKey: z.object({ occurrenceKey: z.string() }).optional(),
    upsert: ClaimOccurrenceInputSchema.optional(),
  })
  .refine(
    (data) =>
      (data.connect ? 1 : 0) +
        (data.connectByKey ? 1 : 0) +
        (data.upsert ? 1 : 0) ===
      1,
    {
      message:
        "ClaimOccurrenceRelateUpsertInput: exactly one of 'connect', 'connectByKey', or 'upsert' must be provided",
    },
  );

export type ClaimOccurrenceRelateUpsertInput = z.infer<
  typeof ClaimOccurrenceRelateUpsertInputSchema
>;

// ============================================================================
// Edge Input Schemas
// ============================================================================

export const OccursInEdgeInputSchema = TemporalValidityInputSchema.extend({
  episode: EpisodeRelateUpsertInputSchema,
});

export type OccursInEdgeInput = z.infer<typeof OccursInEdgeInputSchema>;

export const OccursInSegmentEdgeInputSchema =
  TemporalValidityInputSchema.extend({
    segment: EpisodeSegmentRelateUpsertInputSchema,
    startTimeSec: z.number().int().nullable().optional(),
    endTimeSec: z.number().int().nullable().optional(),
    confidence: z.number().nullable().optional(),
  });

export type OccursInSegmentEdgeInput = z.infer<
  typeof OccursInSegmentEdgeInputSchema
>;

export const UtteredByEdgeInputSchema = TemporalValidityInputSchema.extend({
  person: PersonRelateUpsertInputSchema,
  confidence: z.number().nullable().optional(),
});

export type UtteredByEdgeInput = z.infer<typeof UtteredByEdgeInputSchema>;

// ============================================================================
// ClaimOccurrence With Relationships (for nested use in Episode/EpisodeSegment)
// ============================================================================

export const ClaimOccurrenceWithRelationsInputSchema =
  ClaimOccurrenceInputSchema.extend({
    occursIn: z.array(OccursInEdgeInputSchema).optional(),
    occursInSegment: z.array(OccursInSegmentEdgeInputSchema).optional(),
    utteredBy: UtteredByEdgeInputSchema.optional(),
  });

export type ClaimOccurrenceWithRelationsInput = z.infer<
  typeof ClaimOccurrenceWithRelationsInputSchema
>;

// ============================================================================
// Upsert ClaimOccurrences Input (batch)
// ============================================================================

export const UpsertClaimOccurrencesInputSchema = z.object({
  occurrences: z.array(
    ClaimOccurrenceInputSchema.extend({
      occursIn: z.array(OccursInEdgeInputSchema).optional(),
      occursInSegment: z.array(OccursInSegmentEdgeInputSchema).optional(),
      utteredBy: UtteredByEdgeInputSchema.optional(),
    }),
  ),
});

export type UpsertClaimOccurrencesInput = z.infer<
  typeof UpsertClaimOccurrencesInputSchema
>;
