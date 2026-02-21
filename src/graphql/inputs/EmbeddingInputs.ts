import { z } from "zod";
import { EmbeddingTargetTypeEnum } from "../enums/index.js";

// ============================================================================
// Upsert Embedding Input
// ============================================================================

export const UpsertEmbeddingInputSchema = z.object({
  targetType: EmbeddingTargetTypeEnum,
  targetId: z.string(),
  force: z.boolean().default(false),
  requestId: z.string().nullable().optional(),
});

export type UpsertEmbeddingInput = z.infer<
  typeof UpsertEmbeddingInputSchema
>;

