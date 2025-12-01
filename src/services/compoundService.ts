import mongoose from "mongoose";
import { Compound, ICompound } from "../models/Compound";
import { Product } from "../models/Product";
import {
  CompoundCreateWithOptionalIdsInput,
  CompoundUpdateWithOptionalIdsInput,
  CompoundUpdateRelationFieldsInput,
  CompoundProductNestedInput,
} from "../graphql/inputs/compoundInputs";
import { toObjectIds } from "./utils/general";
import {
  mergeAndDedupeIds,
  mergeUniqueStrings,
  mergeUniqueBy,
} from "./utils/merging";
import { validateEntitiesExist } from "./utils/validation";

/**
 * Create a Compound and optionally connect products.
 *
 * Relationship rules:
 *
 * - Products:
 *   - Product.compoundIds is canonical.
 *   - Compound.productIds is a mirror, maintained by
 *     Compound.syncProductsForCompound() - NO automatic middleware!
 */

export async function createCompoundWithOptionalIds(
  input: CompoundCreateWithOptionalIdsInput
): Promise<ICompound> {
  const { name, description, aliases, mediaLinks, productIds } = input;

  // --- 1) Validate all referenced entities exist up front -------------------

  if (productIds && productIds.length > 0) {
    await validateEntitiesExist(Product, productIds, "Product");
  }

  // --- 2) Create the Compound (mirror side - starts empty) ------------------

  const compound = await Compound.create({
    name,
    description,
    aliases: aliases ?? [],
    mediaLinks,
    productIds: [], // Mirror field, always starts empty
  });

  const compoundId = compound._id;

  // --- 3) Update canonical side (Product.compoundIds) -----------------------

  if (productIds && productIds.length > 0) {
    // Add this compound to the products' compoundIds arrays (canonical)
    await Product.updateMany(
      { _id: { $in: productIds } },
      { $addToSet: { compoundIds: compoundId } }
    );

    // Recompute mirror (Compound.productIds) from canonical
    await Compound.syncProductsForCompound(compoundId);
  }

  return compound;
}

// ============================================================================
//  SIMPLE UPDATE: SCALARS + OPTIONAL PRODUCT IDS
// ============================================================================

/**
 * Simple update: scalar fields + optional products.
 *
 * Semantics:
 *
 * - productIds:
 *   - Treated as "add these products to this compound".
 *   - We update Product.compoundIds (canonical).
 *   - Then Compound.syncProductsForCompound(compoundId) recomputes
 *     Compound.productIds as a mirror.
 */
export async function updateCompoundWithOptionalIds(
  input: CompoundUpdateWithOptionalIdsInput
): Promise<ICompound | null> {
  const { id, name, description, aliases, mediaLinks, productIds } = input;

  const compound = await Compound.findById(id);
  if (!compound) return null;

  // --- Update scalar fields -------------------------------------------------

  if (name !== undefined) compound.name = name;
  if (description !== undefined) compound.description = description;
  if (mediaLinks !== undefined) compound.mediaLinks = mediaLinks;

  // --- Merge arrays (addToSet semantics) ------------------------------------

  if (aliases !== undefined && aliases.length > 0) {
    compound.aliases = mergeUniqueStrings(compound.aliases ?? [], aliases);
  }

  const compoundId = compound._id;

  // --- Products: update via Product.compoundIds (canonical) -----------------

  if (productIds && productIds.length > 0) {
    await validateEntitiesExist(Product, productIds, "Product");

    // Add this compound to the products' compoundIds arrays (canonical)
    await Product.updateMany(
      { _id: { $in: productIds } },
      { $addToSet: { compoundIds: compoundId } }
    );

    // Recompute Compound.productIds mirror from Product.compoundIds
    await Compound.syncProductsForCompound(compoundId);
  }

  // Persist scalar changes
  await compound.save();

  return compound;
}

// ============================================================================
//  NESTED UPSERT HELPERS
// ============================================================================

/**
 * Nested upsert for products (Product).
 *
 * Rules:
 * - If id is provided: update Product by id.
 * - Else if name is provided: find Product by unique name,
 *   update if exists, otherwise create.
 * - Always adds this compound to product.compoundIds (canonical side).
 */
async function upsertProductsNested(
  productsNested: CompoundProductNestedInput[] | undefined,
  compoundId: mongoose.Types.ObjectId
): Promise<mongoose.Types.ObjectId[]> {
  if (!productsNested || productsNested.length === 0) return [];

  const productIds: mongoose.Types.ObjectId[] = [];

  for (const productInput of productsNested) {
    const { id, name, description, ingredients, mediaLinks, sourceUrl } =
      productInput;

    let product: any | null = null;

    if (id) {
      product = await Product.findById(id);
      if (!product && name) {
        product = await Product.findOne({ name });
      }
    } else if (name) {
      product = await Product.findOne({ name });
    }

    if (product) {
      // Update existing
      if (name !== undefined) product.name = name;
      if (description !== undefined) product.description = description;
      if (ingredients !== undefined && ingredients.length > 0) {
        product.ingredients = mergeUniqueStrings(
          product.ingredients ?? [],
          ingredients
        );
      }
      if (mediaLinks !== undefined && mediaLinks.length > 0) {
        product.mediaLinks = mergeUniqueBy(
          product.mediaLinks ?? [],
          mediaLinks,
          (m) => m.url
        );
      }
      if (sourceUrl !== undefined) product.sourceUrl = sourceUrl;

      // Add this compound to product.compoundIds (canonical)
      if (
        !product.compoundIds.some((cid: mongoose.Types.ObjectId) =>
          cid.equals(compoundId)
        )
      ) {
        product.compoundIds.push(compoundId);
      }

      await product.save();
    } else {
      // Create new
      if (!name) {
        throw new Error(
          "productsNested entry requires 'name' when neither 'id' nor an existing product by name is found"
        );
      }

      // Note: New products require businessId (required field in schema)
      // This is a limitation - nested product creation needs a business
      throw new Error(
        "Cannot create new product via nested input - products require a businessId. Please create the product separately or provide an existing product id."
      );
    }

    productIds.push(product._id);
  }

  return productIds;
}

// ============================================================================
//  RICH RELATION UPDATE (NESTED INPUTS)
// ============================================================================

/**
 * Rich relation update:
 *
 * Handles:
 * - productIds / productsNested
 *
 * Canonical side:
 * - Products: Product.compoundIds
 *
 * Mirror:
 * - Compound.productIds <- Compound.syncProductsForCompound(compoundId)
 *
 * Note: NO automatic middleware handles Product.compoundIds changes!
 * We must manually call Compound.syncProductsForCompound() after updating products.
 */
export async function updateCompoundWithRelationFields(
  input: CompoundUpdateRelationFieldsInput
): Promise<ICompound | null> {
  const { id, productIds, productsNested } = input;

  const compound = await Compound.findById(id);
  if (!compound) return null;

  const compoundId = compound._id;

  // --- Products: update via Product.compoundIds (canonical) -----------------

  if (productIds && productIds.length > 0) {
    await validateEntitiesExist(Product, productIds, "Product");

    // Add this compound to the products' compoundIds arrays (canonical)
    await Product.updateMany(
      { _id: { $in: productIds } },
      { $addToSet: { compoundIds: compoundId } }
    );
  }

  if (productsNested) {
    const nestedProductIds = await upsertProductsNested(
      productsNested,
      compoundId
    );
    // No need to set compound.productIds directly; we'll recompute from Products
    if (nestedProductIds.length > 0) {
      // Already updated in upsertProductsNested via product.save()
    }
  }

  // Recompute Compound.productIds mirror from Product.compoundIds
  await Compound.syncProductsForCompound(compoundId);

  return compound;
}
