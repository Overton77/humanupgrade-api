import { z } from "zod";
import {
  Neo4jDateTimeString,
  Neo4jDateString,
} from "../utils/dateTimeUtils.js";
import { AppearanceRoleEnum, ChannelRoleEnum, TypicalAppearanceEnum } from "../enums/index.js";
import { TemporalValidityInputSchema } from "./TemporalValidityInputs.js";
import {
  ChannelRelateUpsertInputSchema,
  EpisodeRelateUpsertInputSchema,
} from "./MediaInputs.js";

// ============================================================================
// Person ↔ Media Edge Input Schemas
// ============================================================================

export const AppearsInEpisodeEdgeInputSchema = TemporalValidityInputSchema.extend({
  episode: EpisodeRelateUpsertInputSchema,
  appearanceRole: AppearanceRoleEnum.nullable().optional(),
  billingOrder: z.number().int().nullable().optional(),
  confidence: z.number().nullable().optional(),
});

export type AppearsInEpisodeEdgeInput = z.infer<
  typeof AppearsInEpisodeEdgeInputSchema
>;

export const HasRoleOnChannelEdgeInputSchema = TemporalValidityInputSchema.extend({
  channel: ChannelRelateUpsertInputSchema,
  role: ChannelRoleEnum.nullable().optional(),
  startDate: Neo4jDateString.optional(),
  endDate: Neo4jDateString.optional(),
  isCurrent: z.boolean().nullable().optional(),
  typicalAppearance: TypicalAppearanceEnum.nullable().optional(),
  confidence: z.number().nullable().optional(),
});

export type HasRoleOnChannelEdgeInput = z.infer<
  typeof HasRoleOnChannelEdgeInputSchema
>;

// ============================================================================
// Person Input Schema (for create)
// ============================================================================

export const PersonInputSchema = z.object({
  personId: z.string().optional(), // Auto-generated if not provided

  // Core identity
  canonicalName: z.string(),
  givenName: z.string().nullable().optional(),
  familyName: z.string().nullable().optional(),
  middleName: z.string().nullable().optional(),
  suffix: z.string().nullable().optional(),
  honorific: z.string().nullable().optional(),
  aliases: z.array(z.string()).nullable().optional(),

  // Bio & profile
  bio: z.string().nullable().optional(),
  primaryLanguage: z.string().nullable().optional(),

  // Professional / biotech profile
  primaryDomain: z.string().nullable().optional(),
  specialties: z.array(z.string()).nullable().optional(),
  expertiseTags: z.array(z.string()).nullable().optional(),
  affiliationSummary: z.string().nullable().optional(),

  // Credentials
  degrees: z.array(z.string()).nullable().optional(),
  credentialIds: z.array(z.string()).nullable().optional(),
  orcid: z.string().nullable().optional(),
  npi: z.string().nullable().optional(),
  licenseIds: z.array(z.string()).nullable().optional(),

  // Online presence
  websiteUrl: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  socialProfiles: z.array(z.string()).nullable().optional(),
  linkedinUrl: z.string().nullable().optional(),
  twitterUrl: z.string().nullable().optional(),
  githubUrl: z.string().nullable().optional(),
  scholarUrl: z.string().nullable().optional(),

  // Media / public
  headshotUrl: z.string().nullable().optional(),
  publicFigure: z.boolean().nullable().optional(),
  notabilityNotes: z.string().nullable().optional(),

  // Temporal validity + system
  validAt: Neo4jDateTimeString.optional(),
  invalidAt: Neo4jDateTimeString.optional(),
  expiredAt: Neo4jDateTimeString.optional(),
  createdAt: Neo4jDateTimeString.optional(),

  // Search / embedding (optional)
  searchText: z.string().nullable().optional(),

  // Media relationships (connect | connectByKey | upsert)
  appearsInEpisode: z.array(AppearsInEpisodeEdgeInputSchema).optional(),
  hasRoleOnChannel: z.array(HasRoleOnChannelEdgeInputSchema).optional(),
});

export type PersonInput = z.infer<typeof PersonInputSchema>;

// ============================================================================
// Person Update Input Schema (all fields optional for partial updates)
// ============================================================================

export const PersonUpdateInputSchema = PersonInputSchema.partial().extend({
  personId: z.string().optional(),
});

export type PersonUpdateInput = z.infer<typeof PersonUpdateInputSchema>;

// ============================================================================
// Person Relate Input (create OR connect)
// ============================================================================

export const PersonRelateInputSchema = z
  .object({
    create: PersonInputSchema.optional(),
    connect: z.object({ personId: z.string() }).optional(),
  })
  .refine((data) => (data.create ? 1 : 0) + (data.connect ? 1 : 0) === 1, {
    message:
      "PersonRelateInput: exactly one of 'create' or 'connect' must be provided",
  });

export type PersonRelateInput = z.infer<typeof PersonRelateInputSchema>;

// ============================================================================
// Person Relate Update Input (create OR connect OR update)
// ============================================================================

export const PersonRelateUpdateInputSchema = z
  .object({
    create: PersonInputSchema.optional(),
    connect: z.object({ personId: z.string() }).optional(),
    update: PersonUpdateInputSchema.optional(),
  })
  .refine(
    (data) =>
      (data.create ? 1 : 0) + (data.connect ? 1 : 0) + (data.update ? 1 : 0) ===
      1,
    {
      message:
        "PersonRelateUpdateInput: exactly one of 'create', 'connect', or 'update' must be provided",
    },
  );

export type PersonRelateUpdateInput = z.infer<
  typeof PersonRelateUpdateInputSchema
>;

// ============================================================================
// Person Relate Upsert Input (connect OR upsert) — for Media ClaimOccurrence.utteredBy
// ============================================================================

export const PersonRelateUpsertInputSchema = z
  .object({
    connect: z.object({ personId: z.string() }).optional(),
    upsert: PersonInputSchema.optional(),
  })
  .refine((data) => (data.connect ? 1 : 0) + (data.upsert ? 1 : 0) === 1, {
    message:
      "PersonRelateUpsertInput: exactly one of 'connect' or 'upsert' must be provided",
  });

export type PersonRelateUpsertInput = z.infer<
  typeof PersonRelateUpsertInputSchema
>;
