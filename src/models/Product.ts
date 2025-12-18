import mongoose, {
  Schema,
  HydratedDocument,
  Model,
  ClientSession,
} from "mongoose";
import { MediaLinkSchema, MediaLink } from "./MediaLink.js";
import {
  TxOpts,
  getDocSession,
  preloadPrevForPaths,
  diffIdsFromLocals,
  cleanupSyncLocals,
} from "./utils/syncLocals.js";
import { pullFromUsersSaved } from "./utils/usedSavedCleanup.js";

export interface IProduct {
  id: string; // <- now available because of virtual
  name: string;
  businessId: mongoose.Types.ObjectId;
  descriptionEmbedding?: number[];
  embeddingUpdatedAt?: Date;
  description?: string;
  ingredients: string[];
  protocolIds: mongoose.Types.ObjectId[];
  mediaLinks?: MediaLink[];
  price?: number;
  sponsorEpisodes: mongoose.Types.ObjectId[];
  sourceUrl?: string;
  compoundIds: mongoose.Types.ObjectId[];
}

export type ProductDoc = HydratedDocument<IProduct>;

// Extend the model interface with our static methods
export interface ProductModel extends Model<IProduct> {
  syncProtocolsForProduct(
    productId: mongoose.Types.ObjectId,
    opts?: TxOpts
  ): Promise<void>;
}

const ProductSchema = new Schema<IProduct, ProductModel>(
  {
    name: { type: String, unique: true, required: true },
    businessId: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      required: true,
    },
    protocolIds: [{ type: Schema.Types.ObjectId, ref: "Protocol" }],
    descriptionEmbedding: { type: [Number], default: undefined },
    embeddingUpdatedAt: { type: Date },
    mediaLinks: [MediaLinkSchema],
    description: { type: String },
    ingredients: [{ type: String }],
    price: [{ type: Number }],
    sourceUrl: { type: String },
    compoundIds: [{ type: Schema.Types.ObjectId, ref: "Compound" }],
  },
  { timestamps: true }
);

// -----------------------------------------------------
// 🔥 Add this virtual so id = _id
// -----------------------------------------------------
ProductSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

ProductSchema.set("toJSON", { virtuals: true });
ProductSchema.set("toObject", { virtuals: true });

ProductSchema.statics.syncProtocolsForProduct = async function (
  productId: mongoose.Types.ObjectId,
  opts?: TxOpts
): Promise<void> {
  const { Protocol } = await import("./Protocol.js");

  const protocols = await Protocol.find({ productIds: productId })
    .select("_id")
    .lean()
    .session(opts?.session ?? null);
  const protocolIds = protocols.map(
    (p: { _id: mongoose.Types.ObjectId }) => p._id
  );

  await this.findByIdAndUpdate(
    productId,
    { $set: { protocolIds } },
    { session: opts?.session }
  );
};

ProductSchema.pre("save", async function (this: ProductDoc) {
  await preloadPrevForPaths(this, ["businessId", "compoundIds"]);
});

// POST: run syncProductsForBusiness for old + new business as needed
ProductSchema.post("save", async function (doc: ProductDoc) {
  const session = getDocSession(doc);

  {
    const { touched, allIdStrings } = diffIdsFromLocals(doc, "businessId");

    if (touched) {
      const { Business } = await import("./Business.js");

      for (const idStr of allIdStrings) {
        await Business.syncProductsForBusiness(
          new mongoose.Types.ObjectId(idStr),
          {
            session,
          }
        );
      }
    }
  }

  {
    const { touched, allIdStrings } = diffIdsFromLocals(doc, "compoundIds");

    if (touched) {
      const { Compound } = await import("./Compound.js");

      for (const idStr of allIdStrings) {
        await Compound.syncProductsForCompound(
          new mongoose.Types.ObjectId(idStr),
          { session }
        );
      }
    }
  }

  cleanupSyncLocals(doc, ["businessId", "compoundIds"]);
});

ProductSchema.post("findOneAndDelete", async function (doc: ProductDoc | null) {
  if (!doc) return;

  const session = this.getOptions()?.session as ClientSession | undefined;

  const { User } = await import("./User.js");
  const { Business } = await import("./Business.js");
  const { Protocol } = await import("./Protocol.js");
  const { CaseStudy } = await import("./CaseStudy.js");
  const { Compound } = await import("./Compound.js");

  // 1) One-way bookmarks: OK to pull
  await pullFromUsersSaved(User, "savedProducts", doc._id, session);

  // 2) One-way references: OK to pull (if you have these fields)
  await CaseStudy.updateMany(
    { productIds: doc._id },
    { $pull: { productIds: doc._id } },
    { session }
  );

  // 3) Canonical cleanup: Protocol owns truth for protocolIds<->productIds
  await Protocol.updateMany(
    { productIds: doc._id },
    { $pull: { productIds: doc._id } },
    { session }
  );

  // 4) Mirror recomputes (do NOT $pull mirrors)
  // Business.productIds mirrors Product.businessId
  if (doc.businessId) {
    await Business.syncProductsForBusiness(doc.businessId, { session });
  }

  // Compound.productIds mirrors Product.compoundIds
  const compoundIds = doc.compoundIds ?? [];
  for (const compoundId of compoundIds) {
    await Compound.syncProductsForCompound(compoundId, { session });
  }
});

export const Product: ProductModel =
  (mongoose.models.Product as ProductModel) ||
  mongoose.model<IProduct, ProductModel>("Product", ProductSchema);
