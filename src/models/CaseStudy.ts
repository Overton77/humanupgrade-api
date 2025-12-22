import mongoose, {
  Schema,
  Document,
  Model,
  HydratedDocument,
  ClientSession,
} from "mongoose";

export interface ICaseStudy {
  id: string; // virtual
  title: string;
  summary: string;
  url?: string;
  sourceType: "pubmed" | "clinical-trial" | "article" | "other";
  episodeIds: mongoose.Types.ObjectId[];
  compoundIds: mongoose.Types.ObjectId[];
  productIds: mongoose.Types.ObjectId[];
  protocolIds: mongoose.Types.ObjectId[];
}

export type CaseStudyDoc = HydratedDocument<ICaseStudy>;

export interface CaseStudyModel extends Model<ICaseStudy> {}

const CaseStudySchema = new Schema<ICaseStudy, CaseStudyModel>(
  {
    title: { type: String, required: true },
    summary: { type: String, required: true },
    url: { type: String },
    sourceType: {
      type: String,
      enum: ["pubmed", "clinical-trial", "article", "other"],
      default: "other",
    },
    episodeIds: [{ type: Schema.Types.ObjectId, ref: "Episode" }],
    compoundIds: [{ type: Schema.Types.ObjectId, ref: "Compound" }],
    productIds: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    protocolIds: [{ type: Schema.Types.ObjectId, ref: "Protocol" }],
  },
  { timestamps: true }
);

CaseStudySchema.virtual("id").get(function () {
  return this._id.toHexString();
});

CaseStudySchema.set("toJSON", { virtuals: true });
CaseStudySchema.set("toObject", { virtuals: true });

// CaseStudySchema.post(
//   "findOneAndDelete",
//   async function (doc: CaseStudyDoc | null) {
//     if (!doc) return;
//     const session = this.getOptions()?.session as ClientSession | undefined;

//   }
// );

export const CaseStudy: CaseStudyModel =
  (mongoose.models.CaseStudy as CaseStudyModel) ||
  mongoose.model<ICaseStudy, CaseStudyModel>("CaseStudy", CaseStudySchema);
