import mongoose from "mongoose";
import { Business, IBusiness, IBusinessExecutive } from "../models/Business";
import { Person } from "../models/Person";
import { Product } from "../models/Product";
import { Episode } from "../models/Episode";
import {
  BusinessCreateWithOptionalIdsInput,
  BusinessUpdateWithOptionalIdsInput,
  BusinessUpdateRelationFieldsInput,
  BusinessOwnerNestedInput,
  BusinessProductNestedInput,
  BusinessEpisodeNestedInput,
  BusinessExecutiveRelationInput,
} from "../graphql/inputs/businessInputs";

// ========== UTILITY FUNCTIONS ==========

function toObjectIds(ids: string[]): mongoose.Types.ObjectId[] {
  return ids.map((id) => new mongoose.Types.ObjectId(id));
}

async function validateEntitiesExist<T extends mongoose.Document>(
  model: mongoose.Model<T>,
  ids: string[],
  entityType: string
): Promise<void> {
  if (!ids || ids.length === 0) return;

  // Batch query for all IDs at once (more efficient than individual queries)
  const existingEntities = await model
    .find({ _id: { $in: ids } })
    .select("_id")
    .lean();

  const existingIds = new Set(
    existingEntities.map((e: any) => e._id.toString())
  );

  // Check if any IDs are missing
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

/**
 * Simple create: scalars + optional owner/product IDs.
 * - Does NOT do any nested upsert.
 * - Relies on Business.syncPersonLinks + Product.syncProductsForBusiness
 *   to keep reverse relations in sync.
 */

function mapExecutivesInput(
  executives: BusinessExecutiveRelationInput[] | undefined
): IBusinessExecutive[] {
  if (!executives) return [];
  const seen = new Set<string>();
  const result: IBusinessExecutive[] = [];

  for (const exec of executives) {
    const key = exec.personId;
    if (seen.has(key)) continue;
    seen.add(key);

    result.push({
      personId: new mongoose.Types.ObjectId(exec.personId),
      title: exec.title,
      role: exec.role,
    });
  }

  return result;
}
export async function createBusinessWithOptionalIds(
  input: BusinessCreateWithOptionalIdsInput
): Promise<IBusiness> {
  const {
    name,
    description,
    website,
    mediaLinks,
    ownerIds,
    productIds,
    executives,
    sponsorEpisodeIds,
  } = input;

  // Validate all referenced entities exist before creating
  if (ownerIds && ownerIds.length > 0) {
    await validateEntitiesExist(Person, ownerIds, "Owner");
  }
  if (productIds && productIds.length > 0) {
    await validateEntitiesExist(Product, productIds, "Product");
  }
  if (executives && executives.length > 0) {
    const executivePersonIds = executives.map((e) => e.personId);
    await validateEntitiesExist(Person, executivePersonIds, "Executive Person");
  }
  if (sponsorEpisodeIds && sponsorEpisodeIds.length > 0) {
    await validateEntitiesExist(Episode, sponsorEpisodeIds, "Episode");
  }

  const ownerObjectIds = ownerIds ? toObjectIds(ownerIds) : [];
  const productObjectIds = productIds ? toObjectIds(productIds) : [];
  const episodeObjectIds = sponsorEpisodeIds
    ? toObjectIds(sponsorEpisodeIds)
    : [];
  const executiveSubdocs: IBusinessExecutive[] = mapExecutivesInput(executives);

  const business = await Business.create({
    name,
    description,
    website,
    mediaLinks,
    ownerIds: ownerObjectIds,
    productIds: productObjectIds,
    executives: executiveSubdocs,
    sponsorEpisodeIds: episodeObjectIds,
  });

  // Sync Person.businessIds
  await Business.syncPersonLinks(business);

  // Sync Business.productIds based on Products that reference it
  await Product.syncProductsForBusiness(business._id);

  // Sync Episodes
  if (sponsorEpisodeIds && sponsorEpisodeIds.length > 0) {
    for (const eid of sponsorEpisodeIds) {
      await Episode.syncSponsorBusinessesForEpisode(
        new mongoose.Types.ObjectId(eid)
      );
    }
  }

  return business;
}

/**
 * Simple update: scalars + optional owner/product IDs.
 *
 * Semantics:
 * - ownerIds: treated as "add these owners" (merge + dedupe, no removals).
 * - productIds: treated as "attach these products to this business"
 *   (merge + dedupe) and then we call Product.syncProductsForBusiness.
 */
export async function updateBusinessWithOptionalIds(
  input: BusinessUpdateWithOptionalIdsInput
): Promise<IBusiness | null> {
  const {
    id,
    name,
    description,
    website,
    mediaLinks,
    ownerIds,
    productIds,
    sponsorEpisodeIds,
  } = input;

  const business = await Business.findById(id);
  if (!business) return null;

  if (name !== undefined) business.name = name;
  if (description !== undefined) business.description = description;
  if (website !== undefined) business.website = website;
  if (mediaLinks !== undefined) business.mediaLinks = mediaLinks;

  const businessId = business._id;

  // --- Owners: merge, dedupe, no removals here ---

  if (ownerIds !== undefined && ownerIds.length > 0) {
    // Batch validate all owners exist (more efficient than one-by-one)
    await validateEntitiesExist(Person, ownerIds, "Owner");
    business.ownerIds = mergeAndDedupeIds(business.ownerIds, ownerIds);
  }

  // --- Products: merge, dedupe, then sync from Product side ---

  if (productIds !== undefined && productIds.length > 0) {
    // Batch validate all products exist (more efficient than one-by-one)
    await validateEntitiesExist(Product, productIds, "Product");

    const mergedIds = Array.from(
      new Set([
        ...business.productIds.map((id) => id.toString()),
        ...productIds,
      ])
    );
    business.productIds = toObjectIds(mergedIds);

    // Ensure these products are pointing to this business
    await Product.updateMany(
      { _id: { $in: productIds } },
      { $set: { businessId } }
    );

    // And now recompute Business.productIds from Products
    await Product.syncProductsForBusiness(businessId);
  }

  // --- Episodes: merge, dedupe, then sync from Episode side ---

  if (sponsorEpisodeIds !== undefined && sponsorEpisodeIds.length > 0) {
    await validateEntitiesExist(Episode, sponsorEpisodeIds, "Episode");
    business.sponsorEpisodeIds = mergeAndDedupeIds(
      business.sponsorEpisodeIds,
      sponsorEpisodeIds
    );

    // Sync each affected episode
    for (const eid of sponsorEpisodeIds) {
      await Episode.syncSponsorBusinessesForEpisode(
        new mongoose.Types.ObjectId(eid)
      );
    }
  }

  await business.save();
  await Business.syncPersonLinks(business);

  // Recompute from reverse side for consistency
  await Business.syncSponsorEpisodesForBusiness(businessId);

  return business;
}

/**
 * Nested upsert for owners (Person).
 *
 * Rules:
 * - If id is provided: update Person by id.
 * - Else if name is provided: find Person by name (unique),
 *   update if exists, otherwise create.
 * - Returns list of resulting ObjectIds.
 */
async function upsertOwnersNested(
  ownersNested: BusinessOwnerNestedInput[] | undefined,
  businessId: mongoose.Types.ObjectId
): Promise<mongoose.Types.ObjectId[]> {
  if (!ownersNested || ownersNested.length === 0) return [];

  const ownerIds: mongoose.Types.ObjectId[] = [];

  for (const ownerInput of ownersNested) {
    const { id, name, role, bio, mediaLinks } = ownerInput;

    let person: any | null = null;

    if (id) {
      person = await Person.findById(id);
      if (!person) {
        // Fallback: if name is provided, try by unique name
        if (name) {
          person = await Person.findOne({ name });
        }
      }
    } else if (name) {
      person = await Person.findOne({ name });
    }

    if (person) {
      // update existing
      if (name !== undefined) person.name = name;
      if (role !== undefined) person.role = role;
      if (bio !== undefined) person.bio = bio;
      if (mediaLinks !== undefined) person.mediaLinks = mediaLinks;
      await person.save();
    } else {
      // create new
      if (!name) {
        throw new Error(
          "ownersNested entry requires 'name' when neither 'id' nor an existing person by name is found"
        );
      }

      person = await Person.create({
        name,
        role,
        bio,
        mediaLinks,
        businessIds: [businessId],
      });
    }

    ownerIds.push(person._id);
  }

  return ownerIds;
}

/**
 * Nested upsert for products (Product).
 *
 * Rules:
 * - If id is provided: update Product by id.
 * - Else if name is provided: find Product by name (unique),
 *   update if exists, otherwise create.
 * - Always sets product.businessId to the businessId.
 * - Returns list of resulting ObjectIds.
 */
async function upsertProductsNested(
  productsNested: BusinessProductNestedInput[] | undefined,
  businessId: mongoose.Types.ObjectId
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
        // Fallback to unique name
        product = await Product.findOne({ name });
      }
    } else if (name) {
      product = await Product.findOne({ name });
    }

    if (product) {
      if (name !== undefined) product.name = name;
      if (description !== undefined) product.description = description;
      if (ingredients !== undefined) product.ingredients = ingredients;
      if (mediaLinks !== undefined) product.mediaLinks = mediaLinks;
      if (sourceUrl !== undefined) product.sourceUrl = sourceUrl;

      product.businessId = businessId;
      await product.save();
    } else {
      if (!name) {
        throw new Error(
          "productsNested entry requires 'name' when neither 'id' nor an existing product by name is found"
        );
      }

      product = await Product.create({
        name,
        description,
        ingredients: ingredients ?? [],
        mediaLinks,
        sponsorEpisodes: [],
        sourceUrl,
        compoundIds: [],
        businessId,
      });
    }

    productIds.push(product._id);
  }

  return productIds;
}

/**
 * Nested upsert for episodes.
 *
 * Rules:
 * - If id is provided: update Episode by id.
 * - Else if number is provided: find Episode by number (unique),
 *   update if exists, otherwise create.
 * - Returns list of resulting ObjectIds.
 */
async function upsertEpisodesNested(
  episodesNested: BusinessEpisodeNestedInput[] | undefined,
  businessId: mongoose.Types.ObjectId
): Promise<mongoose.Types.ObjectId[]> {
  if (!episodesNested || episodesNested.length === 0) return [];

  const episodeIds: mongoose.Types.ObjectId[] = [];

  for (const episodeInput of episodesNested) {
    const { id, number, title, publishedAt, mediaLinks } = episodeInput;

    let episode: any | null = null;

    if (id) {
      episode = await Episode.findById(id);
      if (!episode && number !== undefined) {
        episode = await Episode.findOne({ number });
      }
    } else if (number !== undefined) {
      episode = await Episode.findOne({ number });
    }

    if (episode) {
      // Update existing
      if (title !== undefined) episode.title = title;
      if (publishedAt !== undefined) episode.publishedAt = publishedAt;
      if (mediaLinks !== undefined) episode.mediaLinks = mediaLinks;

      // Add this business to episode's sponsors
      if (
        !episode.sponsorBusinessIds.some((bid: any) => bid.equals(businessId))
      ) {
        episode.sponsorBusinessIds.push(businessId);
      }

      await episode.save();
    } else {
      // Create new
      if (number === undefined || !title) {
        throw new Error(
          "episodesNested entry requires 'number' and 'title' when neither 'id' nor an existing episode by number is found"
        );
      }

      episode = await Episode.create({
        number,
        title,
        publishedAt,
        mediaLinks,
        guestIds: [],
        takeaways: [],
        sponsorBusinessIds: [businessId],
      });
    }

    episodeIds.push(episode._id);
  }

  return episodeIds;
}

/**
 * Map executive input to subdocs.
 */

/**
 * Rich relation update:
 * - ownerIds / ownersNested (merged, deduped, no implicit removals)
 * - productIds / productsNested (merged, deduped, no implicit removals)
 * - executives (explicit list)
 *
 * Person ↔ Business consistency:
 * - Business.syncPersonLinks(business) will:
 *   - Add business to Persons that are owners or executives
 *   - Remove business from Persons who are no longer owners nor execs
 *
 * Product ↔ Business consistency:
 * - Product.syncProductsForBusiness(businessId) recomputes Business.productIds
 *   from the product side.
 */
export async function updateBusinessWithRelationFields(
  input: BusinessUpdateRelationFieldsInput
): Promise<IBusiness | null> {
  const {
    id,
    ownerIds,
    ownersNested,
    productIds,
    productsNested,
    executives,
    sponsorEpisodeIds,
    sponsorEpisodesNested,
  } = input;

  const business = await Business.findById(id);
  if (!business) return null;

  const businessId = business._id;

  // --- Owners: merge & dedupe with existing set ---

  if (ownerIds !== undefined && ownerIds.length > 0) {
    await validateEntitiesExist(Person, ownerIds, "Owner");
    business.ownerIds = mergeAndDedupeIds(business.ownerIds, ownerIds);
  }

  if (ownersNested !== undefined) {
    const nestedOwnerIds = await upsertOwnersNested(ownersNested, businessId);
    business.ownerIds = mergeAndDedupeIds(
      business.ownerIds,
      nestedOwnerIds.map((id) => id.toString())
    );
  }

  // --- Products: merge & dedupe with existing set, then sync from Product side ---

  if (productIds !== undefined && productIds.length > 0) {
    await validateEntitiesExist(Product, productIds, "Product");
    const mergedIds = Array.from(
      new Set([
        ...business.productIds.map((id) => id.toString()),
        ...productIds,
      ])
    );
    business.productIds = toObjectIds(mergedIds);

    await Product.updateMany(
      { _id: { $in: productIds } },
      { $set: { businessId } }
    );
  }

  if (productsNested !== undefined) {
    const nestedProductIds = await upsertProductsNested(
      productsNested,
      businessId
    );
    business.productIds = mergeAndDedupeIds(
      business.productIds,
      nestedProductIds.map((id) => id.toString())
    );
  }

  // Recompute Business.productIds based on Products that reference this business
  await Product.syncProductsForBusiness(businessId);

  // --- Episodes: merge & dedupe with existing set, then sync from Episode side ---

  if (sponsorEpisodeIds !== undefined && sponsorEpisodeIds.length > 0) {
    await validateEntitiesExist(Episode, sponsorEpisodeIds, "Episode");
    business.sponsorEpisodeIds = mergeAndDedupeIds(
      business.sponsorEpisodeIds,
      sponsorEpisodeIds
    );

    // Sync affected episodes
    for (const eid of sponsorEpisodeIds) {
      await Episode.syncSponsorBusinessesForEpisode(
        new mongoose.Types.ObjectId(eid)
      );
    }
  }

  if (sponsorEpisodesNested !== undefined) {
    const nestedEpisodeIds = await upsertEpisodesNested(
      sponsorEpisodesNested,
      businessId
    );
    business.sponsorEpisodeIds = mergeAndDedupeIds(
      business.sponsorEpisodeIds,
      nestedEpisodeIds.map((id) => id.toString())
    );

    // Sync affected episodes
    for (const eid of nestedEpisodeIds) {
      await Episode.syncSponsorBusinessesForEpisode(eid);
    }
  }

  // Recompute Business.sponsorEpisodeIds based on Episodes that reference this business
  await Business.syncSponsorEpisodesForBusiness(businessId);

  // --- Executives (explicit list; overwrite makes sense here) ---

  if (executives !== undefined && executives.length > 0) {
    const executivePersonIds = executives.map((e) => e.personId);
    await validateEntitiesExist(Person, executivePersonIds, "Executive Person");
    business.executives = mapExecutivesInput(executives);
  } else if (executives !== undefined && executives.length === 0) {
    // Explicitly clearing executives
    business.executives = [];
  }

  await business.save();
  await Business.syncPersonLinks(business);

  return business;
}
