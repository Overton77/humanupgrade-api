import mongoose from "mongoose";
import { Product, IProduct } from "../models/Product";
import { Business } from "../models/Business";
import { Compound } from "../models/Compound";
import { Episode } from "../models/Episode";
import {
  ProductCreateWithOptionalIdsInput,
  ProductUpdateWithOptionalIdsInput,
  ProductUpdateRelationFieldsInput,
  ProductCompoundNestedInput,
} from "../graphql/inputs/productInputs";

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
 * Simple create: scalars + required businessId + optional compound/episode IDs.
 * - Does NOT do any nested upsert.
 * - Relies on sync methods to keep bidirectional relations in sync.
 */
export async function createProductWithOptionalIds(
  input: ProductCreateWithOptionalIdsInput
): Promise<IProduct> {
  const {
    name,
    businessId,
    description,
    ingredients,
    mediaLinks,
    sourceUrl,
    compoundIds,
  } = input;

  // Validate all referenced entities exist before creating
  await validateEntitiesExist(Business, [businessId], "Business");

  if (compoundIds && compoundIds.length > 0) {
    await validateEntitiesExist(Compound, compoundIds, "Compound");
  }

  const businessObjectId = new mongoose.Types.ObjectId(businessId);
  const compoundObjectIds = compoundIds ? toObjectIds(compoundIds) : [];

  const product = await Product.create({
    name,
    businessId: businessObjectId,
    description,
    ingredients: ingredients ?? [],
    mediaLinks,
    sourceUrl,
    compoundIds: compoundObjectIds,
  });

  // Sync all bidirectional relationships
  await Product.syncProductsForBusiness(businessObjectId);

  if (compoundIds && compoundIds.length > 0) {
    for (const cid of compoundIds) {
      await Compound.syncProductsForCompound(new mongoose.Types.ObjectId(cid));
    }
  }

  return product;
}

// ========== UPDATE ==========

/**
 * Simple update: scalars + optional compound/episode IDs.
 *
 * Semantics:
 * - compoundIds: treated as "add these compounds" (merge + dedupe, no removals).
 * - sponsorEpisodeIds: treated as "add these episodes" (merge + dedupe, no removals).
 */
export async function updateProductWithOptionalIds(
  input: ProductUpdateWithOptionalIdsInput
): Promise<IProduct | null> {
  const {
    id,
    name,
    description,
    ingredients,
    mediaLinks,
    sourceUrl,
    compoundIds,
  } = input;

  const product = await Product.findById(id);
  if (!product) return null;

  // Update scalar fields
  if (name !== undefined) product.name = name;
  if (description !== undefined) product.description = description;
  if (ingredients !== undefined) product.ingredients = ingredients;
  if (mediaLinks !== undefined) product.mediaLinks = mediaLinks;
  if (sourceUrl !== undefined) product.sourceUrl = sourceUrl;

  const productId = product._id;

  // --- Compounds: merge, dedupe, then sync from Compound side ---

  if (compoundIds !== undefined && compoundIds.length > 0) {
    await validateEntitiesExist(Compound, compoundIds, "Compound");
    product.compoundIds = mergeAndDedupeIds(product.compoundIds, compoundIds);

    // Sync each affected compound
    for (const cid of compoundIds) {
      await Compound.syncProductsForCompound(new mongoose.Types.ObjectId(cid));
    }
  }

  // --- Episodes: merge, dedupe, then sync from Episode side ---

  await product.save();

  // Recompute from reverse sides for consistency
  await Product.syncCompoundsForProduct(productId);
  await Product.syncSponsorEpisodesForProduct(productId);

  return product;
}

// ========== NESTED UPSERT HELPERS ==========

/**
 * Nested upsert for compounds.
 *
 * Rules:
 * - If id is provided: update Compound by id.
 * - Else if name is provided: find Compound by name (unique),
 *   update if exists, otherwise create.
 * - Returns list of resulting ObjectIds.
 */
async function upsertCompoundsNested(
  compoundsNested: ProductCompoundNestedInput[] | undefined
): Promise<mongoose.Types.ObjectId[]> {
  if (!compoundsNested || compoundsNested.length === 0) return [];

  const compoundIds: mongoose.Types.ObjectId[] = [];

  for (const compoundInput of compoundsNested) {
    const { id, name, description, aliases, mediaLinks } = compoundInput;

    let compound: any | null = null;

    if (id) {
      compound = await Compound.findById(id);
      if (!compound && name) {
        compound = await Compound.findOne({ name });
      }
    } else if (name) {
      compound = await Compound.findOne({ name });
    }

    if (compound) {
      // Update existing
      if (name !== undefined) compound.name = name;
      if (description !== undefined) compound.description = description;
      if (aliases !== undefined) compound.aliases = aliases;
      if (mediaLinks !== undefined) compound.mediaLinks = mediaLinks;
      await compound.save();
    } else {
      // Create new
      if (!name) {
        throw new Error(
          "compoundsNested entry requires 'name' when neither 'id' nor an existing compound by name is found"
        );
      }

      compound = await Compound.create({
        name,
        description,
        aliases: aliases ?? [],
        mediaLinks,
        productIds: [],
      });
    }

    compoundIds.push(compound._id);
  }

  return compoundIds;
}

/**
 * Rich relation update:
 * - compoundIds / compoundsNested (merged, deduped, no implicit removals)
 * - sponsorEpisodeIds / sponsorEpisodesNested (merged, deduped, no implicit removals)
 *
 * Product ↔ Compound consistency:
 * - Compound.syncProductsForCompound(compoundId) recomputes Compound.productIds
 *
 * Product ↔ Episode consistency:
 * - Episode.syncSponsorProductsForEpisode(episodeId) recomputes Episode.sponsorProductIds
 */
export async function updateProductWithRelationFields(
  input: ProductUpdateRelationFieldsInput
): Promise<IProduct | null> {
  const { id, compoundIds, compoundsNested } = input;

  const product = await Product.findById(id);
  if (!product) return null;

  const productId = product._id;

  // --- Compounds: merge & dedupe with existing set ---

  if (compoundIds !== undefined && compoundIds.length > 0) {
    await validateEntitiesExist(Compound, compoundIds, "Compound");
    product.compoundIds = mergeAndDedupeIds(product.compoundIds, compoundIds);

    // Sync affected compounds
    for (const cid of compoundIds) {
      await Compound.syncProductsForCompound(new mongoose.Types.ObjectId(cid));
    }
  }

  if (compoundsNested !== undefined) {
    const nestedCompoundIds = await upsertCompoundsNested(compoundsNested);
    product.compoundIds = mergeAndDedupeIds(
      product.compoundIds,
      nestedCompoundIds.map((id) => id.toString())
    );

    // Sync affected compounds
    for (const cid of nestedCompoundIds) {
      await Compound.syncProductsForCompound(cid);
    }
  }

  // --- Episodes: merge & dedupe with existing set ---

  await product.save();

  // Recompute from reverse sides for consistency
  await Product.syncCompoundsForProduct(productId);

  return product;
}
