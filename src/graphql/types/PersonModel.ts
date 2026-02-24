import { z } from "zod";
import {
  Neo4jDateString,
  Neo4jDateTimeString,
} from "../utils/dateTimeUtils.js";
import { TemporalValiditySchema } from "./TemporalValidityModel.js";
import { EpisodeSchema } from "./EpisodeModel.js";
import { ChannelSchema } from "./ChannelModel.js";
import {
  AppearanceRoleEnum,
  ChannelRoleEnum,
  TypicalAppearanceEnum,
} from "../enums/index.js";

// ============================================================================
// Edge: Person -[:APPEARS_IN_EPISODE]-> Episode
// ============================================================================

export const PersonAppearsInEpisodeEdgeSchema = TemporalValiditySchema.extend({
  episode: z.lazy(() => EpisodeSchema),
  appearanceRole: AppearanceRoleEnum,
  billingOrder: z.number().int().nullable(),
  confidence: z.number().nullable(),
});

export type PersonAppearsInEpisodeEdge = z.infer<
  typeof PersonAppearsInEpisodeEdgeSchema
>;

// ============================================================================
// Edge: Person -[:HAS_ROLE_ON_CHANNEL]-> Channel
// ============================================================================

export const PersonHasRoleOnChannelEdgeSchema = TemporalValiditySchema.extend({
  channel: z.lazy(() => ChannelSchema),
  role: ChannelRoleEnum,
  startDate: Neo4jDateString.nullable(),
  endDate: Neo4jDateString.nullable(),
  isCurrent: z.boolean().nullable(),
  typicalAppearance: TypicalAppearanceEnum.nullable(),
  confidence: z.number().nullable(),
});

export type PersonHasRoleOnChannelEdge = z.infer<
  typeof PersonHasRoleOnChannelEdgeSchema
>;

// ============================================================================
// Person Schema (expanded, biotech-friendly)
// ============================================================================

export const PersonSchema = z.object({
  personId: z.string(),

  // Core identity
  canonicalName: z.string(),
  givenName: z.string().nullable(),
  familyName: z.string().nullable(),
  middleName: z.string().nullable(),
  suffix: z.string().nullable(),
  honorific: z.string().nullable(),
  aliases: z.array(z.string()).nullable(),

  // Bio & profile
  bio: z.string().nullable(),
  primaryLanguage: z.string().nullable(),

  // Professional / biotech profile
  primaryDomain: z.string().nullable(),
  specialties: z.array(z.string()).nullable(),
  expertiseTags: z.array(z.string()).nullable(),
  affiliationSummary: z.string().nullable(),

  // Credentials
  degrees: z.array(z.string()).nullable(),
  credentialIds: z.array(z.string()).nullable(),
  orcid: z.string().nullable(),
  npi: z.string().nullable(),
  licenseIds: z.array(z.string()).nullable(),

  // Online presence
  websiteUrl: z.string().nullable(),
  email: z.string().nullable(),
  socialProfiles: z.array(z.string()).nullable(),
  linkedinUrl: z.string().nullable(),
  twitterUrl: z.string().nullable(),
  githubUrl: z.string().nullable(),
  scholarUrl: z.string().nullable(),

  // Media / public
  headshotUrl: z.string().nullable(),
  publicFigure: z.boolean().nullable(),
  notabilityNotes: z.string().nullable(),

  // Temporal validity + system
  createdAt: Neo4jDateTimeString,
  updatedAt: Neo4jDateTimeString.nullable(),
  validAt: Neo4jDateTimeString.nullable(),
  invalidAt: Neo4jDateTimeString.nullable(),
  expiredAt: Neo4jDateTimeString.nullable(),

  // Search / embedding (optional for agents)
  searchText: z.string().nullable(),
  embedding: z.array(z.number()).nullable(),

  // Media relationships
  appearsInEpisode: z.array(PersonAppearsInEpisodeEdgeSchema).nullable(),
  hasRoleOnChannel: z.array(PersonHasRoleOnChannelEdgeSchema).nullable(),
});

export type Person = z.infer<typeof PersonSchema>;
