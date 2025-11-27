import mongoose, { Schema, Document, Model } from "mongoose";
import { MediaLinkSchema, MediaLink } from "./MediaLink";

export interface ICompound extends Document {
  name: string;
  description?: string;
  aliases: string[];
  mediaLinks?: MediaLink[];
  productIds: mongoose.Types.ObjectId[];
}

// Extend the model interface with our static methods
export interface CompoundModel extends Model<ICompound> {
  syncProductsForCompound(compoundId: mongoose.Types.ObjectId): Promise<void>;
}

const CompoundSchema = new Schema<ICompound>(
  {
    name: { type: String, required: true, index: true },
    description: { type: String },
    aliases: [{ type: String }],
    mediaLinks: [MediaLinkSchema],
    productIds: [{ type: Schema.Types.ObjectId, ref: "Product" }],
  },
  { timestamps: true }
);

/**
 * Sync Compound.productIds based on Products that reference this compound
 */
CompoundSchema.statics.syncProductsForCompound = async function (
  compoundId: mongoose.Types.ObjectId
): Promise<void> {
  const { Product } = await import("./Product");

  // Find all products that reference this compound
  const products = await Product.find({ compoundIds: compoundId }).select(
    "_id"
  );
  const productIds = products.map((p: any) => p._id);

  await this.findByIdAndUpdate(compoundId, { productIds }, { new: false });
};

// --- Query Middleware (Safety Net) ---

/**
 * Post-save hook: Auto-sync product relationships when productIds change
 * This is a safety net in case service layer forgets to call sync methods
 */
CompoundSchema.post("save", async function (doc) {
  // Sync products when productIds change
  if (this.isModified("productIds")) {
    const { Product } = await import("./Product");
    // Sync all affected products
    for (const productId of this.productIds) {
      await Product.syncCompoundsForProduct(productId);
    }
  }
});

/**
 * Post-delete hook: Clean up product relationships when compound is deleted
 */
CompoundSchema.post("findOneAndDelete", async function (doc) {
  if (doc && doc.productIds && doc.productIds.length > 0) {
    const { Product } = await import("./Product");
    // Clean up references in all products
    for (const productId of doc.productIds) {
      await Product.syncCompoundsForProduct(productId);
    }
  }
});

export const Compound: CompoundModel =
  (mongoose.models.Compound as CompoundModel) ||
  mongoose.model<ICompound, CompoundModel>("Compound", CompoundSchema);
