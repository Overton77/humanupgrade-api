import mongoose, { Schema, Document, Model } from "mongoose";
import { MediaLinkSchema, MediaLink } from "./MediaLink.js";

export interface ICompound extends Document {
  id: string; // <- now available because of virtual
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

// -----------------------------------------------------
// 🔥 Add this virtual so id = _id
// -----------------------------------------------------
CompoundSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

CompoundSchema.set("toJSON", { virtuals: true });
CompoundSchema.set("toObject", { virtuals: true });

/**
 * Sync Compound.productIds based on Products that reference this compound
 */
CompoundSchema.statics.syncProductsForCompound = async function (
  compoundId: mongoose.Types.ObjectId
): Promise<void> {
  const { Product } = await import("./Product.js");

  // Find all products that reference this compound as canonical
  const products = await Product.find({ compoundIds: compoundId }).select(
    "_id"
  );
  const productIds = products.map((p: any) => p._id);

  // Update the mirror field on Compound
  await this.findByIdAndUpdate(
    compoundId,
    { $set: { productIds } },
    { new: false }
  );
};

CompoundSchema.post("findOneAndDelete", async function (doc: ICompound | null) {
  if (!doc) return;

  const compoundId = doc._id;
  const { Product } = await import("./Product.js");
  const { CaseStudy } = await import("./CaseStudy.js");

  // 1) Remove this compound from all products' canonical compoundIds
  await Product.updateMany(
    { compoundIds: compoundId },
    { $pull: { compoundIds: compoundId } }
  );

  // 2) Recompute mirrors for all affected compounds if you want them perfect
  //    (Not strictly necessary since this compound is gone, but other compounds
  //     may still be fine; we skip this to avoid extra work.)

  // 3) Remove this compound from all CaseStudy.compoundIds
  await CaseStudy.updateMany(
    { compoundIds: compoundId },
    { $pull: { compoundIds: compoundId } }
  );
});

export const Compound: CompoundModel =
  (mongoose.models.Compound as CompoundModel) ||
  mongoose.model<ICompound, CompoundModel>("Compound", CompoundSchema);
