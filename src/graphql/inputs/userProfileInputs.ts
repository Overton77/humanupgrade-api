import {
  ExperienceLevel,
  DietStyle,
  TimeBudget,
  PreferredFormat,
} from "../../models/UserProfile.js";
import { GoalType } from "../../models/goalTypes.js";

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
  goals?: UserGoalInput[];
  experienceLevel?: ExperienceLevel;
  dietStyle?: DietStyle;
  avoidances?: string[];
  timeBudget?: TimeBudget;
  preferredFormats?: PreferredFormat[];
  topicInterests?: string[];
  entityPreferences?: EntityPreferencesInput;
}
