import mongoose, { Schema, Document, Model } from "mongoose";
import { MediaLinkSchema, MediaLink } from "./MediaLink";
export interface IPerson extends Document {
  name: string;
  role?: string;
  bio?: string;
  mediaLinks?: MediaLink[];
  businessIds: mongoose.Types.ObjectId[];
}

const PersonSchema = new Schema<IPerson>(
  {
    name: { type: String, unique: true, required: true },
    role: { type: String },
    bio: { type: String },
    mediaLinks: [MediaLinkSchema],
    businessIds: [{ type: Schema.Types.ObjectId, ref: "Business" }],
  },
  { timestamps: true }
);

export const Person: Model<IPerson> =
  mongoose.models.Person || mongoose.model<IPerson>("Person", PersonSchema);
