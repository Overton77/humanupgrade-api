import mongoose, { Schema, Document, Model } from "mongoose";
import bcrypt from "bcryptjs";
import { MediaLinkSchema, MediaLink } from "./MediaLink";

export interface IUser extends Document {
  email: string;
  passwordHash?: string;
  provider: "local" | "google" | "github" | "apple";
  providerId?: string;
  name?: string;
  role?: "admin" | "user";
  mediaLinks?: MediaLink[];
  savedEpisodes: mongoose.Types.ObjectId[];
  savedProducts: mongoose.Types.ObjectId[];
  savedBusinesses: mongoose.Types.ObjectId[];
  comparePassword(plain: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String },
    provider: {
      type: String,
      enum: ["local", "google", "github", "apple"],
      default: "local",
    },
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    },
    providerId: { type: String },
    name: { type: String },
    mediaLinks: [MediaLinkSchema],
    savedEpisodes: [{ type: Schema.Types.ObjectId, ref: "Episode" }],
    savedProducts: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    savedBusinesses: [{ type: Schema.Types.ObjectId, ref: "Business" }],
  },
  { timestamps: true }
);

// For local auth
UserSchema.methods.comparePassword = async function (plain: string) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(plain, this.passwordHash);
};

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
