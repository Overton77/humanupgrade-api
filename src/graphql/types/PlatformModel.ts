import { z } from "zod";
import { MediaPlatformTypeEnum } from "../enums/index.js";
import { Neo4jDateTimeString } from "../utils/dateTimeUtils.js";
import { TemporalValiditySchema } from "./TemporalValidityModel.js";
import { ChannelSchema } from "./ChannelModel.js";

// ============================================================================
// Edge: Platform -[:HOSTS_CHANNEL]-> Channel
// ============================================================================

export const HostsChannelEdgeSchema: z.ZodTypeAny =
  TemporalValiditySchema.extend({
    channel: z.lazy(() => ChannelSchema),
  });

export type HostsChannelEdge = z.infer<typeof HostsChannelEdgeSchema>;

// ============================================================================
// Platform Schema (Media distribution platform: YouTube, Spotify, etc.)
// ============================================================================

export const PlatformSchema: z.ZodTypeAny = z.object({
  platformId: z.string(),
  canonicalName: z.string(),
  aliases: z.array(z.string()).nullable(),
  platformType: MediaPlatformTypeEnum,
  description: z.string().nullable(),
  websiteUrl: z.string().nullable(),

  // Temporal validity
  validAt: Neo4jDateTimeString.nullable(),
  invalidAt: Neo4jDateTimeString.nullable(),
  expiredAt: Neo4jDateTimeString.nullable(),
  createdAt: Neo4jDateTimeString.nullable(),
  updatedAt: Neo4jDateTimeString.nullable(),

  // Relationships
  hostsChannel: z.array(HostsChannelEdgeSchema).nullable(),
});

export type Platform = z.infer<typeof PlatformSchema>;
