import mongoose, { Schema, Model, HydratedDocument, Document } from "mongoose";

export type ActivityEntityType =
  | "Article"
  | "Business"
  | "CaseStudy"
  | "Compound"
  | "Person"
  | "Product"
  | "UserProtocol"
  | "Protocol"
  | "Episode";

export type ActivityEventType =
  | "VIEW_ENTITY"
  | "SEARCH"
  | "OPEN_EPISODE"
  | "PLAY_EPISODE"
  | "SEEK_EPISODE"
  | "SAVE_ENTITY"
  | "UNSAVE_ENTITY"
  | "LIKE_ENTITY"
  | "HIDE_ENTITY"
  | "BLOCK_ENTITY"
  | "CREATE_USER_PROTOCOL"
  | "UPDATE_USER_PROTOCOL"
  | "UPSERT_USER_PROFILE"
  | "APPLY_PROTOCOL"
  | "COMPLETE_STEP"
  | "CLICK_EVIDENCE";

export type ActivityContextSurface =
  | "dashboard"
  | "search"
  | "entity"
  | "episode"
  | "protocol_builder"
  | "saved"
  | "profile"
  | "notes"
  | "other";

export interface IUserActivity extends Document {
  id: string;

  userId: mongoose.Types.ObjectId;

  eventType: ActivityEventType;

  // Optional: what the event is about
  entityType?: ActivityEntityType;
  entityId?: mongoose.Types.ObjectId;

  // Useful for “continue”, attribution, analytics
  surface?: ActivityContextSurface;

  // Optional small payload; keep it small (no huge blobs)
  metadata?: Record<string, unknown>;

  createdAt?: Date;
  updatedAt?: Date;
}

export type UserActivityDoc = HydratedDocument<IUserActivity>;
export interface UserActivityModel extends Model<IUserActivity> {}

const UserActivitySchema = new Schema<IUserActivity, UserActivityModel>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    eventType: {
      type: String,
      required: true,
      enum: [
        "VIEW_ENTITY",
        "SEARCH",
        "OPEN_EPISODE",
        "PLAY_EPISODE",
        "SEEK_EPISODE",
        "SAVE_ENTITY",
        "UNSAVE_ENTITY",
        "LIKE_ENTITY",
        "HIDE_ENTITY",
        "UPSERT_USER_PROFILE",
        "BLOCK_ENTITY",
        "CREATE_USER_PROTOCOL",
        "UPDATE_USER_PROTOCOL",
        "APPLY_PROTOCOL",
        "COMPLETE_STEP",
        "CLICK_EVIDENCE",
      ],
      index: true,
    },

    entityType: {
      type: String,
      enum: [
        "Article",
        "Business",
        "CaseStudy",
        "Compound",
        "Person",
        "Product",
        "UserProtocol",
        "Protocol",
        "Episode",
      ],
      index: true,
    },

    entityId: { type: Schema.Types.ObjectId, index: true },

    surface: {
      type: String,
      enum: [
        "dashboard",
        "search",
        "entity",
        "episode",
        "protocol_builder",
        "saved",
        "profile",
        "notes",
        "other",
      ],
      default: "other",
      index: true,
    },

    metadata: { type: Schema.Types.Mixed, default: undefined },
  },
  { timestamps: true }
);

UserActivitySchema.virtual("id").get(function () {
  return this._id.toHexString();
});
UserActivitySchema.set("toJSON", { virtuals: true });
UserActivitySchema.set("toObject", { virtuals: true });

// ---- Indexes for your three slices ----

// Per-user “continue” and recency feeds
UserActivitySchema.index({ userId: 1, createdAt: -1, _id: -1 });

// Global trending window scans
UserActivitySchema.index({ createdAt: -1, eventType: 1 });

// Entity-centric aggregation (trending & metrics)
UserActivitySchema.index({ entityType: 1, entityId: 1, createdAt: -1 });

// Filtered activity (helpful for recs)
UserActivitySchema.index({ userId: 1, eventType: 1, createdAt: -1 });

// Optional TTL: keep last 180 days of activity
// (Enable when you’re comfortable; it will delete old docs automatically.)
// UserActivitySchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 180 });

export const UserActivity: UserActivityModel =
  (mongoose.models.UserActivity as UserActivityModel) ||
  mongoose.model<IUserActivity, UserActivityModel>(
    "UserActivity",
    UserActivitySchema,
    "user_activities"
  );
