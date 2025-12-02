import { MediaLink } from "../../models/MediaLink.js";

export interface CompoundCreateWithOptionalIdsInput {
  name: string;
  description?: string;
  aliases?: string[];
  mediaLinks?: MediaLink[];
  productIds?: string[];
}

export interface CompoundUpdateWithOptionalIdsInput {
  id: string;
  name?: string;
  description?: string;
  aliases?: string[];
  mediaLinks?: MediaLink[];
  productIds?: string[];
}

export interface CompoundProductNestedInput {
  id?: string;
  name?: string;
  description?: string;
  ingredients?: string[];
  mediaLinks?: MediaLink[];
  sourceUrl?: string;
}

export interface CompoundUpdateRelationFieldsInput {
  id: string;
  productIds?: string[];
  productsNested?: CompoundProductNestedInput[];
}
