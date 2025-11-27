import mongoose, { Schema, type Model, type HydratedDocument } from "mongoose";
import { MediaLinkSchema, type MediaLink } from "./MediaLink";

// --- Executive subdocument ---

export interface IBusinessExecutive {
  personId: mongoose.Types.ObjectId;
  title?: string;
  role?: string; // e.g. "CEO", "Founder", etc.
}

const BusinessExecutiveSchema = new Schema<IBusinessExecutive>(
  {
    personId: {
      type: Schema.Types.ObjectId,
      ref: "Person",
      required: true,
    },
    title: { type: String },
    role: { type: String },
  },
  { _id: false }
);

// --- Business document (plain data shape) ---

export interface IBusiness {
  name: string;
  description?: string;
  website?: string;
  mediaLinks?: MediaLink[];
  ownerIds: mongoose.Types.ObjectId[];
  productIds: mongoose.Types.ObjectId[];
  executives: IBusinessExecutive[];
  sponsorEpisodeIds: mongoose.Types.ObjectId[];
}

// Hydrated Mongoose document type
export type BusinessDoc = HydratedDocument<IBusiness>;

// We'll extend the model type to add static methods
export interface BusinessModel extends Model<IBusiness> {
  syncPersonLinks(business: BusinessDoc): Promise<void>;
  syncSponsorEpisodesForBusiness(
    businessId: mongoose.Types.ObjectId
  ): Promise<void>;
}

const BusinessSchema = new Schema<IBusiness, BusinessModel>(
  {
    name: { type: String, unique: true, required: true },
    description: { type: String },
    website: { type: String },
    mediaLinks: [MediaLinkSchema],
    ownerIds: [{ type: Schema.Types.ObjectId, ref: "Person" }],
    productIds: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    executives: [BusinessExecutiveSchema],
    sponsorEpisodeIds: [{ type: Schema.Types.ObjectId, ref: "Episode" }],
  },
  { timestamps: true }
);

// --- Static: keep Person.businessIds in sync with Business.ownerIds + executives ---

BusinessSchema.statics.syncPersonLinks = async function (
  business: BusinessDoc
): Promise<void> {
  const businessId = business._id;
  const { Person } = await import("./Person");

  // 1) Compute the set of people who should be linked to this business:
  //    owners U executives
  const ownerIds = business.ownerIds?.map((id) => id.toString()) ?? [];
  const execPersonIds =
    business.executives?.map((exec) => exec.personId.toString()) ?? [];

  const keepSet = new Set<string>([...ownerIds, ...execPersonIds]);
  const keepIds = Array.from(keepSet);

  // 2) Ensure these people have the business in their businessIds
  if (keepIds.length > 0) {
    await Person.updateMany(
      { _id: { $in: keepIds } },
      { $addToSet: { businessIds: businessId } }
    );
  }

  // 3) Detach the business from any Person who no longer appears
  //    as owner or executive.
  await Person.updateMany(
    {
      businessIds: businessId,
      _id: { $nin: keepIds },
    },
    { $pull: { businessIds: businessId } }
  );
};

/**
 * Sync Business.sponsorEpisodeIds based on Episodes that reference this business
 */
BusinessSchema.statics.syncSponsorEpisodesForBusiness = async function (
  businessId: mongoose.Types.ObjectId
): Promise<void> {
  const { Episode } = await import("./Episode");

  // Find all episodes that reference this business as sponsor
  const episodes = await Episode.find({
    sponsorBusinessIds: businessId,
  }).select("_id");
  const episodeIds = episodes.map(
    (e: { _id: mongoose.Types.ObjectId }) => e._id
  );

  await this.findByIdAndUpdate(
    businessId,
    { sponsorEpisodeIds: episodeIds },
    { new: false }
  );
};

// --- Query Middleware (Safety Net) ---

/**
 * Post-save hook: Auto-sync person links if ownership/executives changed
 * This is a safety net in case service layer forgets to call syncPersonLinks
 */
BusinessSchema.post("save", async function (doc) {
  const businessDoc = doc as BusinessDoc;

  // Only sync if ownership or executives changed
  if (this.isModified("ownerIds") || this.isModified("executives")) {
    // Check for skipSync flag to prevent infinite loops
    if (!this.$locals.skipSync) {
      await Business.syncPersonLinks(businessDoc);
    }
  }

  // Sync episodes when sponsorEpisodeIds change
  if (this.isModified("sponsorEpisodeIds")) {
    const { Episode } = await import("./Episode");
    // Sync all affected episodes
    for (const episodeId of businessDoc.sponsorEpisodeIds) {
      await Episode.syncSponsorBusinessesForEpisode(episodeId);
    }
  }
});

/**
 * Post-delete hook: Clean up person links and episode relationships when business is deleted
 */
BusinessSchema.post("findOneAndDelete", async function (doc) {
  if (doc) {
    const businessDoc = doc as BusinessDoc;

    // Remove this business from all people
    const { Person } = await import("./Person");
    await Person.updateMany(
      { businessIds: businessDoc._id },
      { $pull: { businessIds: businessDoc._id } }
    );

    // Clean up episode references
    if (
      businessDoc.sponsorEpisodeIds &&
      businessDoc.sponsorEpisodeIds.length > 0
    ) {
      const { Episode } = await import("./Episode");
      for (const episodeId of businessDoc.sponsorEpisodeIds) {
        await Episode.syncSponsorBusinessesForEpisode(episodeId);
      }
    }
  }
});

export const Business: BusinessModel =
  (mongoose.models.Business as BusinessModel) ||
  mongoose.model<IBusiness, BusinessModel>("Business", BusinessSchema);
