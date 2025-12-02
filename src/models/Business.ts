import mongoose, {
  Schema,
  type Model,
  type HydratedDocument,
  type Document,
} from "mongoose";
import { MediaLinkSchema, type MediaLink } from "./MediaLink.js";

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

export interface IBusiness extends Document {
  id: string; // <- now available because of virtual
  name: string;
  description?: string;
  biography?: string;
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
  syncProductsForBusiness(businessId: mongoose.Types.ObjectId): Promise<void>;
}

const BusinessSchema = new Schema<IBusiness, BusinessModel>(
  {
    name: { type: String, unique: true, required: true },
    description: { type: String },
    biography: { type: String },
    website: { type: String },
    mediaLinks: [MediaLinkSchema],
    ownerIds: [{ type: Schema.Types.ObjectId, ref: "Person" }],
    productIds: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    executives: [BusinessExecutiveSchema],
    sponsorEpisodeIds: [{ type: Schema.Types.ObjectId, ref: "Episode" }],
  },
  { timestamps: true }
);

// -----------------------------------------------------
// 🔥 Add this virtual so id = _id
// -----------------------------------------------------
BusinessSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

BusinessSchema.set("toJSON", { virtuals: true });
BusinessSchema.set("toObject", { virtuals: true });

// --- Static: keep Person.businessIds in sync with Business.ownerIds + executives ---

BusinessSchema.statics.syncProductsForBusiness = async function (
  business: BusinessDoc
): Promise<void> {
  const { Product } = await import("./Product.js");

  const products = await Product.find({ businessId: business._id }).select(
    "_id"
  );

  const productIds = products.map((p) => p._id);

  await Product.updateMany(
    { _id: { $in: productIds } },

    { $set: { businessId: business._id } }
  );
};

BusinessSchema.statics.syncPersonLinks = async function (
  business: BusinessDoc
): Promise<void> {
  const businessId = business._id;
  const { Person } = await import("./Person.js");

  const ownerIds = business.ownerIds?.map((id) => id.toString()) ?? [];
  const execPersonIds =
    business.executives?.map((exec) => exec.personId.toString()) ?? [];

  const keepSet = new Set([...ownerIds, ...execPersonIds]);
  const keepIds = Array.from(keepSet);

  if (keepIds.length > 0) {
    await Person.updateMany(
      { _id: { $in: keepIds } },
      { $addToSet: { businessIds: businessId } }
    );
  }

  await Person.updateMany(
    {
      businessIds: businessId,
      _id: { $nin: keepIds },
    },
    { $pull: { businessIds: businessId } }
  );
};

BusinessSchema.statics.syncSponsorEpisodesForBusiness = async function (
  businessId: mongoose.Types.ObjectId
): Promise<void> {
  const { Episode } = await import("./Episode.js");

  const episodes = await Episode.find({
    sponsorBusinessIds: businessId,
  }).select("_id");

  const episodeIds = episodes.map(
    (e: { _id: mongoose.Types.ObjectId }) => e._id
  );

  await this.findByIdAndUpdate(
    businessId,
    { $set: { sponsorEpisodeIds: episodeIds } },
    { new: false }
  );
};

BusinessSchema.post("save", async function (doc) {
  const businessDoc = doc as BusinessDoc;

  if (this.isModified("ownerIds") || this.isModified("executives")) {
    if (!this.$locals?.skipSync) {
      await Business.syncPersonLinks(businessDoc);
    }
  }
});

/**
 * Post-delete hook: Clean up person links and episode relationships when business is deleted
 */
BusinessSchema.post("findOneAndDelete", async function (doc) {
  if (!doc) return;
  const businessDoc = doc as BusinessDoc;

  const { Person } = await import("./Person.js");
  const { Episode } = await import("./Episode.js");
  const { User } = await import("./User.js");

  // 1) Remove this business from all people (mirror cleanup)
  await Person.updateMany(
    { businessIds: businessDoc._id },
    { $pull: { businessIds: businessDoc._id } }
  );

  // 2) For sponsor episodes, resync their Business.sponsorEpisodeIds mirror
  if (
    businessDoc.sponsorEpisodeIds &&
    businessDoc.sponsorEpisodeIds.length > 0
  ) {
    for (const episodeId of businessDoc.sponsorEpisodeIds) {
      await Episode.syncSponsorBusinessesForEpisode(episodeId);
    }
  }

  // 3) Remove from all users' savedBusinesses
  await User.updateMany(
    { savedBusinesses: businessDoc._id },
    { $pull: { savedBusinesses: businessDoc._id } }
  );
});

export const Business: BusinessModel =
  (mongoose.models.Business as BusinessModel) ||
  mongoose.model<IBusiness, BusinessModel>("Business", BusinessSchema);
