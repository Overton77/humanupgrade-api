import { z } from "zod";
import { PlatformTypeEnum } from "../enums/index.js";
import { Neo4jDateTimeString } from "../utils/dateTimeUtils.js";

// ============================================================================
// TechnologyPlatform Schema
// ============================================================================

export const TechnologyPlatformSchema = z.object({
  platformId: z.string(),
  canonicalName: z.string(),
  aliases: z.array(z.string()).nullable(),
  platformType: PlatformTypeEnum,
  description: z.string().nullable(),
  validAt: Neo4jDateTimeString,
  invalidAt: Neo4jDateTimeString,
  expiredAt: Neo4jDateTimeString,
  createdAt: Neo4jDateTimeString,
});

export type TechnologyPlatform = z.infer<typeof TechnologyPlatformSchema>;
