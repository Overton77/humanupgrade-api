import mongoose, { Schema, Document, Model, HydratedDocument } from "mongoose";
import {
  ProtocolStepGroupSchema,
  EvidenceRefSchema,
  SafetyBucketSchema,
  type IProtocolStepGroup,
  type IEvidenceRef,
  type ISafetyBucket,
} from "./ProtocolParts.js";

export type UserProtocolStatus = "draft" | "active" | "archived";
export type UserGoalType =
  | "sleep"
  | "energy"
  | "fatLoss"
  | "cognition"
  | "longevity"
  | "strength"
  | "stress"
  | "recovery"
  | "other";

export interface IUserProtocol {
  id: string;

  userId: mongoose.Types.ObjectId;

  title: string;
  goalType?: UserGoalType;

  status: UserProtocolStatus;

  // optional link if created "from" a system protocol
  sourceProtocolId?: mongoose.Types.ObjectId;

  stepsStructured: IProtocolStepGroup[];
  evidenceRefs: IEvidenceRef[];
  safety?: ISafetyBucket;

  lastEditedAt?: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

export type UserProtocolDoc = HydratedDocument<IUserProtocol>;
export interface UserProtocolModel extends Model<IUserProtocol> {}

const UserProtocolSchema = new Schema<IUserProtocol, UserProtocolModel>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    title: { type: String, required: true, index: true },
    goalType: {
      type: String,
      enum: [
        "sleep",
        "energy",
        "fatLoss",
        "cognition",
        "longevity",
        "strength",
        "stress",
        "recovery",
        "other",
      ],
    },

    status: {
      type: String,
      enum: ["draft", "active", "archived"],
      default: "draft",
      index: true,
    },

    sourceProtocolId: {
      type: Schema.Types.ObjectId,
      ref: "Protocol",
      index: true,
    },

    stepsStructured: { type: [ProtocolStepGroupSchema], default: [] },
    evidenceRefs: { type: [EvidenceRefSchema], default: [] },
    safety: { type: SafetyBucketSchema, default: undefined },

    lastEditedAt: { type: Date, index: true },
  },
  { timestamps: true }
);

// Helpful compound indexes for your dashboard queries
UserProtocolSchema.index({ userId: 1, status: 1, lastEditedAt: -1, _id: -1 });

UserProtocolSchema.virtual("id").get(function () {
  return this._id.toHexString();
});
UserProtocolSchema.set("toJSON", { virtuals: true });
UserProtocolSchema.set("toObject", { virtuals: true });

export const UserProtocol: UserProtocolModel =
  (mongoose.models.UserProtocol as UserProtocolModel) ||
  mongoose.model<IUserProtocol, UserProtocolModel>(
    "UserProtocol",
    UserProtocolSchema
  );
