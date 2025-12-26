import mongoose, { Schema, Model, HydratedDocument } from "mongoose";

import {
  getDocSession,
  preloadPrevForPaths,
  diffIdsFromLocals,
  cleanupSyncLocals,
} from "./utils/syncLocals.js";
import {
  EvidenceRefSchema,
  ISafetyBucket,
  IEvidenceRef,
  IProtocolStepGroup,
  ProtocolStepGroupSchema,
  SafetyBucketSchema,
} from "./ProtocolParts.js";

export type ProtocolCategory =
  | "sleep"
  | "circadian"
  | "fitness"
  | "nutrition"
  | "cognition"
  | "stress"
  | "recovery"
  | "longevity"
  | "health"
  | "other";

export interface IProtocol extends Document {
  id: string;
  name: string;
  description?: string;

  productIds: mongoose.Types.ObjectId[];
  compoundIds: mongoose.Types.ObjectId[];

  categories: string[];
  goals: string[];

  // legacy
  steps: string[];

  // new
  stepsStructured: IProtocolStepGroup[];
  evidenceRefs: IEvidenceRef[];
  safety?: ISafetyBucket;

  cautions: string[];
  aliases: string[];
  sourceUrl?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export type ProtocolDoc = HydratedDocument<IProtocol>;
export interface ProtocolModel extends Model<IProtocol> {}

const ProtocolSchema = new Schema<IProtocol, ProtocolModel>(
  {
    name: { type: String, required: true, unique: true, index: true },
    description: { type: String },

    productIds: [{ type: Schema.Types.ObjectId, ref: "Product", index: true }],
    compoundIds: [
      { type: Schema.Types.ObjectId, ref: "Compound", index: true },
    ],

    categories: [
      {
        type: String,
        enum: [
          "sleep",
          "circadian",
          "fitness",
          "nutrition",
          "cognition",
          "stress",
          "recovery",
          "longevity",
          "health",
          "other",
        ],
        default: "other",
        index: true,
      },
    ],

    goals: [{ type: String }],

    steps: [{ type: String, default: [] }],

    stepsStructured: { type: [ProtocolStepGroupSchema], default: [] },
    evidenceRefs: { type: [EvidenceRefSchema], default: [] },
    safety: { type: SafetyBucketSchema, default: undefined },

    cautions: [{ type: String, default: [] }],
    aliases: [{ type: String, index: true }],
    sourceUrl: { type: String },
  },
  { timestamps: true }
);

ProtocolSchema.virtual("id").get(function () {
  return this._id.toHexString();
});
ProtocolSchema.set("toJSON", { virtuals: true });
ProtocolSchema.set("toObject", { virtuals: true });

ProtocolSchema.pre("save", async function (this: HydratedDocument<IProtocol>) {
  await preloadPrevForPaths(this, ["productIds", "compoundIds"]);
});

ProtocolSchema.post("save", async function (doc: ProtocolDoc) {
  const session = getDocSession(doc);

  {
    const { touched, allIdStrings } = diffIdsFromLocals(doc, "productIds");

    if (touched) {
      const { Product } = await import("./Product.js");

      for (const idStr of allIdStrings) {
        await Product.syncProtocolsForProduct(
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
        await Compound.syncProtocolsForCompound(
          new mongoose.Types.ObjectId(idStr),
          { session }
        );
      }
    }
  }

  cleanupSyncLocals(doc, ["productIds", "compoundIds"]);
});

ProtocolSchema.post(
  "findOneAndDelete",
  async function (doc: ProtocolDoc | null) {
    if (!doc) return;
    const session = getDocSession(doc);

    const { Compound } = await import("./Compound.js");
    const { Product } = await import("./Product.js");
    const { CaseStudy } = await import("./CaseStudy.js");

    await Compound.updateMany(
      { protocolIds: doc._id },
      { $pull: { protocolIds: doc._id } },
      { session }
    );
    await Product.updateMany(
      { protocolIds: doc._id },
      { $pull: { protocolIds: doc._id } },
      { session }
    );
    await CaseStudy.updateMany(
      { protocolIds: doc._id },
      { $pull: { protocolIds: doc._id } },
      { session }
    );
  }
);

// -------------------- Export (same pattern as Person) --------------------

export const Protocol: ProtocolModel =
  (mongoose.models.Protocol as ProtocolModel) ||
  mongoose.model<IProtocol, ProtocolModel>("Protocol", ProtocolSchema);
