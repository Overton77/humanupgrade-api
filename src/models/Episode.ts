import mongoose, {
  Schema,
  Document,
  Model,
  HydratedDocument,
  ClientSession,
} from "mongoose";
import { MediaLinkSchema, MediaLink } from "./MediaLink.js";

import {
  TxOpts,
  preloadPrevForPaths,
  diffIdsFromLocals,
  getDocSession,
  cleanupSyncLocals,
} from "./utils/syncLocals.js";

export type TranscriptStatus = "missing" | "queued" | "stored" | "error";
export type PipelineStatus = "not_started" | "running" | "complete" | "error";
export type PublishStatus = "hidden" | "ready";

export interface ITranscriptStorage {
  provider: "s3";
  bucket?: string;
  key?: string;
}

export interface ITranscriptState {
  status: TranscriptStatus;
  storage?: ITranscriptStorage;
  sha256?: string;
  lastAttemptAt?: Date;
  error?: { message: string; at: Date };
}

export interface IStageState {
  status: PipelineStatus;
  completedAt?: Date;
  runId?: string;
  lastAttemptAt?: Date;
  error?: { message: string; at: Date };
}

export interface IEnrichmentState {
  stage1: IStageState;
  stage2: IStageState;
}

export interface IPublishState {
  status: PublishStatus;
  publishedAt?: Date;
}

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

const ErrorInfoSchema = new Schema(
  { message: String, at: Date },
  { _id: false }
);

const TranscriptStorageSchema = new Schema<ITranscriptStorage>(
  {
    provider: { type: String, enum: ["s3"], default: "s3" },
    bucket: String,
    key: String,
  },
  { _id: false }
);

const TranscriptStateSchema = new Schema<ITranscriptState>(
  {
    status: {
      type: String,
      enum: ["missing", "queued", "stored", "error"],
      default: "missing",
      index: true,
    },
    storage: { type: TranscriptStorageSchema, default: undefined },
    sha256: String,
    lastAttemptAt: Date,
    error: { type: ErrorInfoSchema, default: undefined },
  },
  { _id: false }
);

const StageStateSchema = new Schema<IStageState>(
  {
    status: {
      type: String,
      enum: ["not_started", "running", "complete", "error"],
      default: "not_started",
      index: true,
    },
    completedAt: Date,
    runId: String,
    lastAttemptAt: Date,
    error: { type: ErrorInfoSchema, default: undefined },
  },
  { _id: false }
);

const EnrichmentStateSchema = new Schema<IEnrichmentState>(
  {
    stage1: { type: StageStateSchema, default: () => ({}) },
    stage2: { type: StageStateSchema, default: () => ({}) },
  },
  { _id: false }
);

const PublishStateSchema = new Schema<IPublishState>(
  {
    status: {
      type: String,
      enum: ["hidden", "ready"],
      default: "hidden",
      index: true,
    },
    publishedAt: Date,
  },
  { _id: false }
);

export interface IEpisode {
  id: string; // <- now available because of virtual
  channelName: string;
  episodeNumber?: number;
  episodeTitle?: string;
  publishedAt?: Date;
  guestIds: mongoose.Types.ObjectId[];
  protocolIds: mongoose.Types.ObjectId[];
  webPageSummary?: string;
  webPageTimelines?: IWebPageTimeline[];
  mediaLinks?: MediaLink[];
  episodePageUrl?: string;
  episodeTranscriptUrl?: string;
  summaryShort?: string;
  summaryDetailed?: string;
  takeaways: string[];
  publishedSummary?: string;
  s3TranscriptKey?: string;
  youtubeVideoId?: string;
  youtubeEmbedUrl?: string;
  youtubeWatchUrl?: string;
  s3TranscriptUrl?: string;
  sponsorLinkObjects?: ISponsorLinkObject[];
  sponsorBusinessIds: mongoose.Types.ObjectId[];
  businessLinks?: string[];
  transcript: ITranscriptState;
  enrichment: IEnrichmentState;
  publish: IPublishState;
}

export type EpisodeDoc = HydratedDocument<IEpisode>;

// Extend the model interface with our static methods
export interface EpisodeModel extends Model<IEpisode> {}

export const EpisodeSchema = new Schema<IEpisode>(
  {
    channelName: { type: String, rquired: true },
    episodePageUrl: { type: String, unique: true, index: true },
    episodeNumber: { type: Number },
    episodeTitle: { type: String },
    episodeTranscriptUrl: { type: String },
    publishedAt: { type: Date },
    guestIds: [{ type: Schema.Types.ObjectId, ref: "Person" }],
    protocolIds: [{ type: Schema.Types.ObjectId, ref: "Protocol" }],
    summaryShort: { type: String },
    webPageSummary: { type: String },
    mediaLinks: [MediaLinkSchema],
    webPageTimelines: [WebPageTimelineSchema],
    sponsorLinkObjects: [SponsorLinkObjectSchema],
    summaryDetailed: { type: String },
    publishedSummary: { type: String },
    youtubeVideoId: { type: String },
    youtubeWatchUrl: { type: String },
    youtubeEmbedUrl: { type: String },
    takeaways: [{ type: String }],
    s3TranscriptKey: { type: String },
    s3TranscriptUrl: { type: String },
    sponsorBusinessIds: [{ type: Schema.Types.ObjectId, ref: "Business" }],
    businessLinks: [{ type: String }],
    transcript: { type: TranscriptStateSchema, default: () => ({}) },
    enrichment: { type: EnrichmentStateSchema, default: () => ({}) },
    publish: { type: PublishStateSchema, default: () => ({}) },
  },
  { timestamps: true }
);

EpisodeSchema.index({
  "enrichment.stage1.status": 1,
  "enrichment.stage2.status": 1,
});

// -----------------------------------------------------
// 🔥 Add this virtual so id = _id
// -----------------------------------------------------
EpisodeSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

EpisodeSchema.set("toJSON", { virtuals: true });
EpisodeSchema.set("toObject", { virtuals: true });

EpisodeSchema.pre("save", async function (this: EpisodeDoc) {
  await preloadPrevForPaths(this, ["guestIds", "sponsorBusinessIds"]);
});

EpisodeSchema.post("save", async function (doc: EpisodeDoc) {
  const session = getDocSession(doc);

  // --- guestIds -> Person mirror
  {
    const { touched, allIdStrings } = diffIdsFromLocals(doc, "guestIds");
    if (touched) {
      const { Person } = await import("./Person.js");
      for (const idStr of allIdStrings) {
        await Person.syncEpisodesForPerson(new mongoose.Types.ObjectId(idStr), {
          session,
        });
      }
    }
  }

  // --- sponsorBusinessIds -> Business mirror
  {
    const { touched, allIdStrings } = diffIdsFromLocals(
      doc,
      "sponsorBusinessIds"
    );
    if (touched) {
      const { Business } = await import("./Business.js");
      for (const idStr of allIdStrings) {
        await Business.syncSponsorEpisodesForBusiness(
          new mongoose.Types.ObjectId(idStr),
          { session }
        );
      }
    }
  }

  // Optional cleanup
  cleanupSyncLocals(doc, ["guestIds", "sponsorBusinessIds"]);
});

EpisodeSchema.post("findOneAndDelete", async function (doc: EpisodeDoc | null) {
  if (!doc) return;

  const session = this.getOptions()?.session as ClientSession | undefined;
  const episodeId = doc._id;

  const { Person } = await import("./Person.js");
  const { Business } = await import("./Business.js");
  const { CaseStudy } = await import("./CaseStudy.js");

  await CaseStudy.updateMany(
    { episodeIds: episodeId },
    { $pull: { episodeIds: episodeId } },
    { session }
  );

  // 2) Mirror recomputes
  const guestIds = Array.from(
    new Set((doc.guestIds ?? []).map((id) => id.toString()))
  ).map((s) => new mongoose.Types.ObjectId(s));

  for (const personId of guestIds) {
    await Person.syncEpisodesForPerson(personId, { session });
  }

  const sponsorIds = Array.from(
    new Set((doc.sponsorBusinessIds ?? []).map((id) => id.toString()))
  ).map((s) => new mongoose.Types.ObjectId(s));

  for (const businessId of sponsorIds) {
    await Business.syncSponsorEpisodesForBusiness(businessId, { session });
  }
});

export const Episode: EpisodeModel =
  (mongoose.models.Episode as EpisodeModel) ||
  mongoose.model<IEpisode, EpisodeModel>("Episode", EpisodeSchema, "episodes");
