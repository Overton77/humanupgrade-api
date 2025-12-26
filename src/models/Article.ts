import mongoose, { Schema, Document, Model, HydratedDocument } from "mongoose";
import { MediaLinkSchema, MediaLink } from "./MediaLink.js";

export type ArticleSourceType = "human-upgrade" | "external";

export interface IArticle {
  id: string;

  title: string;
  summary?: string;
  url?: string;

  sourceType: ArticleSourceType;
  publishedAt?: Date;
  authorName?: string;

  tags: string[];
  mediaLinks?: MediaLink[];

  episodeIds: mongoose.Types.ObjectId[];
  personIds: mongoose.Types.ObjectId[];
  businessIds: mongoose.Types.ObjectId[];
  productIds: mongoose.Types.ObjectId[];
  compoundIds: mongoose.Types.ObjectId[];
  protocolIds: mongoose.Types.ObjectId[];

  createdAt?: Date;
  updatedAt?: Date;
}

export type ArticleDoc = HydratedDocument<IArticle>;
export interface ArticleModel extends Model<IArticle> {}

const ArticleSchema = new Schema<IArticle, ArticleModel>(
  {
    title: { type: String, required: true, index: true },
    summary: { type: String },
    url: { type: String, index: true },

    sourceType: {
      type: String,
      enum: ["human-upgrade", "external"],
      default: "external",
      index: true,
    },
    publishedAt: { type: Date, index: true },
    authorName: { type: String },

    tags: { type: [String], default: [], index: true },
    mediaLinks: [MediaLinkSchema],

    episodeIds: [{ type: Schema.Types.ObjectId, ref: "Episode", index: true }],
    personIds: [{ type: Schema.Types.ObjectId, ref: "Person", index: true }],
    businessIds: [
      { type: Schema.Types.ObjectId, ref: "Business", index: true },
    ],
    productIds: [{ type: Schema.Types.ObjectId, ref: "Product", index: true }],
    compoundIds: [
      { type: Schema.Types.ObjectId, ref: "Compound", index: true },
    ],
    protocolIds: [
      { type: Schema.Types.ObjectId, ref: "Protocol", index: true },
    ],
  },
  { timestamps: true }
);

ArticleSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

ArticleSchema.set("toJSON", { virtuals: true });
ArticleSchema.set("toObject", { virtuals: true });

export const Article: ArticleModel =
  (mongoose.models.Article as ArticleModel) ||
  mongoose.model<IArticle, ArticleModel>("Article", ArticleSchema);
