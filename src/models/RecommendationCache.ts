import mongoose, { Schema, Model, HydratedDocument, Document } from "mongoose";
import { GoalType } from "./goalTypes.js";

export interface IRecommendationItem {
  entityType: string;
  entityId: mongoose.Types.ObjectId;
  score: number;
  reasons: string[];
}

export interface IRecommendationCache extends Document {
  id: string;
  userId: mongoose.Types.ObjectId;

  goalType?: GoalType;

  generatedAt: Date;
  items: IRecommendationItem[];

  createdAt?: Date;
  updatedAt?: Date;
}

export type RecommendationCacheDoc = HydratedDocument<IRecommendationCache>;
export interface RecommendationCacheModel extends Model<IRecommendationCache> {}

const RecommendationItemSchema = new Schema<IRecommendationItem>(
  {
    entityType: { type: String, required: true, index: true },
    entityId: { type: Schema.Types.ObjectId, required: true, index: true },
    score: { type: Number, required: true },
    reasons: { type: [String], default: [] },
  },
  { _id: false }
);

const RecommendationCacheSchema = new Schema<
  IRecommendationCache,
  RecommendationCacheModel
>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
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
        "stress",
        "recovery",
        "longevity",
        "health",
        "strength",
        "other",
      ],
      default: "other",
    },

    generatedAt: { type: Date, required: true, index: true },
    items: { type: [RecommendationItemSchema], default: [] },
  },
  { timestamps: true }
);

RecommendationCacheSchema.virtual("id").get(function () {
  return this._id.toHexString();
});
RecommendationCacheSchema.set("toJSON", { virtuals: true });
RecommendationCacheSchema.set("toObject", { virtuals: true });

RecommendationCacheSchema.index({ userId: 1, goalType: 1 }, { unique: true });

export const RecommendationCache: RecommendationCacheModel =
  (mongoose.models.RecommendationCache as RecommendationCacheModel) ||
  mongoose.model<IRecommendationCache, RecommendationCacheModel>(
    "RecommendationCache",
    RecommendationCacheSchema
  );
