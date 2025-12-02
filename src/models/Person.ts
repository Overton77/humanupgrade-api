import mongoose, { Schema, Document, Model } from "mongoose";
import { MediaLinkSchema, MediaLink } from "./MediaLink.js";
export interface IPerson extends Document {
  id: string; // <- now available because of virtual
  name: string;
  role?: string;
  bio?: string;
  mediaLinks?: MediaLink[];
  businessIds: mongoose.Types.ObjectId[];
  episodeIds: mongoose.Types.ObjectId[];
}

export interface PersonModel extends Model<IPerson> {
  syncPersonsForEpisodes(personId: mongoose.Types.ObjectId): Promise<void>;
}

const PersonSchema = new Schema<IPerson>(
  {
    name: { type: String, unique: true, required: true },
    role: { type: String },
    bio: { type: String },
    mediaLinks: [MediaLinkSchema],
    businessIds: [{ type: Schema.Types.ObjectId, ref: "Business" }],
    episodeIds: [{ type: Schema.Types.ObjectId, ref: "Episode" }],
  },
  { timestamps: true }
);

// -----------------------------------------------------
// 🔥 Add this virtual so id = _id
// -----------------------------------------------------
PersonSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

PersonSchema.set("toJSON", { virtuals: true });
PersonSchema.set("toObject", { virtuals: true });

PersonSchema.statics.syncPersonsForEpisodes = async function (
  personId: mongoose.Types.ObjectId
): Promise<void> {
  const { Episode } = await import("./Episode.js");
  const episodes = await Episode.find({ guestIds: personId }).select("_id");
  const episodeIds = episodes.map((e) => e._id);
  await this.findByIdAndUpdate(
    personId,
    { guestEpisodeIds: episodeIds },
    { new: false }
  );
};

PersonSchema.post("findOneAndDelete", async function (doc) {
  if (!doc) return;
  const personId = doc._id;

  const { Episode } = await import("./Episode.js");

  await Episode.updateMany(
    { guestIds: personId },
    { $pull: { guestIds: personId } }
  );
});

export const Person: PersonModel =
  (mongoose.models.Person as PersonModel) ||
  mongoose.model<IPerson, PersonModel>("Person", PersonSchema);
