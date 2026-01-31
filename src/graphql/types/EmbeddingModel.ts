import { z } from "zod";
import {
  EmbeddingTargetTypeEnum,
  EmbeddingJobStatusEnum,
} from "../enums/index.js";
import { Neo4jDateTimeString } from "../utils/dateTimeUtils.js";

// ============================================================================
// Upsert Embedding Result
// ============================================================================

export const UpsertEmbeddingResultSchema = z.object({
  targetType: EmbeddingTargetTypeEnum,
  targetId: z.string(),
  status: EmbeddingJobStatusEnum,
  message: z.string().nullable().optional(),
  jobId: z.string().nullable().optional(),
});

export type UpsertEmbeddingResult = z.infer<
  typeof UpsertEmbeddingResultSchema
>;

// ============================================================================
// Embedding Job Event
// ============================================================================

export const EmbeddingJobEventSchema = z.object({
  targetType: EmbeddingTargetTypeEnum,
  targetId: z.string(),
  status: EmbeddingJobStatusEnum,
  jobId: z.string().nullable().optional(),
  requestId: z.string().nullable().optional(),
  message: z.string().nullable().optional(),
  error: z.string().nullable().optional(),
  updatedAt: Neo4jDateTimeString,
});

export type EmbeddingJobEvent = z.infer<typeof EmbeddingJobEventSchema>;

