import mongoose, { Schema, HydratedDocument, Document, Model } from "mongoose";
import { MediaLinkSchema, MediaLink } from "./MediaLink.js";

export interface IProduct extends Document {
  id: string; // <- now available because of virtual
  name: string;
  businessId: mongoose.Types.ObjectId;
  description?: string;
  ingredients: string[];
  mediaLinks?: MediaLink[];
  sponsorEpisodes: mongoose.Types.ObjectId[];
  sourceUrl?: string;
  compoundIds: mongoose.Types.ObjectId[];
  episodeIds: mongoose.Types.ObjectId[];
}

// Extend the model interface with our static methods
export interface ProductModel extends Model<IProduct> {
  syncProductsForBusiness(businessId: mongoose.Types.ObjectId): Promise<void>;
  syncCompoundsForProduct(productId: mongoose.Types.ObjectId): Promise<void>;
}

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, unique: true, required: true },
    businessId: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      required: true,
    },
    mediaLinks: [MediaLinkSchema],
    description: { type: String },
    ingredients: [{ type: String }],
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

ProductSchema.statics.syncProductsForBusiness = async function (
  businessId: mongoose.Types.ObjectId
): Promise<void> {
  const { Business } = await import("./Business.js");
  if (!businessId) return;

  const products = await this.find({ businessId }).select("_id");
  const productIds = products.map((p: IProduct) => p._id);

  await Business.findByIdAndUpdate(
    businessId,
    { $set: { productIds } },
    { new: false }
  );
};

/**
 * Sync Product.compoundIds based on Compounds that reference this product
 */
ProductSchema.statics.syncCompoundsForProduct = async function (
  productId: mongoose.Types.ObjectId
): Promise<void> {
  const { Compound } = await import("./Compound.js");

  // Find all compounds that reference this product
  const compounds = await Compound.find({ productIds: productId }).select(
    "_id"
  );
  const compoundIds = compounds.map((c: any) => c._id);

  await this.findByIdAndUpdate(productId, { compoundIds }, { new: false });
};

// TODO: combine the middlewares

ProductSchema.pre("save", async function (this: HydratedDocument<IProduct>) {
  const self = this as HydratedDocument<IProduct> & { $locals?: any };

  // For new docs there is no "old" businessId, so nothing to capture.
  if (self.isNew || !self.isModified("businessId")) {
    return;
  }

  self.$locals = self.$locals || {};

  // Look up the existing document to get the previous businessId from DB
  const existing = await (self.constructor as ProductModel)
    .findById(self._id)
    .select("businessId")
    .lean();

  self.$locals.previousBusinessId = existing?.businessId || null;
});

// POST: run syncProductsForBusiness for old + new business as needed
ProductSchema.post("save", async function (doc: IProduct) {
  const self = this as HydratedDocument<IProduct> & { $locals?: any };
  const Product = this.constructor as ProductModel;

  const oldBusinessId = self.$locals?.previousBusinessId as
    | mongoose.Types.ObjectId
    | null
    | undefined;
  const newBusinessId = doc.businessId as mongoose.Types.ObjectId | undefined;

  // 1) Always sync the new business if present
  if (newBusinessId) {
    await Product.syncProductsForBusiness(newBusinessId);
  }

  // 2) If there was a different old business, sync that one too
  if (
    oldBusinessId &&
    newBusinessId &&
    oldBusinessId instanceof mongoose.Types.ObjectId &&
    !oldBusinessId.equals(newBusinessId)
  ) {
    await Product.syncProductsForBusiness(oldBusinessId);
  }
});

ProductSchema.post("findOneAndDelete", async function (doc: IProduct | null) {
  if (doc?.businessId) {
    await (this.model as typeof Product).syncProductsForBusiness(
      doc.businessId
    );
  }
});

ProductSchema.post("findOneAndDelete", async function (doc: IProduct | null) {
  if (!doc) return;

  const { User } = await import("./User.js");

  await User.updateMany(
    { savedProducts: doc._id },
    { $pull: { savedProducts: doc._id } }
  );
});

ProductSchema.post("findOneAndDelete", async function (doc: IProduct | null) {
  if (!doc?.compoundIds?.length) return;

  const { Compound } = await import("./Compound.js");

  for (const compoundId of doc.compoundIds) {
    await Compound.syncProductsForCompound(compoundId);
  }

  // NOTE: you can also keep your existing Business/User cleanup here
  // (e.g., sync Business.productIds, remove from User.savedProducts, etc.)
});

export const Product: ProductModel =
  (mongoose.models.Product as ProductModel) ||
  mongoose.model<IProduct, ProductModel>("Product", ProductSchema);
