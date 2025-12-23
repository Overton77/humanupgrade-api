import { MediaLink } from "../../models/MediaLink.js";
import { ProtocolCategory } from "../../models/Protocol.js";
import {
  ProtocolStepGroupInput,
  EvidenceRefInput,
  SafetyBucketInput,
} from "./protocolPartsInputs.js";

export interface ProtocolScalarFields {
  name: string;
  description?: string;
  categories: ProtocolCategory[];
  goals: string[];
  steps: string[];
  cautions: string[];
  aliases: string[];
  sourceUrl?: string;
  stepsStructured?: ProtocolStepGroupInput[];
  evidenceRefs?: EvidenceRefInput[];
  safety?: SafetyBucketInput;
}

export interface ProtocolScalarUpdateFields {
  name?: string;
  description?: string;
  categories?: ProtocolCategory[];
  goals?: string[];
  steps?: string[];
  cautions?: string[];
  aliases?: string[];
  sourceUrl?: string;
  stepsStructured?: ProtocolStepGroupInput[];
  evidenceRefs?: EvidenceRefInput[];
  /** NEW: EvidenceRefs update behavior */
  overwriteEvidenceRefs?: boolean; // default true if evidenceRefs provided
  addToEvidenceRefs?: boolean;
  safety?: SafetyBucketInput;
}

/** Simple create: scalars + optional product/compound IDs */
export interface ProtocolCreateWithOptionalIdsInput
  extends ProtocolScalarFields {
  productIds?: string[];
  compoundIds?: string[];
}

/** Simple update: scalars + optional product/compound IDs */
export interface ProtocolUpdateWithOptionalIdsInput
  extends ProtocolScalarUpdateFields {
  id: string;
  productIds?: string[];
  compoundIds?: string[];
}

/** Nested product input (upsert by id or name) */
export interface ProtocolProductNestedInput {
  id?: string;
  name?: string;

  // required only if creating a new Product
  businessId?: string;

  description?: string;
  ingredients?: string[];
  price?: number;
  mediaLinks?: MediaLink[];
  sourceUrl?: string;
}

/** Nested compound input (upsert by id or name) */
export interface ProtocolCompoundNestedInput {
  id?: string;
  name?: string;
  description?: string;
  aliases?: string[];
  mediaLinks?: MediaLink[];
}

/**
 * Rich relation update input.
 * - productIds / productsNested: manage products
 * - compoundIds / compoundsNested: manage compounds
 *
 * Semantics match Product service:
 * - IDs are treated as "add these" (merge + dedupe; no removals)
 */
export interface ProtocolUpdateRelationFieldsInput {
  id: string;

  productIds?: string[];
  productsNested?: ProtocolProductNestedInput[];

  compoundIds?: string[];
  compoundsNested?: ProtocolCompoundNestedInput[];
}
