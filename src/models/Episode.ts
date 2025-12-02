import mongoose, { Schema, Document, Model, HydratedDocument } from "mongoose";
import { MediaLinkSchema, MediaLink } from "./MediaLink.js";
// TODO: Create the ModelDoc HydratedDocument<IModelType>
export interface IWebPageTimeline {
  from: string;
  to: string;
  title?: string;
  description?: string;
}

export interface ISponsorLinkObject {
  text?: string;
  links?: string[];
  hasCodeDave?: boolean;
  code?: string;
  brand?: string;
  discountPercent?: number;
}

const SponsorLinkObjectSchema = new Schema<ISponsorLinkObject>(
  {
    text: String,
    links: [String],
    hasCodeDave: Boolean,
    code: String,
    brand: String,
    discountPercent: Number,
  },
  { _id: false }
);

const WebPageTimelineSchema = new Schema<IWebPageTimeline>(
  {
    from: String,
    to: String,
    title: String,
    description: String,
  },
  { _id: false }
);

export interface IEpisode extends Document {
  id: string; // <- now available because of virtual
  channelName: string;
  episodeNumber?: number;
  episodeTitle?: string;
  publishedAt?: Date;
  guestIds: mongoose.Types.ObjectId[];
  webPageSummary?: string;
  webPageTimelines?: IWebPageTimeline[];
  mediaLinks?: MediaLink[];
  episodePageUrl?: string;
  episodeTranscriptUrl?: string;
  summaryShort?: string;
  summaryDetailed?: string;
  takeaways: string[];
  s3TranscriptKey?: string;
  youtubeVideoId?: string;
  youtubeEmbedUrl?: string;
  youtubeWatchUrl?: string;
  s3TranscriptUrl?: string;
  sponsorLinkObjects?: ISponsorLinkObject[];
  sponsorBusinessIds: mongoose.Types.ObjectId[];
}

export type EpisodeDoc = HydratedDocument<IEpisode>;

// Extend the model interface with our static methods
export interface EpisodeModel extends Model<IEpisode> {
  syncGuestLinks(episode: EpisodeDoc): Promise<void>;
  syncSponsorBusinessesForEpisode(
    episodeId: mongoose.Types.ObjectId
  ): Promise<void>;
}

export const EpisodeSchema = new Schema<IEpisode>(
  {
    channelName: { type: String, rquired: true },
    episodePageUrl: { type: String, unique: true, index: true },
    episodeNumber: { type: Number },
    episodeTitle: { type: String },
    episodeTranscriptUrl: { type: String },
    publishedAt: { type: Date },
    guestIds: [{ type: Schema.Types.ObjectId, ref: "Person" }],
    summaryShort: { type: String },
    webPageSummary: { type: String },
    mediaLinks: [MediaLinkSchema],
    webPageTimelines: [WebPageTimelineSchema],
    sponsorLinkObjects: [SponsorLinkObjectSchema],
    summaryDetailed: { type: String },
    youtubeVideoId: { type: String },
    youtubeWatchUrl: { type: String },
    youtubeEmbedUrl: { type: String },
    takeaways: [{ type: String }],
    s3TranscriptKey: { type: String },
    s3TranscriptUrl: { type: String },
    sponsorBusinessIds: [{ type: Schema.Types.ObjectId, ref: "Business" }],
  },
  { timestamps: true }
);

// -----------------------------------------------------
// 🔥 Add this virtual so id = _id
// -----------------------------------------------------
EpisodeSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

EpisodeSchema.set("toJSON", { virtuals: true });
EpisodeSchema.set("toObject", { virtuals: true });

/**
 * Sync Episode.sponsorBusinessIds based on Businesses that reference this episode
 */
EpisodeSchema.statics.syncGuestLinks = async function (
  episode: EpisodeDoc
): Promise<void> {
  const { Person } = await import("./Person.js");
  const episodeId = episode._id;

  // guests currently on this episode
  const guestIds = (episode.guestIds ?? []).map((id) => id.toString());

  // 1) Ensure these guests have this episode in their episodeIds
  if (guestIds.length > 0) {
    await Person.updateMany(
      { _id: { $in: guestIds } },
      { $addToSet: { episodeIds: episodeId } }
    );
  }

  // 2) Remove this episode from any Person that is *not* a guest anymore
  await Person.updateMany(
    {
      episodeIds: episodeId,
      _id: { $nin: guestIds },
    },
    { $pull: { episodeIds: episodeId } }
  );
};

EpisodeSchema.statics.syncSponsorBusinessesForEpisode = async function (
  episodeId: mongoose.Types.ObjectId
): Promise<void> {
  const { Business } = await import("./Business.js");

  // 1) Find all businesses that list this episode in their sponsorEpisodeIds
  const businesses = await Business.find({
    sponsorEpisodeIds: episodeId,
  }).select("_id");

  const sponsorBusinessIds = businesses.map(
    (b: { _id: mongoose.Types.ObjectId }) => b._id
  );

  // 2) Update the Episode with the full list of sponsorBusinessIds
  await this.findByIdAndUpdate(
    episodeId,
    { $set: { sponsorBusinessIds } },
    { new: false }
  );
};

EpisodeSchema.pre("save", function (this: HydratedDocument<IEpisode>) {
  const self = this as HydratedDocument<IEpisode> & { $locals?: any };

  if (this.isModified("sponsorBusinessIds")) {
    self.$locals = self.$locals || {};
    self.$locals.previousSponsorBusinessIds = this.get(
      "sponsorBusinessIds",
      [],
      { getters: false }
    ) as mongoose.Types.ObjectId[];
  }
});

EpisodeSchema.post<EpisodeDoc>(
  "save",
  async function (this: HydratedDocument<IEpisode>, doc) {
    const self = this as HydratedDocument<IEpisode> & { $locals?: any };

    const oldIds: mongoose.Types.ObjectId[] =
      (self.$locals?.previousSponsorBusinessIds as mongoose.Types.ObjectId[]) ??
      [];
    const newIds: mongoose.Types.ObjectId[] = doc.sponsorBusinessIds ?? [];

    const allBusinessIds = new Set<string>([
      ...oldIds.map((id) => id.toString()),
      ...newIds.map((id) => id.toString()),
    ]);

    const { Business } = await import("./Business.js");

    for (const idStr of allBusinessIds) {
      await Business.syncSponsorEpisodesForBusiness(
        new mongoose.Types.ObjectId(idStr)
      );
    }
  }
);

EpisodeSchema.post("findOneAndDelete", async function (doc) {
  if (!doc?.sponsorBusinessIds?.length) return;
  const { Business } = await import("./Business.js");

  for (const businessId of doc.sponsorBusinessIds) {
    await Business.syncSponsorEpisodesForBusiness(businessId);
  }
});

EpisodeSchema.post("save", async function (doc) {
  const episodeDoc = doc as EpisodeDoc;

  // Only sync if guests changed
  if (this.isModified("guestIds")) {
    // optional: check a $locals.skipGuestSync flag if you ever need to avoid loops
    if (!this.$locals?.skipGuestSync) {
      await Episode.syncGuestLinks(episodeDoc);
    }
  }
});

EpisodeSchema.post("findOneAndDelete", async function (doc) {
  if (!doc) return;
  const episodeDoc = doc as EpisodeDoc;

  const { Business } = await import("./Business.js");
  const { Person } = await import("./Person.js");
  const { User } = await import("./User.js");
  const { CaseStudy } = await import("./CaseStudy.js"); // optional, see below

  // 1) Update Business.sponsorEpisodeIds mirror if you keep that cache
  if (episodeDoc.sponsorBusinessIds && episodeDoc.sponsorBusinessIds.length) {
    for (const businessId of episodeDoc.sponsorBusinessIds) {
      await Business.syncSponsorEpisodesForBusiness(businessId);
    }
  }

  // 2) Clean up Person.episodeIds if you're using Episode.syncGuestLinks
  await Person.updateMany(
    { episodeIds: episodeDoc._id },
    { $pull: { episodeIds: episodeDoc._id } }
  );

  // 3) Remove from User.savedEpisodes
  await User.updateMany(
    { savedEpisodes: episodeDoc._id },
    { $pull: { savedEpisodes: episodeDoc._id } }
  );

  // 4) Optional: remove this episode from CaseStudy.episodeIds
  await CaseStudy.updateMany(
    { episodeIds: episodeDoc._id },
    { $pull: { episodeIds: episodeDoc._id } }
  );
});

export const Episode: EpisodeModel =
  (mongoose.models.Episode as EpisodeModel) ||
  mongoose.model<IEpisode, EpisodeModel>("Episode", EpisodeSchema, "episodes");
