import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICaseStudy extends Document {
  title: string;
  summary: string;
  url?: string;
  sourceType: "pubmed" | "clinical-trial" | "article" | "other";
  episodeIds: mongoose.Types.ObjectId[];
  compoundIds: mongoose.Types.ObjectId[];
}

const CaseStudySchema = new Schema<ICaseStudy>(
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
  },
  { timestamps: true }
);

export const CaseStudy: Model<ICaseStudy> =
  mongoose.models.CaseStudy ||
  mongoose.model<ICaseStudy>("CaseStudy", CaseStudySchema);
