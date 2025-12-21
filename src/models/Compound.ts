import mongoose, {
  Schema,
  Document,
  Model,
  HydratedDocument,
  ClientSession,
} from "mongoose";
import { MediaLinkSchema, MediaLink } from "./MediaLink.js";
import { TxOpts } from "./utils/syncLocals.js";

export interface ICompound {
  id: string; // <- now available because of virtual
  name: string;
  description?: string;
  aliases: string[];
  protocolIds: mongoose.Types.ObjectId[];
  mediaLinks?: MediaLink[];
  productIds: mongoose.Types.ObjectId[];
}

// Extend the model interface with our static methods

export type CompoundDoc = HydratedDocument<ICompound>;

export interface CompoundModel extends Model<ICompound> {
  syncProtocolsForCompound(
    compoundId: mongoose.Types.ObjectId,
    opts?: TxOpts
  ): Promise<void>;
  syncProductsForCompound(
    compoundId: mongoose.Types.ObjectId,
    opts?: TxOpts
  ): Promise<void>;
}

const CompoundSchema = new Schema<ICompound, CompoundModel>(
  {
    name: { type: String, required: true, index: true },
    description: { type: String },
    aliases: [{ type: String }],
    protocolIds: [{ type: Schema.Types.ObjectId, ref: "Protocol" }],
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
  compoundId: mongoose.Types.ObjectId,
  opts?: TxOpts
): Promise<void> {
  const { Product } = await import("./Product.js");
  const products = await Product.find({ compoundIds: compoundId })
    .select("_id")
    .lean()
    .session(opts?.session ?? null);
  const productIds = products.map(
    (p: { _id: mongoose.Types.ObjectId }) => p._id
  );
  await this.findByIdAndUpdate(
    compoundId,
    { $set: { productIds } },
    { session: opts?.session }
  );
};

CompoundSchema.statics.syncProtocolsForCompound = async function (
  compoundId: mongoose.Types.ObjectId,
  opts?: TxOpts
): Promise<void> {
  const { Protocol } = await import("./Protocol.js");
  const protocols = await Protocol.find({ compoundIds: compoundId })
    .select("_id")
    .lean()
    .session(opts?.session ?? null);
  const protocolIds = protocols.map(
    (p: { _id: mongoose.Types.ObjectId }) => p._id
  );
  await this.findByIdAndUpdate(
    compoundId,
    { $set: { protocolIds } },
    { session: opts?.session }
  );
};

CompoundSchema.post(
  "findOneAndDelete",
  async function (doc: CompoundDoc | null) {
    if (!doc) return;
    const session = this.getOptions()?.session as ClientSession | undefined;
    const compoundId = doc._id;

    const { Protocol } = await import("./Protocol.js");
    const { Product } = await import("./Product.js");
    const { CaseStudy } = await import("./CaseStudy.js");

    await Protocol.updateMany(
      { compoundIds: compoundId },
      { $pull: { compoundIds: compoundId } },
      { session: session ?? undefined }
    );
    await Product.updateMany(
      { compoundIds: compoundId },
      { $pull: { compoundIds: compoundId } },
      { session: session ?? undefined }
    );
    await CaseStudy.updateMany(
      { compoundIds: compoundId },
      { $pull: { compoundIds: compoundId } },
      { session: session ?? undefined }
    );
  }
);
export const Compound: CompoundModel =
  (mongoose.models.Compound as CompoundModel) ||
  mongoose.model<ICompound, CompoundModel>("Compound", CompoundSchema);
