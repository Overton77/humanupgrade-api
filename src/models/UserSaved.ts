import mongoose, { Schema, Document, Model, HydratedDocument } from "mongoose";

// TODO:  Capitalize SavedEntityType and SaveSource and propogate change .
// TODO: Mapping for now on reccomendations
export type SavedEntityType =
  | "Product"
  | "Compound"
  | "Person"
  | "Business"
  | "Protocol"
  | "Episode"
  | "CaseStudy"
  | "Article"
  | "UserProtocol";

export type SaveSource =
  | "dashboard"
  | "episode"
  | "assistant"
  | "search"
  | "protocol_builder"
  | "profile"
  | "other";

export interface IUserSavedTargetRef {
  type: SavedEntityType;
  id: mongoose.Types.ObjectId;
}

// Removed extends Document
export interface IUserSaved {
  id: string; // virtual

  userId: mongoose.Types.ObjectId;

  targetRef: IUserSavedTargetRef;

  note?: string;
  tags: string[];
  pinned: boolean;
  source?: SaveSource;

  createdAt?: Date;
  updatedAt?: Date;
}

export type UserSavedDoc = HydratedDocument<IUserSaved>;
export interface UserSavedModel extends Model<IUserSaved> {}

const TargetRefSchema = new Schema<IUserSavedTargetRef>(
  {
    type: {
      type: String,
      enum: [
        "Product",
        "Compound",
        "Person",
        "Business",
        "Protocol",
        "Episode",
        "CaseStudy",
        "Article",
        "UserProtocol",
      ],
      required: true,
      index: true,
    },
    id: { type: Schema.Types.ObjectId, required: true, index: true },
  },
  { _id: false }
);

const UserSavedSchema = new Schema<IUserSaved, UserSavedModel>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    targetRef: { type: TargetRefSchema, required: true },

    note: { type: String },
    tags: { type: [String], default: [], index: true },
    pinned: { type: Boolean, default: false, index: true },
    source: {
      type: String,
      enum: [
        "dashboard",
        "episode",
        "assistant",
        "search",
        "protocol_builder",
        "profile",
        "other",
      ],
    },
  },
  { timestamps: true }
);

// Prevent duplicates per user+entity
UserSavedSchema.index(
  { userId: 1, "targetRef.type": 1, "targetRef.id": 1 },
  { unique: true }
);

// Efficient listing/pagination
UserSavedSchema.index({ userId: 1, "targetRef.type": 1, createdAt: -1 });

UserSavedSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

UserSavedSchema.set("toJSON", { virtuals: true });
UserSavedSchema.set("toObject", { virtuals: true });

export const UserSaved: UserSavedModel =
  (mongoose.models.UserSaved as UserSavedModel) ||
  mongoose.model<IUserSaved, UserSavedModel>("UserSaved", UserSavedSchema);
