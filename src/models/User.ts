import mongoose, { Schema, Document, Model, HydratedDocument } from "mongoose";
import bcrypt from "bcryptjs";
import { MediaLinkSchema, MediaLink } from "./MediaLink.js";

export interface IUser extends Document {
  id: string;
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
  savedProtocols: mongoose.Types.ObjectId[];
  savedCompounds: mongoose.Types.ObjectId[];
  savedCaseStudies: mongoose.Types.ObjectId[];
  savedPersons: mongoose.Types.ObjectId[];
  comparePassword(plain: string): Promise<boolean>;
}

export type UserDoc = HydratedDocument<IUser>;

export interface UserModel extends Model<IUser> {}

const UserSchema = new Schema<IUser, UserModel>(
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
    savedPersons: [{ type: Schema.Types.ObjectId, ref: "Person" }],
    savedBusinesses: [{ type: Schema.Types.ObjectId, ref: "Business" }],
    savedCompounds: [{ type: Schema.Types.ObjectId, ref: "Compound" }],
    savedCaseStudies: [{ type: Schema.Types.ObjectId, ref: "CaseStudy" }],
    savedProtocols: [{ type: Schema.Types.ObjectId, ref: "Protocol" }],
  },
  { timestamps: true }
);

UserSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

UserSchema.set("toJSON", { virtuals: true });
UserSchema.set("toObject", { virtuals: true });

// For local auth
UserSchema.methods.comparePassword = async function (plain: string) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(plain, this.passwordHash);
};

export const User: UserModel =
  (mongoose.models.User as UserModel) ||
  mongoose.model<IUser, UserModel>("User", UserSchema);
