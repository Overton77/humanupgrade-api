import mongoose, { Schema, Document, Model } from "mongoose";
import { MediaLinkSchema, MediaLink } from "./MediaLink";
import { Business } from "./Business"; // used in static

export interface IProduct extends Document {
  name: string;
  businessId: mongoose.Types.ObjectId;
  description?: string;
  ingredients: string[];
  mediaLinks?: MediaLink[];
  sponsorEpisodes: mongoose.Types.ObjectId[];
  sourceUrl?: string;
  compoundIds: mongoose.Types.ObjectId[];
}

// Extend the model interface with our static methods
export interface ProductModel extends Model<IProduct> {
  syncProductsForBusiness(businessId: mongoose.Types.ObjectId): Promise<void>;
  syncCompoundsForProduct(productId: mongoose.Types.ObjectId): Promise<void>;
  syncSponsorEpisodesForProduct(
    productId: mongoose.Types.ObjectId
  ): Promise<void>;
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
  const products = await this.find({ businessId }).select("_id");
  const productIds = products.map((p: IProduct) => p._id);

  await Business.findByIdAndUpdate(businessId, { productIds }, { new: false });
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

ProductSchema.post("save", async function (doc) {
  // Sync business when businessId changes
  if (this.isModified("businessId")) {
    await Product.syncProductsForBusiness(this.businessId);
  }

  // Sync compounds when compoundIds change
  if (this.isModified("compoundIds")) {
    const { Compound } = await import("./Compound");
    // Sync all affected compounds
    for (const compoundId of this.compoundIds) {
      await Compound.syncProductsForCompound(compoundId);
    }
  }

  // Sync episodes when sponsorEpisodes change
});

/**
 * Post-delete hook: Clean up relationships when product is deleted
 */
ProductSchema.post("findOneAndDelete", async function (doc) {
  if (doc) {
    // Clean up business reference
    if (doc.businessId) {
      await Product.syncProductsForBusiness(doc.businessId);
    }

    // Clean up compound references
    if (doc.compoundIds && doc.compoundIds.length > 0) {
      const { Compound } = await import("./Compound");
      for (const compoundId of doc.compoundIds) {
        await Compound.syncProductsForCompound(compoundId);
      }
    }

    // Clean up episode references
  }
});

export const Product: ProductModel =
  (mongoose.models.Product as ProductModel) ||
  mongoose.model<IProduct, ProductModel>("Product", ProductSchema);
