import { MediaLink } from "../../models/MediaLink";

/** Scalar fields (no relations) */
export interface PersonScalarFields {
  name: string;
  role?: string;
  bio?: string;
  mediaLinks?: MediaLink[];
}

/** Scalar update fields (all optional) */
export interface PersonScalarUpdateFields {
  name?: string;
  role?: string;
  bio?: string;
  mediaLinks?: MediaLink[];
}

/**
 * Simple create: scalars + optional business IDs
 * Note: businessIds is primarily managed by Business.syncPersonLinks,
 * but we allow optional initial businessIds for convenience
 */
export interface PersonCreateWithOptionalIdsInput extends PersonScalarFields {
  businessIds?: string[];
}

/**
 * Simple update: scalars + optional business IDs
 * Note: Prefer using Business mutations to manage person-business relationships
 */
export interface PersonUpdateWithOptionalIdsInput
  extends PersonScalarUpdateFields {
  id: string;
  businessIds?: string[];
}

/** Nested business input (for upsert by name or id) */
export interface PersonBusinessNestedInput {
  id?: string;
  name?: string;
  description?: string;
  website?: string;
  mediaLinks?: MediaLink[];
}

/**
 * Rich relation update input.
 * - businessIds / businessesNested: manage businesses
 * Note: This is less common since Business manages this relationship
 */
export interface PersonUpdateRelationFieldsInput {
  id: string;

  businessIds?: string[];
  businessesNested?: PersonBusinessNestedInput[];
}
