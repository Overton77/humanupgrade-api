import mongoose, { Schema, type HydratedDocument } from "mongoose";

export interface IRefreshSession {
  userId: mongoose.Types.ObjectId;

  tokenHash: string;

  createdAt: Date;
  expiresAt: Date;

  rotatedAt?: Date;
  revokedAt?: Date;
  replacedBySessionId?: mongoose.Types.ObjectId;

  ip?: string;
  userAgent?: string;
}

const RefreshSessionSchema = new Schema<IRefreshSession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    tokenHash: { type: String, required: true, index: true },

    createdAt: { type: Date, required: true, default: () => new Date() },
    expiresAt: { type: Date, required: true },

    rotatedAt: { type: Date },
    revokedAt: { type: Date },
    replacedBySessionId: { type: Schema.Types.ObjectId, ref: "RefreshSession" },

    ip: { type: String },
    userAgent: { type: String },
  },
  { versionKey: false }
);

// Auto-cleanup expired sessions after 0 seconds
RefreshSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshSession =
  mongoose.models.RefreshSession ??
  mongoose.model<IRefreshSession>("RefreshSession", RefreshSessionSchema);

export type RefreshSessionDoc = HydratedDocument<IRefreshSession>;
