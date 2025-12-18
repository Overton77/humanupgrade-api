import mongoose, { ClientSession } from "mongoose";
import {
  Business,
  IBusiness,
  IBusinessExecutive,
  BusinessDoc,
  BusinessModel,
} from "../models/Business.js";
import { Person, PersonDoc } from "../models/Person.js";
import { Product, ProductDoc } from "../models/Product.js";
import { Episode, EpisodeDoc } from "../models/Episode.js";
import {
  BusinessCreateRelationsInput,
  BusinessUpdateWithOptionalIdsInput,
  BusinessUpdateRelationFieldsInput,
  BusinessOwnerNestedInput,
  BusinessProductNestedInput,
  BusinessEpisodeNestedInput,
  BusinessExecutiveNestedInput,
} from "../graphql/inputs/businessInputs.js";
import {
  BusinessCreateWithOptionalIdsInputSchema,
  BusinessUpdateWithOptionalIdsInputSchema,
  BusinessUpdateWithRelationFieldsInputSchema,
  BusinessOwnerNestedInputSchema,
  BusinessProductNestedInputSchema,
  BusinessEpisodeNestedInputSchema,
  BusinessCreateWithRelationsInputSchema,
  BusinessExecutiveNestedInputSchema,
} from "../graphql/inputs/schemas/businessSchemas.js";
import { BaseService } from "./BaseService.js";
import { mapExecutivesInput } from "./utils/mapping.js";
import { toObjectIds, norm, executiveKey } from "./utils/general.js";
import {
  mergeAndDedupeIds,
  mergeUniqueStrings,
  mergeUniqueBy,
  dedupeObjectIds,
} from "./utils/merging.js";
import { validateInput } from "../lib/validation.js";
import { withTransaction } from "../lib/transactions.js";
import { MediaLink } from "../models/MediaLink.js";
import { Errors } from "../lib/errors.js";

/**
 * Business Service
 *
 * Relationship rules:
 *
 * - Owners / Executives:
 *   - Business.ownerIds + Business.executives.personId are canonical.
 *   - Person.businessIds is a mirror, maintained by Business.syncPersonLinks()
 *
 * - Products:
 *   - Product.businessId is canonical.
 *   - Business.productIds is a mirror, maintained by Product.syncProductsForBusiness()
 *
 * - Episodes (sponsors):
 *   - Episode.sponsorBusinessIds is canonical.
 *   - Business.sponsorEpisodeIds is a mirror, maintained by
 *     Business.syncSponsorEpisodesForBusiness(businessId)
 */
class BusinessService extends BaseService<
  IBusiness,
  BusinessDoc,
  BusinessModel
> {
  constructor() {
    super(Business, "businessService", "Business");
  }

  private async upsertOwnersNested(
    ownersNested: BusinessOwnerNestedInput[],
    businessId: mongoose.Types.ObjectId,
    session: ClientSession
  ): Promise<mongoose.Types.ObjectId[]> {
    const ownerIds: mongoose.Types.ObjectId[] = [];

    for (const ownerInput of ownersNested) {
      const validated = validateInput(
        BusinessOwnerNestedInputSchema,
        ownerInput,
        "BusinessOwnerNestedInput"
      );

      const { id, name, role, bio, mediaLinks } = validated;

      let person: PersonDoc | null = null;

      if (id) {
        person = await Person.findById(id).session(session);
        if (!person && name)
          person = await Person.findOne({ name }).session(session);
      } else if (name) {
        person = await Person.findOne({ name }).session(session);
      }

      const validMediaLinks = mediaLinks?.filter((m) => m.url) as
        | MediaLink[]
        | undefined;

      if (person) {
        if (name !== undefined) person.name = name;
        if (role !== undefined) person.role = role;
        if (bio !== undefined) person.bio = bio;
        if (mediaLinks !== undefined) person.mediaLinks = validMediaLinks;
        await person.save({ session });
      } else {
        if (!name)
          throw Errors.validation(
            "ownersNested requires 'name' when creating",
            "name"
          );
        const [created] = await Person.create(
          [
            {
              name,
              role,
              bio,
              mediaLinks: validMediaLinks,
            },
          ],
          { session }
        );
        person = created;
      }

      ownerIds.push(person._id);
    }

    return ownerIds;
  }

  private async upsertProductsNested(
    productsNested: BusinessProductNestedInput[],
    businessId: mongoose.Types.ObjectId,
    session: ClientSession
  ): Promise<mongoose.Types.ObjectId[]> {
    const productIds: mongoose.Types.ObjectId[] = [];

    for (const productInput of productsNested) {
      const validated = validateInput(
        BusinessProductNestedInputSchema,
        productInput,
        "BusinessProductNestedInput"
      );

      const { id, name, description, ingredients, mediaLinks, sourceUrl } =
        validated;

      let product: ProductDoc | null = null;

      if (id) {
        product = await Product.findById(id).session(session);
        if (!product && name)
          product = await Product.findOne({ name }).session(session);
      } else if (name) {
        product = await Product.findOne({ name }).session(session);
      }

      const validMediaLinks = mediaLinks?.filter((m) => m.url) as
        | MediaLink[]
        | undefined;

      if (product) {
        if (name !== undefined) product.name = name;
        if (description !== undefined) product.description = description;
        if (ingredients?.length) {
          product.ingredients = mergeUniqueStrings(
            product.ingredients ?? [],
            ingredients
          );
        }
        if (mediaLinks?.length) {
          product.mediaLinks = mergeUniqueBy(
            product.mediaLinks ?? [],
            validMediaLinks ?? [],
            (m: MediaLink) => m.url
          );
        }
        if (sourceUrl !== undefined) product.sourceUrl = sourceUrl;

        // canonical link
        product.businessId = businessId;
        await product.save({ session });
      } else {
        if (!name)
          throw Errors.validation(
            "productsNested requires 'name' when creating",
            "name"
          );

        const [created] = await Product.create(
          [
            {
              name,
              description,
              ingredients: ingredients ?? [],
              mediaLinks: validMediaLinks,
              sourceUrl,
              compoundIds: [],
              // canonical link
              businessId,
            },
          ],
          { session }
        );

        product = created;
      }

      productIds.push(product._id);
    }

    return productIds;
  }

  private async upsertEpisodesNested(
    episodesNested: BusinessEpisodeNestedInput[],
    businessId: mongoose.Types.ObjectId,
    session: ClientSession
  ): Promise<mongoose.Types.ObjectId[]> {
    const episodeIds: mongoose.Types.ObjectId[] = [];

    for (const episodeInput of episodesNested) {
      const validated = validateInput(
        BusinessEpisodeNestedInputSchema,
        episodeInput,
        "BusinessEpisodeNestedInput"
      );

      const {
        id,
        channelName,
        episodeNumber,
        episodeTitle,
        episodePageUrl,
        episodeTranscriptUrl,
        publishedAt,
        summaryShort,
        webPageSummary,
        summaryDetailed,
        youtubeVideoId,
        youtubeWatchUrl,
        youtubeEmbedUrl,
        takeaways,
        s3TranscriptKey,
        s3TranscriptUrl,
        mediaLinks,
        sponsorLinkObjects,
        webPageTimelines,
      } = validated;

      let episode: EpisodeDoc | null = null;

      if (id) episode = await Episode.findById(id).session(session);
      if (!episode && channelName && episodeNumber !== undefined) {
        episode = await Episode.findOne({ channelName, episodeNumber }).session(
          session
        );
      }
      if (!episode && episodeNumber !== undefined) {
        episode = await Episode.findOne({ episodeNumber }).session(session);
      }

      const validMediaLinks = mediaLinks?.filter((m) => m.url) as
        | MediaLink[]
        | undefined;

      if (episode) {
        if (channelName !== undefined) episode.channelName = channelName;
        if (episodeNumber !== undefined) episode.episodeNumber = episodeNumber;
        if (episodeTitle !== undefined) episode.episodeTitle = episodeTitle;
        if (episodePageUrl !== undefined)
          episode.episodePageUrl = episodePageUrl;
        if (episodeTranscriptUrl !== undefined)
          episode.episodeTranscriptUrl = episodeTranscriptUrl;
        if (publishedAt !== undefined) episode.publishedAt = publishedAt;
        if (summaryShort !== undefined) episode.summaryShort = summaryShort;
        if (webPageSummary !== undefined)
          episode.webPageSummary = webPageSummary;
        if (summaryDetailed !== undefined)
          episode.summaryDetailed = summaryDetailed;

        if (mediaLinks?.length) {
          episode.mediaLinks = mergeUniqueBy(
            episode.mediaLinks ?? [],
            validMediaLinks ?? [],
            (m) => m.url
          );
        }
        if (webPageTimelines?.length) {
          episode.webPageTimelines = mergeUniqueBy(
            episode.webPageTimelines ?? [],
            webPageTimelines,
            (t) => `${t.from}-${t.to}-${t.title ?? ""}`
          );
        }
        if (sponsorLinkObjects?.length) {
          episode.sponsorLinkObjects = mergeUniqueBy(
            episode.sponsorLinkObjects ?? [],
            sponsorLinkObjects,
            (s) => `${s.brand ?? ""}-${s.code ?? ""}-${s.text ?? ""}`
          );
        }
        if (takeaways?.length) {
          episode.takeaways = mergeUniqueStrings(
            episode.takeaways ?? [],
            takeaways
          );
        }

        if (youtubeVideoId !== undefined)
          episode.youtubeVideoId = youtubeVideoId;
        if (youtubeWatchUrl !== undefined)
          episode.youtubeWatchUrl = youtubeWatchUrl;
        if (youtubeEmbedUrl !== undefined)
          episode.youtubeEmbedUrl = youtubeEmbedUrl;
        if (s3TranscriptKey !== undefined)
          episode.s3TranscriptKey = s3TranscriptKey;
        if (s3TranscriptUrl !== undefined)
          episode.s3TranscriptUrl = s3TranscriptUrl;

        // canonical sponsor link
        if (!episode.sponsorBusinessIds.some((bid) => bid.equals(businessId))) {
          episode.sponsorBusinessIds.push(businessId);
        }

        await episode.save({ session });
      } else {
        if (!channelName || episodeNumber === undefined || !episodeTitle) {
          throw Errors.validation(
            "episodesNested requires channelName+episodeNumber+episodeTitle when creating",
            "episodeTitle"
          );
        }

        const [created] = await Episode.create(
          [
            {
              channelName,
              episodeNumber,
              episodeTitle,
              episodePageUrl,
              episodeTranscriptUrl,
              publishedAt,
              summaryShort,
              webPageSummary,
              summaryDetailed,
              youtubeVideoId,
              youtubeWatchUrl,
              youtubeEmbedUrl,
              takeaways: takeaways ?? [],
              s3TranscriptKey,
              s3TranscriptUrl,
              mediaLinks: validMediaLinks ?? [],
              sponsorLinkObjects: sponsorLinkObjects ?? [],
              webPageTimelines: webPageTimelines ?? [],
              guestIds: [],
              sponsorBusinessIds: [businessId], // canonical
            },
          ],
          { session }
        );

        episode = created;
      }

      episodeIds.push(episode._id);
    }

    return episodeIds;
  }

  async upsertExecutivesNested(
    executivesNested: BusinessExecutiveNestedInput[],
    session: ClientSession
  ): Promise<
    Array<{ personId: mongoose.Types.ObjectId; title?: string; role?: string }>
  > {
    const executives: Array<{
      personId: mongoose.Types.ObjectId;
      title?: string;
      role?: string;
    }> = [];

    for (const executiveInput of executivesNested) {
      const validated = validateInput(
        BusinessExecutiveNestedInputSchema,
        executiveInput,
        "BusinessExecutiveNestedInput"
      );

      const { name, title, role, mediaLinks } = validated;

      const [person] = await Person.create(
        [
          {
            name,
            role,
            mediaLinks: mediaLinks?.filter((m) => m.url) as
              | MediaLink[]
              | undefined,
          },
        ],
        { session }
      );

      executives.push({ personId: person._id, title, role });
    }

    return executives;
  }

  /**
   * Create a Business and optionally connect owners, products, episodes, and executives.
   */
  async createBusinessWithRelations(
    input: BusinessCreateRelationsInput
  ): Promise<BusinessDoc> {
    const validated = validateInput(
      BusinessCreateWithRelationsInputSchema,
      input,
      "BusinessCreateRelationsInput"
    );

    return withTransaction(
      async (session) => {
        if (validated.ownerIds?.length) {
          await this.validateEntities(Person, validated.ownerIds, "Owner", {
            session,
          });
        }
        if (validated.productIds?.length) {
          await this.validateEntities(
            Product,
            validated.productIds,
            "Product",
            { session }
          );
        }
        if (validated.sponsorEpisodeIds?.length) {
          await this.validateEntities(
            Episode,
            validated.sponsorEpisodeIds,
            "Episode",
            { session }
          );
        }
        if (validated.executives?.length) {
          const execPersonIds = validated.executives.map((e) => e.personId);
          await this.validateEntities(
            Person,
            execPersonIds,
            "Executive Person",
            { session }
          );
        }

        const validMediaLinks: MediaLink[] | undefined =
          validated.mediaLinks?.filter((m): m is MediaLink => !!m.url);

        const ownerObjectIds = validated.ownerIds
          ? toObjectIds(validated.ownerIds)
          : [];
        const execSubdocs: IBusinessExecutive[] = mapExecutivesInput(
          validated.executives
        );

        const [business] = await Business.create(
          [
            {
              name: validated.name,
              description: validated.description,
              website: validated.website,
              biography: validated.biography,
              mediaLinks: validMediaLinks,
              ownerIds: ownerObjectIds,
              executives: execSubdocs,

              productIds: [],
              sponsorEpisodeIds: [],
            },
          ],
          { session }
        );

        const businessId = business._id;

        if (validated.ownersNested?.length) {
          const nestedOwnerIds = await this.upsertOwnersNested(
            validated.ownersNested,
            businessId,
            session
          );

          business.ownerIds = mergeAndDedupeIds(
            business.ownerIds,
            nestedOwnerIds.map((id) => id.toString())
          );
        }

        if (validated.executivesNested?.length) {
          const nestedExecutives = await this.upsertExecutivesNested(
            validated.executivesNested,
            session
          );
          business.executives = mergeUniqueBy(
            business.executives ?? [],
            nestedExecutives,
            executiveKey
          );
        }

        await business.save({ session });

        const productIdsToAttach: mongoose.Types.ObjectId[] = [];

        if (validated.productsNested?.length) {
          const nestedProductIds = await this.upsertProductsNested(
            validated.productsNested,
            businessId,
            session
          );
          productIdsToAttach.push(...nestedProductIds);
        }

        if (validated.productIds?.length) {
          productIdsToAttach.push(...toObjectIds(validated.productIds));
        }

        for (const pid of dedupeObjectIds(productIdsToAttach)) {
          const product = await Product.findById(pid).session(session ?? null);
          if (!product) continue;
          product.businessId = businessId;
          await product.save({ session });
        }

        const episodeIdsToSponsor: mongoose.Types.ObjectId[] = [];

        if (validated.sponsorEpisodesNested?.length) {
          const nestedEpisodeIds = await this.upsertEpisodesNested(
            validated.sponsorEpisodesNested,
            businessId,
            session
          );
          episodeIdsToSponsor.push(...nestedEpisodeIds);
        }

        if (validated.sponsorEpisodeIds?.length) {
          episodeIdsToSponsor.push(...toObjectIds(validated.sponsorEpisodeIds));
        }

        for (const eid of dedupeObjectIds(episodeIdsToSponsor)) {
          const ep = await Episode.findById(eid).session(session ?? null);
          if (!ep) continue;
          if (!ep.sponsorBusinessIds.some((bid) => bid.equals(businessId))) {
            ep.sponsorBusinessIds.push(businessId);
            await ep.save({ session });
          }
        }

        return business;
      },
      { operation: "createBusinessWithRelations", businessName: validated.name }
    );
  }

  async updateBusinessWithOptionalIds(
    input: BusinessUpdateWithOptionalIdsInput
  ): Promise<IBusiness | null> {
    // Validate input with Zod
    const validatedInput = validateInput(
      BusinessUpdateWithOptionalIdsInputSchema,
      input,
      "BusinessUpdateWithOptionalIdsInput"
    );

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
    } = validatedInput;

    const business = await this.findByIdOrNull(id);
    if (!business) return null;

    return withTransaction(
      async (session) => {
        if (name !== undefined) business.name = name;
        if (description !== undefined) business.description = description;
        if (website !== undefined) business.website = website;
        if (biography !== undefined) business.biography = biography;
        if (mediaLinks !== undefined) {
          // Filter out mediaLinks with undefined url
          business.mediaLinks = mediaLinks.filter(
            (m): m is MediaLink => !!m.url
          );
        }

        const businessId = business._id;

        if (ownerIds?.length) {
          await this.validateEntities(Person, ownerIds, "Owner");
          business.ownerIds = mergeAndDedupeIds(business.ownerIds, ownerIds);
        }

        if (productIds?.length) {
          await this.validateEntities(Product, productIds, "Product");

          await Product.updateMany(
            { _id: { $in: productIds } },
            { $set: { businessId } },
            { session }
          );
        }

        if (sponsorEpisodeIds?.length) {
          await this.validateEntities(Episode, sponsorEpisodeIds, "Episode");

          await Episode.updateMany(
            { _id: { $in: sponsorEpisodeIds } },
            { $addToSet: { sponsorBusinessIds: businessId } },
            { session }
          );

          await Business.syncSponsorEpisodesForBusiness(businessId);
        }

        await business.save({ session });

        return business;
      },
      { operation: "updateBusinessWithOptionalIds", businessId: id }
    );
  }

  async updateBusinessWithRelationFields(
    input: BusinessUpdateRelationFieldsInput
  ): Promise<IBusiness | null> {
    const validatedInput = validateInput(
      BusinessUpdateWithRelationFieldsInputSchema,
      input,
      "BusinessUpdateWithRelationFieldsInput"
    );

    const {
      id,
      ownerIds,
      ownersNested,
      productIds,
      productsNested,
      executives,
      executivesNested,
      sponsorEpisodeIds,
      sponsorEpisodesNested,
    } = validatedInput;

    const business = await this.findByIdOrNull(id);
    if (!business) return null;

    return withTransaction(
      async (session) => {
        const businessId = business._id;

        if (ownerIds?.length) {
          await this.validateEntities(Person, ownerIds, "Owner");
          business.ownerIds = mergeAndDedupeIds(business.ownerIds, ownerIds);
        }

        if (ownersNested?.length) {
          const validatedOwners = ownersNested.map((owner) =>
            validateInput(
              BusinessOwnerNestedInputSchema,
              owner,
              "BusinessOwnerNestedInput"
            )
          );
          const nestedOwnerIds = await this.upsertOwnersNested(
            validatedOwners as BusinessOwnerNestedInput[],
            businessId,
            session
          );
          business.ownerIds = mergeAndDedupeIds(
            business.ownerIds,
            nestedOwnerIds.map((id) => id.toString())
          );
        }

        if (productIds?.length) {
          await this.validateEntities(Product, productIds, "Product");

          await Product.updateMany(
            { _id: { $in: productIds } },
            { $set: { businessId } },
            { session }
          );
        }

        if (productsNested?.length) {
          const validatedProducts = productsNested.map((product) =>
            validateInput(
              BusinessProductNestedInputSchema,
              product,
              "BusinessProductNestedInput"
            )
          );
          const nestedProductIds = await this.upsertProductsNested(
            validatedProducts as BusinessProductNestedInput[],
            businessId,
            session
          );

          if (nestedProductIds.length > 0) {
            await Product.updateMany(
              { _id: { $in: nestedProductIds } },
              { $set: { businessId } },
              { session }
            );
          }
        }

        if (sponsorEpisodeIds?.length) {
          await this.validateEntities(Episode, sponsorEpisodeIds, "Episode");

          await Episode.updateMany(
            { _id: { $in: sponsorEpisodeIds } },
            { $addToSet: { sponsorBusinessIds: businessId } },
            { session }
          );
        }

        if (sponsorEpisodesNested?.length) {
          const validatedEpisodes = sponsorEpisodesNested.map((episode) =>
            validateInput(
              BusinessEpisodeNestedInputSchema,
              episode,
              "BusinessEpisodeNestedInput"
            )
          );
          const nestedEpisodeIds = await this.upsertEpisodesNested(
            validatedEpisodes as BusinessEpisodeNestedInput[],
            businessId,
            session
          );

          if (nestedEpisodeIds.length > 0) {
            await Episode.updateMany(
              { _id: { $in: nestedEpisodeIds } },
              { $addToSet: { sponsorBusinessIds: businessId } },
              { session }
            );
          }
        }

        if (executives !== undefined) {
          if (executives.length > 0) {
            const executivePersonIds = executives.map((e) => e.personId);
            await this.validateEntities(
              Person,
              executivePersonIds,
              "Executive Person"
            );
            business.executives = mapExecutivesInput(executives);
          } else {
            business.executives = [];
          }
        }

        if (executivesNested?.length) {
          const nestedExecutives = await this.upsertExecutivesNested(
            executivesNested,
            session
          );
          business.executives = mergeUniqueBy(
            business.executives ?? [],
            nestedExecutives,
            executiveKey
          );
        }

        await business.save({ session });

        return business;
      },
      { operation: "updateBusinessWithRelationFields", businessId: id }
    );
  }

  async deleteBusiness(id: string): Promise<BusinessDoc> {
    return withTransaction(
      async (session) => {
        const business = await this.deleteById(id, { session });
        return business;
      },
      { operation: "deleteBusiness", businessId: id }
    );
  }
}

export const businessService = new BusinessService();

export const createBusinessWithRelations = (
  input: BusinessCreateRelationsInput
) => businessService.createBusinessWithRelations(input);

export const updateBusinessWithOptionalIds = (
  input: BusinessUpdateWithOptionalIdsInput
) => businessService.updateBusinessWithOptionalIds(input);

export const updateBusinessWithRelationFields = (
  input: BusinessUpdateRelationFieldsInput
) => businessService.updateBusinessWithRelationFields(input);

export const deleteBusiness = (id: string) =>
  businessService.deleteBusiness(id);
