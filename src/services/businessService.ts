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

  const existingIds = new Set(existingEntities.map((e) => e._id.toString()));

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

/**
 * Create a Business and optionally connect owners, products, episodes, and executives.
 *
 * Relationship rules:
 *
 * - Owners / Executives:
 *   - Business.ownerIds + Business.executives.personId are canonical.
 *   - Person.businessIds is a mirror, maintained by Business.syncPersonLinks()
 *     and/or Business middleware.
 *
 * - Products:
 *   - Product.businessId is canonical.
 *   - Business.productIds is a mirror, maintained by Product.syncProductsForBusiness()
 *     and/or Product middleware.
 *
 * - Episodes (sponsors):
 *   - Episode.sponsorBusinessIds is canonical.
 *   - Business.sponsorEpisodeIds is a mirror, maintained by
 *     Business.syncSponsorEpisodesForBusiness(businessId) and/or Episode middleware.
 */

export async function createBusinessWithOptionalIds(
  input: BusinessCreateWithOptionalIdsInput
): Promise<IBusiness> {
  const {
    name,
    description,
    website,
    biography,
    mediaLinks,
    ownerIds,
    productIds,
    executives,
    sponsorEpisodeIds,
  } = input;

  // --- 1) Validate all referenced entities exist up front -------------------

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

  // --- 2) Create the Business (canonical owner/executive side) -------------

  const ownerObjectIds = ownerIds ? toObjectIds(ownerIds) : [];
  const executiveSubdocs: IBusinessExecutive[] = mapExecutivesInput(executives);

  // We do NOT rely on productIds / sponsorEpisodeIds here as canonical.
  // They will be recomputed from Product.businessId and Episode.sponsorBusinessIds.
  const business = await Business.create({
    name,
    description,
    website,
    biography,
    mediaLinks,
    ownerIds: ownerObjectIds,
    productIds: [],
    executives: executiveSubdocs,
    sponsorEpisodeIds: [],
  });

  const businessId = business._id;

  // --- 3) Attach Products to this Business (Product is canonical) ----------

  if (productIds && productIds.length > 0) {
    // Set Product.businessId for the given products.
    await Product.updateMany(
      { _id: { $in: productIds } },
      { $set: { businessId } }
    );

    // Recompute Business.productIds from all products pointing at this business.
    await Product.syncProductsForBusiness(businessId);
  }

  // --- 4) Attach this Business as sponsor on Episodes (Episode is canonical) -

  if (sponsorEpisodeIds && sponsorEpisodeIds.length > 0) {
    await Episode.updateMany(
      { _id: { $in: sponsorEpisodeIds } },
      { $addToSet: { sponsorBusinessIds: businessId } }
    );

    // Recompute Business.sponsorEpisodeIds from all episodes that reference it.
    await Business.syncSponsorEpisodesForBusiness(businessId);
  }

  // --- 5) Sync Person.businessIds based on owners + executives -------------

  await Business.syncPersonLinks(business);

  return business;
}

// ============================================================================
//  SIMPLE UPDATE: SCALARS + OPTIONAL OWNER / PRODUCT / EPISODE IDS
// ============================================================================

/**
 * Simple update: scalar fields + optional owners/products/episodes.
 *
 * Semantics:
 *
 * - ownerIds:
 *   - Merge + dedupe into Business.ownerIds (canonical).
 *   - Person.businessIds is updated via Business.syncPersonLinks(business).
 *
 * - productIds:
 *   - Treated as "attach these products to this business".
 *   - We update Product.businessId (canonical).
 *   - Then Product.syncProductsForBusiness(businessId) recomputes
 *     Business.productIds as a mirror.
 *
 * - sponsorEpisodeIds:
 *   - Treated as "attach this business as sponsor to these episodes".
 *   - We update Episode.sponsorBusinessIds (canonical).
 *   - Then Business.syncSponsorEpisodesForBusiness(businessId) recomputes
 *     Business.sponsorEpisodeIds as a mirror.
 */
export async function updateBusinessWithOptionalIds(
  input: BusinessUpdateWithOptionalIdsInput
): Promise<IBusiness | null> {
  const {
    id,
    name,
    description,
    website,
    biography,
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
  if (biography !== undefined) business.biography = biography;
  if (mediaLinks !== undefined) business.mediaLinks = mediaLinks;

  const businessId = business._id;

  // --- Owners: merge + dedupe (canonical: Business.ownerIds) ---------------

  if (ownerIds && ownerIds.length > 0) {
    await validateEntitiesExist(Person, ownerIds, "Owner");
    business.ownerIds = mergeAndDedupeIds(business.ownerIds, ownerIds);
  }

  // --- Products: attach via Product.businessId (canonical) ------------------

  if (productIds && productIds.length > 0) {
    await validateEntitiesExist(Product, productIds, "Product");

    // Attach these products to this business (no implicit removals).
    await Product.updateMany(
      { _id: { $in: productIds } },
      { $set: { businessId } }
    );

    // Recompute Business.productIds from Product.businessId.
    await Product.syncProductsForBusiness(businessId);
  }

  // --- Episodes: attach via Episode.sponsorBusinessIds (canonical) ---------

  if (sponsorEpisodeIds && sponsorEpisodeIds.length > 0) {
    await validateEntitiesExist(Episode, sponsorEpisodeIds, "Episode");

    await Episode.updateMany(
      { _id: { $in: sponsorEpisodeIds } },
      { $addToSet: { sponsorBusinessIds: businessId } }
    );

    // Recompute Business.sponsorEpisodeIds from Episode.sponsorBusinessIds.
    await Business.syncSponsorEpisodesForBusiness(businessId);
  }

  // Persist scalar + owner changes.
  await business.save();

  // Update Person.businessIds mirror.
  await Business.syncPersonLinks(business);

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
// ============================================================================
//  NESTED UPSERT HELPERS
// ============================================================================

/**
 * Nested upsert for owners (Person).
 *
 * Rules:
 * - If id is provided: update Person by id.
 * - Else if name is provided: find Person by unique name,
 *   update if exists, otherwise create.
 *
 * Note:
 * - When creating new Person, we can pre-seed businessIds: [businessId],
 *   but the *canonical* link is Business.ownerIds / executives.
 *   Business.syncPersonLinks() will keep Person.businessIds correct.
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
      if (!person && name) {
        person = await Person.findOne({ name });
      }
    } else if (name) {
      person = await Person.findOne({ name });
    }

    if (person) {
      if (name !== undefined) person.name = name;
      if (role !== undefined) person.role = role;
      if (bio !== undefined) person.bio = bio;
      if (mediaLinks !== undefined) person.mediaLinks = mediaLinks;
      await person.save();
    } else {
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
        businessIds: [businessId], // convenience; Business.syncPersonLinks is still the canonical maintainer
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
 * - Else if name is provided: find Product by unique name,
 *   update if exists, otherwise create.
 * - Always sets product.businessId to the given businessId (canonical side).
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
      product.businessId = businessId; // canonical link
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
        sourceUrl,
        compoundIds: [],
        businessId, // canonical link
      });
    }

    productIds.push(product._id);
  }

  return productIds;
}

async function upsertEpisodesNested(
  episodesNested: BusinessEpisodeNestedInput[] | undefined,
  businessId: mongoose.Types.ObjectId
): Promise<mongoose.Types.ObjectId[]> {
  if (!episodesNested || episodesNested.length === 0) return [];

  const episodeIds: mongoose.Types.ObjectId[] = [];

  for (const episodeInput of episodesNested) {
    const {
      id, // optional: upsert by id if present
      channelName,
      episodeNumber,
      episodeTitle,
      summaryShort,
      webPageSummary,
      publishedAt,
      mediaLinks,
      summaryDetailed,
      youtubeEmbedUrl,
      youtubeVideoId,
      youtubeWatchUrl,
      takeaways,
      s3TranscriptKey,
      s3TranscriptUrl,
      sponsorLinkObjects,
      webPageTimelines, // NOTE: input name; schema field is webPagTimelines
      episodePageUrl,
      episodeTranscriptUrl,
    } = episodeInput;

    let episode: IEpisode | null = null;

    // 1) Try by id (if provided)
    if (id) {
      episode = await Episode.findById(id);
    }

    // 2) If not found and we have channelName + episodeNumber, try that combo
    if (!episode && channelName && episodeNumber !== undefined) {
      episode = await Episode.findOne({ channelName, episodeNumber });
    }

    // 3) As a weaker fallback, try just episodeNumber if present
    if (!episode && episodeNumber !== undefined) {
      episode = await Episode.findOne({ episodeNumber });
    }

    if (episode) {
      // ---------------- UPDATE EXISTING EPISODE ----------------
      if (channelName !== undefined) episode.channelName = channelName;
      if (episodeNumber !== undefined) episode.episodeNumber = episodeNumber;
      if (episodeTitle !== undefined) episode.episodeTitle = episodeTitle;
      if (episodePageUrl !== undefined) episode.episodePageUrl = episodePageUrl;
      if (episodeTranscriptUrl !== undefined)
        episode.episodeTranscriptUrl = episodeTranscriptUrl;
      if (publishedAt !== undefined) episode.publishedAt = publishedAt;

      if (summaryShort !== undefined) episode.summaryShort = summaryShort;
      if (webPageSummary !== undefined) episode.webPageSummary = webPageSummary;
      if (summaryDetailed !== undefined)
        episode.summaryDetailed = summaryDetailed;

      if (mediaLinks !== undefined) episode.mediaLinks = mediaLinks;

      if (webPageTimelines !== undefined) {
        // schema field is webPagTimelines (typo), so map to that
        (episode as any).webPagTimelines = webPageTimelines;
      }

      if (sponsorLinkObjects !== undefined) {
        episode.sponsorLinkObjects = sponsorLinkObjects;
      }

      if (youtubeVideoId !== undefined) episode.youtubeVideoId = youtubeVideoId;
      if (youtubeWatchUrl !== undefined)
        episode.youtubeWatchUrl = youtubeWatchUrl;
      if (youtubeEmbedUrl !== undefined)
        episode.youtubeEmbedUrl = youtubeEmbedUrl;

      if (takeaways !== undefined) episode.takeaways = takeaways;
      if (s3TranscriptKey !== undefined)
        episode.s3TranscriptKey = s3TranscriptKey;
      if (s3TranscriptUrl !== undefined)
        episode.s3TranscriptUrl = s3TranscriptUrl;

      // Ensure this business is in sponsorBusinessIds (canonical link)
      if (
        !episode.sponsorBusinessIds.some((bid) => bid.equals(businessId as any))
      ) {
        episode.sponsorBusinessIds.push(businessId);
      }

      await episode.save();
    } else {
      // ---------------- CREATE NEW EPISODE ----------------
      // For a brand new episode we require at least:
      //   - channelName (required by schema)
      //   - episodeNumber (for uniqueness + lookup)
      //   - episodeTitle (sane minimum for content)
      if (!channelName || episodeNumber === undefined || !episodeTitle) {
        throw new Error(
          "episodesNested entry requires 'channelName', 'episodeNumber', and 'episodeTitle' when neither 'id' nor an existing episode can be found"
        );
      }

      const episodeDoc = await Episode.create({
        channelName,
        episodeNumber,
        episodeTitle,
        episodePageUrl,
        episodeTranscriptUrl,
        publishedAt,
        summaryShort,
        webPageSummary,
        mediaLinks,
        webPagTimelines: webPageTimelines, // map input → schema field
        sponsorLinkObjects,
        summaryDetailed,
        youtubeVideoId,
        youtubeWatchUrl,
        youtubeEmbedUrl,
        takeaways: takeaways ?? [],
        s3TranscriptKey,
        s3TranscriptUrl,
        guestIds: [], // guests are independent; you can wire later
        sponsorBusinessIds: [businessId], // canonical sponsor link
      });

      episode = episodeDoc;
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
// ============================================================================
//  RICH RELATION UPDATE (NESTED INPUTS)
// ============================================================================

/**
 * Rich relation update:
 *
 * Handles:
 * - ownerIds / ownersNested
 * - productIds / productsNested
 * - executives
 * - sponsorEpisodeIds / sponsorEpisodesNested
 *
 * Canonical sides:
 * - Owners/executives: Business.ownerIds + Business.executives.personId
 * - Products: Product.businessId
 * - Episodes: Episode.sponsorBusinessIds
 *
 * Mirrors:
 * - Person.businessIds    <- Business.syncPersonLinks(business)
 * - Business.productIds   <- Product.syncProductsForBusiness(businessId)
 * - Business.sponsorEpisodeIds <- Business.syncSponsorEpisodesForBusiness(businessId)
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

  // --- Owners: merge + dedupe (canonical: Business.ownerIds) ---------------

  if (ownerIds && ownerIds.length > 0) {
    await validateEntitiesExist(Person, ownerIds, "Owner");
    business.ownerIds = mergeAndDedupeIds(business.ownerIds, ownerIds);
  }

  if (ownersNested) {
    const nestedOwnerIds = await upsertOwnersNested(ownersNested, businessId);
    business.ownerIds = mergeAndDedupeIds(
      business.ownerIds,
      nestedOwnerIds.map((id) => id.toString())
    );
  }

  // --- Products: via Product.businessId (canonical) -------------------------

  if (productIds && productIds.length > 0) {
    await validateEntitiesExist(Product, productIds, "Product");

    await Product.updateMany(
      { _id: { $in: productIds } },
      { $set: { businessId } }
    );
  }

  if (productsNested) {
    const nestedProductIds = await upsertProductsNested(
      productsNested,
      businessId
    );
    // no need to set business.productIds directly; we'll recompute from Products
    if (nestedProductIds.length > 0) {
      await Product.updateMany(
        { _id: { $in: nestedProductIds } },
        { $set: { businessId } }
      );
    }
  }

  // Recompute Business.productIds mirror.
  await Product.syncProductsForBusiness(businessId);

  // --- Episodes: via Episode.sponsorBusinessIds (canonical) -----------------

  if (sponsorEpisodeIds && sponsorEpisodeIds.length > 0) {
    await validateEntitiesExist(Episode, sponsorEpisodeIds, "Episode");

    await Episode.updateMany(
      { _id: { $in: sponsorEpisodeIds } },
      { $addToSet: { sponsorBusinessIds: businessId } }
    );
  }

  if (sponsorEpisodesNested) {
    const nestedEpisodeIds = await upsertEpisodesNested(
      sponsorEpisodesNested,
      businessId
    );

    if (nestedEpisodeIds.length > 0) {
      await Episode.updateMany(
        { _id: { $in: nestedEpisodeIds } },
        { $addToSet: { sponsorBusinessIds: businessId } }
      );
    }
  }

  // Recompute Business.sponsorEpisodeIds mirror.
  await Business.syncSponsorEpisodesForBusiness(businessId);

  // --- Executives: explicit list (canonical: Business.executives) ----------

  if (executives !== undefined) {
    if (executives.length > 0) {
      const executivePersonIds = executives.map((e) => e.personId);
      await validateEntitiesExist(
        Person,
        executivePersonIds,
        "Executive Person"
      );
      business.executives = mapExecutivesInput(executives);
    } else {
      // Explicitly clear executives when an empty array is provided.
      business.executives = [];
    }
  }

  // Persist changes to business (owners + executives).
  await business.save();

  // Sync Person.businessIds mirror from owners + executives.
  await Business.syncPersonLinks(business);

  return business;
}
