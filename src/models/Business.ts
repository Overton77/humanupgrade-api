import mongoose, {
  Schema,
  type Model,
  type HydratedDocument,
  type Document,
  ClientSession,
} from "mongoose";
import { MediaLinkSchema, type MediaLink } from "./MediaLink.js";
import {
  TxOpts,
  getDocSession,
  preloadPrevForPaths,
  diffIdsFromLocals,
  cleanupSyncLocals,
} from "./utils/syncLocals.js";
import { pullFromUsersSaved } from "./utils/usedSavedCleanup.js";

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
  descriptionEmbedding?: number[];
  embeddingUpdatedAt?: Date;
  website?: string;
  mediaLinks?: MediaLink[];
  ownerIds: mongoose.Types.ObjectId[];
  productIds: mongoose.Types.ObjectId[];
  // mirrors
  executives: IBusinessExecutive[];
  sponsorEpisodeIds: mongoose.Types.ObjectId[];
}

// Hydrated Mongoose document type
export type BusinessDoc = HydratedDocument<IBusiness>;

// We'll extend the model type to add static methods
export interface BusinessModel extends Model<IBusiness> {
  syncProductsForBusiness(
    businessId: mongoose.Types.ObjectId,
    opts?: TxOpts
  ): Promise<void>;
  syncSponsorEpisodesForBusiness(
    businessId: mongoose.Types.ObjectId,
    opts?: TxOpts
  ): Promise<void>;
}

const BusinessSchema = new Schema<IBusiness, BusinessModel>(
  {
    name: { type: String, unique: true, required: true },
    description: { type: String },
    biography: { type: String },
    descriptionEmbedding: { type: [Number], default: undefined },
    embeddingUpdatedAt: { type: Date },
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

/**
 * Mirror: Business.productIds <- Products where product.businessId == businessId
 * Canonical: Product.businessId
 */
BusinessSchema.statics.syncProductsForBusiness = async function (
  businessId,
  opts
) {
  const { Product } = await import("./Product.js");

  const products = await Product.find({ businessId })
    .select("_id")
    .lean()
    .session(opts?.session ?? null);

  const productIds = products.map((p: any) => p._id);

  await this.updateOne(
    { _id: businessId },
    { $set: { productIds } },
    { session: opts?.session }
  );
};

/**
 * Mirror: Business.sponsorEpisodeIds <- Episodes where episode.sponsorBusinessIds contains businessId
 * Canonical: Episode.sponsorBusinessIds
 */
BusinessSchema.statics.syncSponsorEpisodesForBusiness = async function (
  businessId,
  opts
) {
  const { Episode } = await import("./Episode.js");

  const episodes = await Episode.find({ sponsorBusinessIds: businessId })
    .select("_id")
    .lean()
    .session(opts?.session ?? null);

  const episodeIds = episodes.map((e: any) => e._id);

  await this.updateOne(
    { _id: businessId },
    { $set: { sponsorEpisodeIds: episodeIds } },
    { session: opts?.session }
  );
};

BusinessSchema.pre("save", async function (this: BusinessDoc) {
  await preloadPrevForPaths(this, ["ownerIds", "executives.personId"]);
});

BusinessSchema.post("save", async function (doc: BusinessDoc) {
  const session = getDocSession(doc);

  {
    const { touched, allIdStrings } = diffIdsFromLocals(doc, "ownerIds");

    if (touched) {
      const { Person } = await import("./Person.js");

      for (const idStr of allIdStrings) {
        await Person.syncBusinessesForPerson(
          new mongoose.Types.ObjectId(idStr),
          {
            session,
          }
        );
      }
    }
  }

  {
    const { touched, allIdStrings } = diffIdsFromLocals(
      doc,
      "executives.personId"
    );

    if (touched) {
      const { Person } = await import("./Person.js");

      for (const idStr of allIdStrings) {
        await Person.syncBusinessesForPerson(
          new mongoose.Types.ObjectId(idStr),
          {
            session,
          }
        );
      }
    }
  }

  cleanupSyncLocals(doc, ["ownerIds", "executives.personId"]);
});

/**
 * Post-delete hook: Clean up person links and episode relationships when business is deleted
 */

BusinessSchema.post(
  "findOneAndDelete",
  async function (doc: BusinessDoc | null) {
    if (!doc) return;
    const session = this.getOptions()?.session as ClientSession | undefined;
    const businessId = doc._id;
    const { User } = await import("./User.js");
    const { Episode } = await import("./Episode.js");
    const { Person } = await import("./Person.js");
    await pullFromUsersSaved(User, "savedBusinesses", businessId, session);

    await Episode.updateMany(
      { sponsorBusinessIds: businessId },
      { $pull: { sponsorBusinessIds: businessId } },
      { session: session }
    );

    await Person.updateMany(
      { businessIds: businessId },
      { $pull: { businessIds: businessId } },
      { session: session }
    );

    // TODO Handle if I want to archive a business product or delete them all
  }
);

export const Business: BusinessModel =
  (mongoose.models.Business as BusinessModel) ||
  mongoose.model<IBusiness, BusinessModel>("Business", BusinessSchema);
