import { MediaLink } from "../../models/MediaLink.js";
import { ProtocolCategory } from "../../models/Protocol.js";

/** Scalar fields (no relations) */
export interface ProductScalarFields {
  name: string;
  description?: string;
  ingredients?: string[];
  price?: number;
  mediaLinks?: MediaLink[];
  sourceUrl?: string;
}

/** Scalar update fields (all optional) */
export interface ProductScalarUpdateFields {
  name?: string;
  description?: string;
  ingredients?: string[];
  price?: number;
  mediaLinks?: MediaLink[];
  sourceUrl?: string;
}

/** Simple create: scalars + required businessId + optional compound/episode IDs */
export interface ProductCreateWithOptionalIdsInput extends ProductScalarFields {
  businessId: string;
  compoundIds?: string[];
  protocolIds?: string[];
}

/** Simple update: scalars + optional compound/episode IDs */
export interface ProductUpdateWithOptionalIdsInput
  extends ProductScalarUpdateFields {
  id: string;
  compoundIds?: string[];
  protocolIds?: string[];
}

/** Nested compound input (for upsert by name or id) */
export interface ProductCompoundNestedInput {
  id?: string;
  name?: string;
  description?: string;
  aliases?: string[];
  mediaLinks?: MediaLink[];
}

export interface ProductProtocolNestedInput {
  id?: string;
  name: string;
  description?: string;
  categories: ProtocolCategory[];
  goals: string[];
  steps: string[];
  cautions?: string[];
  aliases?: string[];
  sourceUrl?: string;
}

/** Nested episode input (for upsert by number or id) */

/**
 * Rich relation update input.
 * - compoundIds / compoundsNested: manage compounds
 * - sponsorEpisodeIds / sponsorEpisodesNested: manage sponsor episodes
 */
export interface ProductUpdateRelationFieldsInput {
  id: string;

  compoundIds?: string[];
  compoundsNested?: ProductCompoundNestedInput[];
  protocolIds?: string[];
  protocolsNested?: ProductProtocolNestedInput[];
}
