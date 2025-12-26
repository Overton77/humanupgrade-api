import mongoose, { Schema, Model, HydratedDocument, Document } from "mongoose";

export type NoteEntityType =
  | "Article"
  | "Business"
  | "CaseStudy"
  | "Compound"
  | "Person"
  | "Product"
  | "UserProtocol"
  | "Protocol"
  | "Episode";

export type UserNoteStatus = "active" | "archived" | "deleted";

export interface IEntityRef {
  type: NoteEntityType;
  id: mongoose.Types.ObjectId;
}

export interface ISourceLink {
  episodeId?: mongoose.Types.ObjectId;
  timestamp?: number;
  url?: string;
}

/**
 * content:
 * - either markdown string
 * - or rich-text JSON (editor output)
 *
 * We store both raw content and a derived contentText for search.
 */
export interface IUserNote extends Document {
  id: string;

  userId: mongoose.Types.ObjectId;

  title?: string;

  content: unknown;
  contentText: string;

  mentions: IEntityRef[];

  sourceLinks: ISourceLink[];

  tags: string[];

  status: UserNoteStatus;

  createdAt?: Date;
  updatedAt?: Date;
}

export type UserNoteDoc = HydratedDocument<IUserNote>;
export interface UserNoteModel extends Model<IUserNote> {}

const EntityRefSchema = new Schema<IEntityRef>(
  {
    type: {
      type: String,
      required: true,
      enum: [
        "Article",
        "Business",
        "CaseStudy",
        "Compound",
        "Person",
        "Product",
        "UserProtocol",
        "Protocol",
        "Episode",
      ],
      index: true,
    },
    id: { type: Schema.Types.ObjectId, required: true, index: true },
  },
  { _id: false }
);

const SourceLinkSchema = new Schema<ISourceLink>(
  {
    episodeId: { type: Schema.Types.ObjectId, ref: "Episode", index: true },
    timestamp: { type: Number },
    url: { type: String },
  },
  { _id: false }
);

/**
 * Minimal “mention extraction” strategy:
 * - If content is a string (markdown), extract patterns like:
 *     @Type:hexObjectId
 *     e.g. "@Product:64f2c1...".
 * - If content is JSON, we:
 *    - stringify it to derive contentText
 *    - also scan the stringified JSON for the same @Type:ObjectId pattern
 *
 * Later, when you implement rich editor entity nodes, you can replace this
 * with structured traversal (e.g., detect {type:"mention", entityType, entityId} nodes).
 */
function derivePlainTextAndMentions(content: unknown): {
  contentText: string;
  mentions: IEntityRef[];
} {
  const mentions: IEntityRef[] = [];

  const text =
    typeof content === "string"
      ? content
      : content == null
      ? ""
      : safeStringify(content);

  // Very light cleanup for search: strip some markdown-ish noise
  // (you can get fancier later)
  const contentText = text
    .replace(/```[\s\S]*?```/g, " ") // remove fenced code blocks
    .replace(/`[^`]*`/g, " ") // inline code
    .replace(/[#>*_\-]+/g, " ") // common markdown tokens
    .replace(/\s+/g, " ")
    .trim();

  // Mention pattern: @Type:24hex
  const re =
    /@(?<type>Article|Business|CaseStudy|Compound|Person|Product|UserProtocol|Protocol|Episode)\s*:\s*(?<id>[a-fA-F0-9]{24})/g;

  const seen = new Set<string>();
  let m: RegExpExecArray | null;

  while ((m = re.exec(text)) !== null) {
    const type = m.groups?.type as NoteEntityType | undefined;
    const idStr = m.groups?.id;

    if (!type || !idStr) continue;

    const key = `${type}:${idStr.toLowerCase()}`;
    if (seen.has(key)) continue;

    seen.add(key);
    mentions.push({
      type,
      id: new mongoose.Types.ObjectId(idStr),
    });
  }

  return { contentText, mentions };
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    try {
      return String(value);
    } catch {
      return "";
    }
  }
}

const UserNoteSchema = new Schema<IUserNote, UserNoteModel>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    title: { type: String, index: true },

    content: { type: Schema.Types.Mixed, required: true },

    contentText: { type: String, default: "", index: true },

    mentions: { type: [EntityRefSchema], default: [] },

    sourceLinks: { type: [SourceLinkSchema], default: [] },

    tags: [{ type: String, default: [], index: true }],

    status: {
      type: String,
      enum: ["active", "archived", "deleted"],
      default: "active",
      index: true,
    },
  },
  { timestamps: true }
);

UserNoteSchema.virtual("id").get(function () {
  return this._id.toHexString();
});
UserNoteSchema.set("toJSON", { virtuals: true });
UserNoteSchema.set("toObject", { virtuals: true });

UserNoteSchema.pre("save", function (this: UserNoteDoc) {
  const { contentText, mentions } = derivePlainTextAndMentions(this.content);

  this.contentText = contentText;
  this.mentions = mentions;

  if (Array.isArray(this.tags)) {
    this.tags = this.tags
      .map((t) => (typeof t === "string" ? t.trim() : ""))
      .filter(Boolean);
  }
});

UserNoteSchema.index({ userId: 1, updatedAt: -1 });
UserNoteSchema.index({ userId: 1, status: 1, updatedAt: -1 });
UserNoteSchema.index({ userId: 1, "mentions.type": 1, "mentions.id": 1 });
UserNoteSchema.index({ userId: 1, tags: 1 });

// Note: Mongo text index has language/stemming behavior; you can tune later.
UserNoteSchema.index({ title: "text", contentText: "text", tags: "text" });

export const UserNote: UserNoteModel =
  (mongoose.models.UserNote as UserNoteModel) ||
  mongoose.model<IUserNote, UserNoteModel>("UserNote", UserNoteSchema);
