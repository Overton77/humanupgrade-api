import mongoose, {
  Schema,
  Document,
  Model,
  ClientSession,
  HydratedDocument,
} from "mongoose";
import { MediaLinkSchema, MediaLink } from "./MediaLink.js";
import { TxOpts } from "./utils/syncLocals.js";

export interface IPerson {
  id: string; // <- now available because of virtual
  name: string;
  role?: string;
  bio?: string;
  bioEmbedding?: number[];
  embeddingUpdatedAt?: Date;
  mediaLinks?: MediaLink[];
  businessIds: mongoose.Types.ObjectId[];
  episodeIds: mongoose.Types.ObjectId[];
}

export type PersonDoc = HydratedDocument<IPerson>;

export interface PersonModel extends Model<IPerson> {
  syncEpisodesForPerson(
    personId: mongoose.Types.ObjectId,
    opts?: TxOpts
  ): Promise<void>;
  syncBusinessesForPerson(
    personId: mongoose.Types.ObjectId,
    opts?: TxOpts
  ): Promise<void>;
}

const PersonSchema = new Schema<IPerson, PersonModel>(
  {
    name: { type: String, unique: true, required: true },
    role: { type: String },
    bio: { type: String },
    bioEmbedding: { type: [Number], default: undefined },
    embeddingUpdatedAt: { type: Date },
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

PersonSchema.statics.syncEpisodesForPerson = async function (
  personId: mongoose.Types.ObjectId,
  opts?: TxOpts
): Promise<void> {
  const session = opts?.session;
  const { Episode } = await import("./Episode.js");
  const episodes = await Episode.find({ guestIds: personId })
    .select("_id")
    .session(session ?? null);

  const episodeIds = episodes.map(
    (e: { _id: mongoose.Types.ObjectId }) => e._id
  );
  await this.findByIdAndUpdate(
    personId,
    { guestEpisodeIds: episodeIds },
    { session }
  );
};

PersonSchema.statics.syncBusinessesForPerson = async function (
  personId: mongoose.Types.ObjectId,
  opts?: TxOpts
): Promise<void> {
  const session = opts?.session;
  const { Business } = await import("./Business.js");
  const businesses = await Business.find({
    $or: [{ ownerIds: personId }, { "executives.personId": personId }],
  })
    .select("_id")
    .session(session ?? null);

  const businessIds = businesses.map(
    (b: { _id: mongoose.Types.ObjectId }) => b._id
  );
  await this.findByIdAndUpdate(
    personId,
    { $set: { businessIds } },
    { session }
  );
};

PersonSchema.post("findOneAndDelete", async function (doc) {
  if (!doc) return;
  const session = this.getOptions()?.session as ClientSession | undefined;
  const personId = doc._id;

  const { Episode } = await import("./Episode.js");

  const { Business } = await import("./Business.js");

  await Episode.updateMany(
    { guestIds: personId },
    { $pull: { guestIds: personId } },
    { session: session ?? undefined }
  );

  await Business.updateMany(
    { $or: [{ ownerIds: personId }, { executives: { personId: personId } }] },
    { $pull: { ownerIds: personId, executives: { personId: personId } } },
    { session: session ?? undefined }
  );
});

export const Person: PersonModel =
  (mongoose.models.Person as PersonModel) ||
  mongoose.model<IPerson, PersonModel>("Person", PersonSchema);
