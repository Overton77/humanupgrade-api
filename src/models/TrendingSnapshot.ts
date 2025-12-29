import mongoose, { Schema, Model, HydratedDocument, Document } from "mongoose";

export type TrendingWindow = "24h" | "7d";

export interface ITrendingItem {
  entityType: string;
  entityId: mongoose.Types.ObjectId;
  score: number;
  reasons: string[];
}

export interface ITrendingSnapshot extends Document {
  id: string;
  window: TrendingWindow;
  generatedAt: Date;
  items: ITrendingItem[];
  createdAt?: Date;
  updatedAt?: Date;
}

export type TrendingSnapshotDoc = HydratedDocument<ITrendingSnapshot>;
export interface TrendingSnapshotModel extends Model<ITrendingSnapshot> {}

const TrendingItemSchema = new Schema<ITrendingItem>(
  {
    entityType: { type: String, required: true, index: true },
    entityId: { type: Schema.Types.ObjectId, required: true, index: true },
    score: { type: Number, required: true },
    reasons: { type: [String], default: [] },
  },
  { _id: false }
);

const TrendingSnapshotSchema = new Schema<
  ITrendingSnapshot,
  TrendingSnapshotModel
>(
  {
    window: {
      type: String,
      enum: ["24h", "7d"],
      required: true,
      unique: true,
      index: true,
    },
    generatedAt: { type: Date, required: true, index: true },
    items: { type: [TrendingItemSchema], default: [] },
  },
  { timestamps: true }
);

TrendingSnapshotSchema.virtual("id").get(function () {
  return this._id.toHexString();
});
TrendingSnapshotSchema.set("toJSON", { virtuals: true });
TrendingSnapshotSchema.set("toObject", { virtuals: true });

TrendingSnapshotSchema.index({ window: 1, generatedAt: -1 });

export const TrendingSnapshot: TrendingSnapshotModel =
  (mongoose.models.TrendingSnapshot as TrendingSnapshotModel) ||
  mongoose.model<ITrendingSnapshot, TrendingSnapshotModel>(
    "TrendingSnapshot",
    TrendingSnapshotSchema
  );
