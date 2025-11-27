import { MediaLink } from "../../models/MediaLink";

/** Scalar fields (no relations) */
export interface ProductScalarFields {
  name: string;
  description?: string;
  ingredients?: string[];
  mediaLinks?: MediaLink[];
  sourceUrl?: string;
}

/** Scalar update fields (all optional) */
export interface ProductScalarUpdateFields {
  name?: string;
  description?: string;
  ingredients?: string[];
  mediaLinks?: MediaLink[];
  sourceUrl?: string;
}

/** Simple create: scalars + required businessId + optional compound/episode IDs */
export interface ProductCreateWithOptionalIdsInput extends ProductScalarFields {
  businessId: string;
  compoundIds?: string[];
}

/** Simple update: scalars + optional compound/episode IDs */
export interface ProductUpdateWithOptionalIdsInput
  extends ProductScalarUpdateFields {
  id: string;
  compoundIds?: string[];
}

/** Nested compound input (for upsert by name or id) */
export interface ProductCompoundNestedInput {
  id?: string;
  name?: string;
  description?: string;
  aliases?: string[];
  mediaLinks?: MediaLink[];
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
}
