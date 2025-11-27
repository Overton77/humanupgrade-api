import mongoose, { Schema, Document, Model } from "mongoose";
import { MediaLinkSchema, MediaLink } from "./MediaLink";

export interface IWebPageTimeline {
  from: string;
  to: string;
  description: string;
}

const WebPageTimelineSchema = new Schema<IWebPageTimeline>(
  {
    from: String,
    to: String,
    description: String,
  },
  { _id: false }
);

export interface IEpisode extends Document {
  title: string;
  number: number;
  publishedAt?: Date;
  guestIds: mongoose.Types.ObjectId[];
  webPageSummary?: string;
  webPagTimelines?: IWebPageTimeline[];
  mediaLinks?: MediaLink[];

  summaryShort?: string;
  summaryDetailed?: string;
  takeaways: string[];
  s3TranscriptKey?: string;
  youtubeVideoId?: string;
  youtubeUrl?: string;
  sponsorBusinessIds: mongoose.Types.ObjectId[];
}

// Extend the model interface with our static methods
export interface EpisodeModel extends Model<IEpisode> {
  syncSponsorBusinessesForEpisode(
    episodeId: mongoose.Types.ObjectId
  ): Promise<void>;
}

const EpisodeSchema = new Schema<IEpisode>(
  {
    title: { type: String, required: true },
    number: { type: Number, required: true, unique: true },
    publishedAt: { type: Date },
    guestIds: [{ type: Schema.Types.ObjectId, ref: "Person" }],
    summaryShort: { type: String },
    webPageSummary: { type: String },
    mediaLinks: [MediaLinkSchema],
    webPagTimelines: [WebPageTimelineSchema],
    summaryDetailed: { type: String },
    youtubeVideoId: { type: String },
    youtubeUrl: { type: String },
    takeaways: [{ type: String }],
    s3TranscriptKey: { type: String },
    sponsorBusinessIds: [{ type: Schema.Types.ObjectId, ref: "Business" }],
  },
  { timestamps: true }
);

/**
 * Sync Episode.sponsorBusinessIds based on Businesses that reference this episode
 */
EpisodeSchema.statics.syncSponsorBusinessesForEpisode = async function (
  episodeId: mongoose.Types.ObjectId
): Promise<void> {
  const { Business } = await import("./Business");

  // Find all businesses that reference this episode as sponsor
  const businesses = await Business.find({
    sponsorEpisodeIds: episodeId,
  }).select("_id");
  const businessIds = businesses.map((b: any) => b._id);

  await this.findByIdAndUpdate(
    episodeId,
    { sponsorBusinessIds: businessIds },
    { new: false }
  );
};

// --- Query Middleware (Safety Net) ---

/**
 * Post-save hook: Auto-sync business relationships when sponsorBusinessIds change
 * This is a safety net in case service layer forgets to call sync methods
 */
EpisodeSchema.post("save", async function (doc) {
  // Sync businesses when sponsorBusinessIds change
  if (this.isModified("sponsorBusinessIds")) {
    const { Business } = await import("./Business");
    // Sync all affected businesses
    for (const businessId of this.sponsorBusinessIds) {
      await Business.syncSponsorEpisodesForBusiness(businessId);
    }
  }
});

/**
 * Post-delete hook: Clean up business relationships when episode is deleted
 */
EpisodeSchema.post("findOneAndDelete", async function (doc) {
  if (doc && doc.sponsorBusinessIds && doc.sponsorBusinessIds.length > 0) {
    const { Business } = await import("./Business");
    // Clean up references in all sponsor businesses
    for (const businessId of doc.sponsorBusinessIds) {
      await Business.syncSponsorEpisodesForBusiness(businessId);
    }
  }
});

export const Episode: EpisodeModel =
  (mongoose.models.Episode as EpisodeModel) ||
  mongoose.model<IEpisode, EpisodeModel>("Episode", EpisodeSchema);
