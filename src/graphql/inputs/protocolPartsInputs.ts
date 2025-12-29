export type ProtocolStepItemType = "Product" | "Compound" | "Action";
export type ProtocolTimeOfDay =
  | "morning"
  | "midday"
  | "evening"
  | "bedtime"
  | "any";

export type EvidenceRefType = "Episode" | "CaseStudy" | "Article" | "External";

export interface ProtocolStepItemInput {
  type: ProtocolStepItemType;

  // PRODUCT / COMPOUND only
  refId?: string;

  // ACTION or override label
  nameOverride?: string;

  dosage?: string;
  timing?: string;
  notes?: string;
}

export interface ProtocolStepGroupInput {
  label?: string;
  timeOfDay?: ProtocolTimeOfDay;
  items: ProtocolStepItemInput[];
}

export interface EvidenceRefInput {
  type: EvidenceRefType;

  // Internal entity pointer (CaseStudy/Article), or Episode fallback if you want
  refId?: string;

  // Episode-specific (you already have Episode model)
  episodeId?: string;
  timestamps?: number[];

  label?: string;
  url?: string;
  notes?: string;
}

export interface SafetyBucketInput {
  warnings?: string[];
  contraindications?: string[];
  interactions?: string[];
  notes?: string;
}
