import mongoose from "mongoose";
import { Person, IPerson } from "../models/Person";
import { Business } from "../models/Business";
import {
  PersonCreateWithOptionalIdsInput,
  PersonUpdateWithOptionalIdsInput,
  PersonUpdateRelationFieldsInput,
  PersonBusinessNestedInput,
} from "../graphql/inputs/personInputs";

// ========== UTILITY FUNCTIONS ==========

function toObjectIds(ids: string[]): mongoose.Types.ObjectId[] {
  return ids.map((id) => new mongoose.Types.ObjectId(id));
}

/**
 * Batch check if multiple entities exist. Throws error if any are missing.
 */
async function validateEntitiesExist<T extends mongoose.Document>(
  model: mongoose.Model<T>,
  ids: string[],
  entityType: string
): Promise<void> {
  if (!ids || ids.length === 0) return;

  const existingEntities = await model
    .find({ _id: { $in: ids } })
    .select("_id")
    .lean();

  const existingIds = new Set(
    existingEntities.map((e: any) => e._id.toString())
  );

  for (const id of ids) {
    if (!existingIds.has(id)) {
      throw new Error(`${entityType} with id ${id} does not exist`);
    }
  }
}

/**
 * Merge and deduplicate IDs: combines existing with new IDs
 */
function mergeAndDedupeIds(
  existingIds: mongoose.Types.ObjectId[],
  newIds: string[]
): mongoose.Types.ObjectId[] {
  const merged = new Set<string>(existingIds.map((id) => id.toString()));
  newIds.forEach((id) => merged.add(id));
  return toObjectIds(Array.from(merged));
}

// ========== CREATE ==========

/**
 * Simple create: scalars + optional business IDs.
 *
 * Note: Person.businessIds is primarily managed by Business.syncPersonLinks.
 * This function allows initial businessIds for convenience, but the typical
 * workflow is to create a Person, then add them to a Business via Business mutations.
 */
export async function createPersonWithOptionalIds(
  input: PersonCreateWithOptionalIdsInput
): Promise<IPerson> {
  const { name, role, bio, mediaLinks, businessIds } = input;

  // Validate all referenced businesses exist before creating
  if (businessIds && businessIds.length > 0) {
    await validateEntitiesExist(Business, businessIds, "Business");
  }

  const businessObjectIds = businessIds ? toObjectIds(businessIds) : [];

  const person = await Person.create({
    name,
    role,
    bio,
    mediaLinks,
    businessIds: businessObjectIds,
  });

  // Note: No need to call Business.syncPersonLinks here because we're not
  // modifying Business documents. The businessIds on Person are informational.
  // The Business mutations handle syncing via Business.syncPersonLinks.

  return person;
}

// ========== UPDATE ==========

/**
 * Simple update: scalars + optional business IDs.
 *
 * Semantics:
 * - businessIds: treated as "add these businesses" (merge + dedupe, no removals).
 *
 * Note: Prefer using Business mutations to manage person-business relationships.
 * This function is provided for convenience but doesn't trigger Business.syncPersonLinks.
 */
export async function updatePersonWithOptionalIds(
  input: PersonUpdateWithOptionalIdsInput
): Promise<IPerson | null> {
  const { id, name, role, bio, mediaLinks, businessIds } = input;

  const person = await Person.findById(id);
  if (!person) return null;

  // Update scalar fields
  if (name !== undefined) person.name = name;
  if (role !== undefined) person.role = role;
  if (bio !== undefined) person.bio = bio;
  if (mediaLinks !== undefined) person.mediaLinks = mediaLinks;

  // --- Businesses: merge, dedupe, no removals here ---

  if (businessIds !== undefined && businessIds.length > 0) {
    await validateEntitiesExist(Business, businessIds, "Business");
    person.businessIds = mergeAndDedupeIds(person.businessIds, businessIds);
  }

  await person.save();

  // Note: We don't call Business.syncPersonLinks here because that would
  // require modifying Business documents, which is outside this function's scope.
  // Use Business mutations for proper bidirectional syncing.

  return person;
}

// ========== NESTED UPSERT HELPERS ==========

/**
 * Nested upsert for businesses.
 *
 * Rules:
 * - If id is provided: update Business by id.
 * - Else if name is provided: find Business by name (unique),
 *   update if exists, otherwise create.
 * - Returns list of resulting ObjectIds.
 *
 * Note: This is provided for completeness but is less commonly used.
 * Prefer creating/updating Businesses directly via Business mutations.
 */
async function upsertBusinessesNested(
  businessesNested: PersonBusinessNestedInput[] | undefined
): Promise<mongoose.Types.ObjectId[]> {
  if (!businessesNested || businessesNested.length === 0) return [];

  const businessIds: mongoose.Types.ObjectId[] = [];

  for (const businessInput of businessesNested) {
    const { id, name, description, website, mediaLinks } = businessInput;

    let business: any | null = null;

    if (id) {
      business = await Business.findById(id);
      if (!business && name) {
        business = await Business.findOne({ name });
      }
    } else if (name) {
      business = await Business.findOne({ name });
    }

    if (business) {
      // Update existing
      if (name !== undefined) business.name = name;
      if (description !== undefined) business.description = description;
      if (website !== undefined) business.website = website;
      if (mediaLinks !== undefined) business.mediaLinks = mediaLinks;
      await business.save();
    } else {
      // Create new
      if (!name) {
        throw new Error(
          "businessesNested entry requires 'name' when neither 'id' nor an existing business by name is found"
        );
      }

      business = await Business.create({
        name,
        description,
        website,
        mediaLinks,
        ownerIds: [],
        productIds: [],
        executives: [],
      });
    }

    businessIds.push(business._id);
  }

  return businessIds;
}

// ========== RICH RELATION UPDATE ==========

/**
 * Rich relation update:
 * - businessIds / businessesNested (merged, deduped, no implicit removals)
 *
 * Note: This function manages Person.businessIds but does NOT sync Business documents.
 * For proper bidirectional syncing, use Business mutations which call Business.syncPersonLinks.
 * This function is provided for rare cases where you want to manage Person.businessIds directly.
 */
export async function updatePersonWithRelationFields(
  input: PersonUpdateRelationFieldsInput
): Promise<IPerson | null> {
  const { id, businessIds, businessesNested } = input;

  const person = await Person.findById(id);
  if (!person) return null;

  // --- Businesses: merge & dedupe with existing set ---

  if (businessIds !== undefined && businessIds.length > 0) {
    await validateEntitiesExist(Business, businessIds, "Business");
    person.businessIds = mergeAndDedupeIds(person.businessIds, businessIds);
  }

  if (businessesNested !== undefined) {
    const nestedBusinessIds = await upsertBusinessesNested(businessesNested);
    person.businessIds = mergeAndDedupeIds(
      person.businessIds,
      nestedBusinessIds.map((id) => id.toString())
    );
  }

  await person.save();

  // Note: We don't call Business.syncPersonLinks here because that's
  // the Business model's responsibility. This function only manages the
  // Person side of the relationship.

  return person;
}
