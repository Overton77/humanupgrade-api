import {
  GoalType,
  ExperienceLevel,
  DietStyle,
  TimeBudget,
  PreferredFormat,
  IUserGoal,
  IEntityPreferences,
} from "../../models/UserProfile.js";

export interface UserGoalInput {
  goalType: GoalType;
  priority: number;
  notes?: string;
}

export interface EntityPreferencesInput {
  likedEntityIds?: string[];
  hiddenEntityIds?: string[];
  blockedEntityIds?: string[];
}

export interface UserProfileUpsertInput {
  userId: string;
  goals?: UserGoalInput[];
  experienceLevel?: ExperienceLevel;
  dietStyle?: DietStyle;
  avoidances?: string[];
  timeBudget?: TimeBudget;
  preferredFormats?: PreferredFormat[];
  topicInterests?: string[];
  entityPreferences?: EntityPreferencesInput;
}
