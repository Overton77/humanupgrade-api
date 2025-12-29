import { z } from "zod";
import {
  ObjectIdSchema,
  ObjectIdArraySchema,
} from "../../../lib/validation.js";

/**
 * Goal type enum
 */
export const GoalTypeSchema = z.enum([
  "sleep",
  "energy",
  "fatLoss",
  "circadian",
  "fitness",
  "nutrition",
  "cognition",
  "longevity",
  "strength",
  "stress",
  "recovery",
  "health",
  "other",
]);

/**
 * Experience level enum
 */
export const ExperienceLevelSchema = z.enum([
  "beginner",
  "intermediate",
  "advanced",
]);

/**
 * Diet style enum
 */
export const DietStyleSchema = z.enum([
  "none",
  "keto",
  "paleo",
  "vegan",
  "vegetarian",
  "mediterranean",
  "lowCarb",
  "omnivore",
  "other",
]);

/**
 * Time budget enum
 */
export const TimeBudgetSchema = z.enum(["min5", "min15", "min30", "min60"]);

/**
 * Preferred format enum
 */
export const PreferredFormatSchema = z.enum([
  "video",
  "summary",
  "protocol",
  "caseStudy",
]);

/**
 * User goal input schema
 */
export const UserGoalInputSchema = z.object({
  goalType: GoalTypeSchema,
  priority: z.number().int().min(0),
  notes: z.string().max(500).optional(),
});

/**
 * Entity preferences input schema
 */
export const EntityPreferencesInputSchema = z.object({
  likedEntityIds: ObjectIdArraySchema.optional(),
  hiddenEntityIds: ObjectIdArraySchema.optional(),
  blockedEntityIds: ObjectIdArraySchema.optional(),
});

/**
 * User profile upsert input schema
 */
export const UserProfileUpsertInputSchema = z.object({
  goals: z.array(UserGoalInputSchema).optional(),
  experienceLevel: ExperienceLevelSchema.optional(),
  dietStyle: DietStyleSchema.optional(),
  avoidances: z.array(z.string().max(200)).optional(),
  timeBudget: TimeBudgetSchema.optional(),
  preferredFormats: z.array(PreferredFormatSchema).optional(),
  topicInterests: z.array(z.string().max(200)).optional(),
  entityPreferences: EntityPreferencesInputSchema.optional(),
});
