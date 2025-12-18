export type CaseStudySourceType =
  | "pubmed"
  | "clinical-trial"
  | "article"
  | "other";

export interface CaseStudyCreateWithOptionalIdsInput {
  title: string;
  summary: string;
  url?: string;
  sourceType?: CaseStudySourceType;
  episodeIds?: string[];
  compoundIds?: string[];
  productIds?: string[];
  protocolIds?: string[];
}

export interface CaseStudyUpdateWithOptionalIdsInput {
  id: string;
  title?: string;
  summary?: string;
  url?: string;
  sourceType?: CaseStudySourceType;
  // These are additional IDs to merge in
  episodeIds?: string[];
  compoundIds?: string[];
  productIds?: string[];
  protocolIds?: string[];
}
