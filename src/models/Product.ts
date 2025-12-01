import mongoose, { Schema, Document, Model } from "mongoose";
import { MediaLinkSchema, MediaLink } from "./MediaLink";

export interface IProduct extends Document {
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

ProductSchema.statics.syncProductsForBusiness = async function (
  businessId: mongoose.Types.ObjectId
): Promise<void> {
  const { Business } = await import("./Business");
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
  const { Compound } = await import("./Compound");

  // Find all compounds that reference this product
  const compounds = await Compound.find({ productIds: productId }).select(
    "_id"
  );
  const compoundIds = compounds.map((c: any) => c._id);

  await this.findByIdAndUpdate(productId, { compoundIds }, { new: false });
};

ProductSchema.pre("save", function (next) {
  if (this.isModified("businessId")) {
    this.$locals = this.$locals || {};
    this.$locals.previousBusinessId = this.getModifiedPaths().includes(
      "businessId"
    )
      ? (this as any).get("businessId", null, { getters: false }) // old value
      : undefined;
  }
  next();
});

ProductSchema.post("save", async function (doc: IProduct) {
  const oldBusinessId = this.$locals?.previousBusinessId;
  const newBusinessId = doc.businessId;

  if (!this.isModified("businessId")) return;

  // If it moved from A → B, resync both
  if (oldBusinessId && !oldBusinessId.equals(newBusinessId)) {
    await (this.constructor as typeof Product).syncProductsForBusiness(
      oldBusinessId
    );
  }

  if (newBusinessId) {
    await (this.constructor as typeof Product).syncProductsForBusiness(
      newBusinessId
    );
  }
});

// TODO: combine the middlewares

ProductSchema.post("findOneAndDelete", async function (doc: IProduct | null) {
  if (doc?.businessId) {
    await (this.model as typeof Product).syncProductsForBusiness(
      doc.businessId
    );
  }
});

ProductSchema.post("findOneAndDelete", async function (doc: IProduct | null) {
  if (!doc) return;

  const { User } = await import("./User");

  await User.updateMany(
    { savedProducts: doc._id },
    { $pull: { savedProducts: doc._id } }
  );
});

ProductSchema.post("findOneAndDelete", async function (doc: IProduct | null) {
  if (!doc?.compoundIds?.length) return;

  const { Compound } = await import("./Compound");

  for (const compoundId of doc.compoundIds) {
    await Compound.syncProductsForCompound(compoundId);
  }

  // NOTE: you can also keep your existing Business/User cleanup here
  // (e.g., sync Business.productIds, remove from User.savedProducts, etc.)
});

export const Product: ProductModel =
  (mongoose.models.Product as ProductModel) ||
  mongoose.model<IProduct, ProductModel>("Product", ProductSchema);
