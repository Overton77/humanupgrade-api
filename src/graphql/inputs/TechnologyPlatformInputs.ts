import { z } from "zod";
import { PlatformTypeEnum } from "../enums/index.js";
import { Neo4jDateTimeString } from "../utils/dateTimeUtils.js";

// ============================================================================
// TechnologyPlatform Input Schema
// ============================================================================

export const TechnologyPlatformInputSchema = z.object({
  platformId: z.string().optional(),
  canonicalName: z.string(),
  aliases: z.array(z.string()).nullable().optional(),
  platformType: PlatformTypeEnum,
  description: z.string().nullable().optional(),
  validAt: Neo4jDateTimeString.optional(),
  invalidAt: Neo4jDateTimeString.optional(),
  expiredAt: Neo4jDateTimeString.optional(),
  createdAt: Neo4jDateTimeString.optional(),
});

export type TechnologyPlatformInput = z.infer<
  typeof TechnologyPlatformInputSchema
>;

// ============================================================================
// TechnologyPlatform Update Input Schema
// ============================================================================

export const TechnologyPlatformUpdateInputSchema =
  TechnologyPlatformInputSchema.partial().extend({
    platformId: z.string().optional(),
  });

export type TechnologyPlatformUpdateInput = z.infer<
  typeof TechnologyPlatformUpdateInputSchema
>;

// ============================================================================
// TechnologyPlatform Relate Input Schema (Create/Connect)
// ============================================================================

export const TechnologyPlatformRelateInputSchema = z
  .object({
    create: TechnologyPlatformInputSchema.optional(),
    connect: z.object({ platformId: z.string() }).optional(),
  })
  .refine((data) => (data.create ? 1 : 0) + (data.connect ? 1 : 0) === 1, {
    message: "Exactly one of 'create' or 'connect' must be provided",
  });

// ============================================================================
// TechnologyPlatform Relate Update Input Schema (Create/Connect/Update)
// ============================================================================

export const TechnologyPlatformRelateUpdateInputSchema = z
  .object({
    create: TechnologyPlatformInputSchema.optional(),
    connect: z.object({ platformId: z.string() }).optional(),
    update: TechnologyPlatformUpdateInputSchema.optional(),
  })
  .refine(
    (data) =>
      (data.create ? 1 : 0) + (data.connect ? 1 : 0) + (data.update ? 1 : 0) ===
      1,
    {
      message:
        "Exactly one of 'create', 'connect', or 'update' must be provided",
    }
  );
