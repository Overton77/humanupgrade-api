import mongoose, { Schema } from "mongoose";

export type ProtocolStepItemType = "Product" | "Compound" | "Action";
export type ProtocolTimeOfDay =
  | "morning"
  | "midday"
  | "evening"
  | "bedtime"
  | "any";

export type EvidenceRefType = "Episode" | "CaseStudy" | "Article" | "External";

export interface IProtocolStepItem {
  type: ProtocolStepItemType;

  refId?: mongoose.Types.ObjectId;

  nameOverride?: string;

  dosage?: string;
  timing?: string;
  notes?: string;
}

export interface IProtocolStepGroup {
  label?: string; // "Morning", "Evening"
  timeOfDay?: ProtocolTimeOfDay;
  items: IProtocolStepItem[];
}

export interface IEvidenceRef {
  type: EvidenceRefType;

  // points to internal entities when applicable
  refId?: mongoose.Types.ObjectId;

  // Optional extra context
  label?: string;
  url?: string;

  // Episode-specific
  episodeId?: mongoose.Types.ObjectId;
  timestamps?: number[]; // seconds

  notes?: string;
}

export interface ISafetyBucket {
  warnings: string[];
  contraindications: string[];
  interactions: string[];
  notes?: string;
}

export const ProtocolStepItemSchema = new Schema<IProtocolStepItem>(
  {
    type: {
      type: String,
      enum: ["Product", "Compound", "Action"],
      required: true,
    },
    refId: { type: Schema.Types.ObjectId },
    nameOverride: { type: String },
    dosage: { type: String },
    timing: { type: String },
    notes: { type: String },
  },
  { _id: false }
);

export const ProtocolStepGroupSchema = new Schema<IProtocolStepGroup>(
  {
    label: { type: String },
    timeOfDay: {
      type: String,
      enum: ["morning", "midday", "evening", "bedtime", "any"],
      default: "any",
    },
    items: { type: [ProtocolStepItemSchema], default: [] },
  },
  { _id: false }
);

export const EvidenceRefSchema = new Schema<IEvidenceRef>(
  {
    type: {
      type: String,
      enum: ["Episode", "CaseStudy", "Article", "External"],
      required: true,
    },

    refId: { type: Schema.Types.ObjectId },

    label: { type: String },
    url: { type: String },

    episodeId: { type: Schema.Types.ObjectId, ref: "Episode" },
    timestamps: { type: [Number], default: [] },

    notes: { type: String },
  },
  { _id: false }
);

export const SafetyBucketSchema = new Schema<ISafetyBucket>(
  {
    warnings: { type: [String], default: [] },
    contraindications: { type: [String], default: [] },
    interactions: { type: [String], default: [] },
    notes: { type: String },
  },
  { _id: false }
);
