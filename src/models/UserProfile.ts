import mongoose, { Schema, Document, Model, HydratedDocument } from "mongoose";
import { GoalType } from "./goalTypes.js";

// DEC 28, 2025 : Syncing Goal Types with Protocol Categories for better
// reccomendations and LLM Assistant Context

export type ExperienceLevel = "beginner" | "intermediate" | "advanced";

export type DietStyle =
  | "none"
  | "keto"
  | "paleo"
  | "vegan"
  | "vegetarian"
  | "mediterranean"
  | "lowCarb"
  | "omnivore"
  | "other";

export type TimeBudget = "min5" | "min15" | "min30" | "min60";

export type PreferredFormat = "video" | "summary" | "protocol" | "caseStudy";

export type EntityPreferenceType = "liked" | "hidden" | "blocked";

export interface IUserGoal {
  goalType: GoalType;
  priority: number;
  notes?: string;
}

export interface IEntityPreferences {
  likedEntityIds?: mongoose.Types.ObjectId[];
  hiddenEntityIds?: mongoose.Types.ObjectId[];
  blockedEntityIds?: mongoose.Types.ObjectId[];
}

export interface IUserProfile extends Document {
  id: string;
  userId: mongoose.Types.ObjectId;

  goals: IUserGoal[];

  experienceLevel?: ExperienceLevel;
  dietStyle?: DietStyle;

  avoidances: string[];
  timeBudget?: TimeBudget;

  preferredFormats: PreferredFormat[];
  topicInterests: string[];

  entityPreferences: IEntityPreferences;

  createdAt?: Date;
  updatedAt?: Date;
}

export type UserProfileDoc = HydratedDocument<IUserProfile>;
export interface UserProfileModel extends Model<IUserProfile> {}

const UserGoalSchema = new Schema<IUserGoal>(
  {
    goalType: {
      type: String,
      enum: [
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
      ],
      required: true,
    },
    priority: { type: Number },
    notes: { type: String },
  },
  { _id: false }
);

const EntityPreferencesSchema = new Schema<IEntityPreferences>(
  {
    likedEntityIds: [{ type: Schema.Types.ObjectId }],
    hiddenEntityIds: [{ type: Schema.Types.ObjectId }],
    blockedEntityIds: [{ type: Schema.Types.ObjectId }],
  },
  { _id: false }
);

const UserProfileSchema = new Schema<IUserProfile, UserProfileModel>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    goals: { type: [UserGoalSchema], default: [] },

    experienceLevel: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
    },

    dietStyle: {
      type: String,
      enum: [
        "none",
        "keto",
        "paleo",
        "vegan",
        "vegetarian",
        "mediterranean",
        "lowCarb",
        "omnivore",
        "other",
      ],
    },

    avoidances: { type: [String], default: [] },

    timeBudget: {
      type: String,
      enum: ["min5", "min15", "min30", "min60"],
    },

    preferredFormats: {
      type: [String],
      enum: ["video", "summary", "protocol", "caseStudy"],
      default: [],
    },

    topicInterests: { type: [String], default: [] },

    entityPreferences: { type: EntityPreferencesSchema, default: undefined },
  },
  { timestamps: true }
);

UserProfileSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

UserProfileSchema.set("toJSON", { virtuals: true });
UserProfileSchema.set("toObject", { virtuals: true });

export const UserProfile: UserProfileModel =
  (mongoose.models.UserProfile as UserProfileModel) ||
  mongoose.model<IUserProfile, UserProfileModel>(
    "UserProfile",
    UserProfileSchema
  );
