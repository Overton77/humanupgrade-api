import mongoose, { ClientSession } from "mongoose";
import {
  Episode,
  IEpisode,
  EpisodeDoc,
  EpisodeModel,
} from "../models/Episode.js";
import { Person } from "../models/Person.js";
import { Business } from "../models/Business.js";
import { Protocol } from "../models/Protocol.js";

import {
  EpisodeCreateWithOptionalIdsInput,
  EpisodeUpdateWithOptionalIdsInput,
  EpisodeUpdateRelationFieldsInput,
  EpisodeGuestNestedInput,
  EpisodeSponsorBusinessNestedInput,
} from "../graphql/inputs/episodeInputs.js";

import {
  EpisodeCreateWithOptionalIdsInputSchema,
  EpisodeUpdateWithOptionalIdsInputSchema,
  EpisodeUpdateRelationFieldsInputSchema,
  EpisodeGuestNestedInputSchema,
  EpisodeSponsorBusinessNestedInputSchema,
} from "../graphql/inputs/schemas/episodeSchemas.js";

import { validateInput } from "../lib/validation.js";
import { withTransaction } from "../lib/transactions.js";
import { BaseService } from "./BaseService.js";
import { toObjectIds } from "./utils/general.js";
import {
  mergeAndDedupeIds,
  mergeUniqueStrings,
  mergeUniqueBy,
} from "./utils/merging.js";
import { Errors } from "../lib/errors.js";

class EpisodeService extends BaseService<IEpisode, EpisodeDoc, EpisodeModel> {
  constructor() {
    super(Episode, "episodeService", "Episode");
  }

  // ---------------------------------------------------------------------------
  // CREATE (optional IDs only)
  // ---------------------------------------------------------------------------
  async createEpisodeWithOptionalIds(
    input: EpisodeCreateWithOptionalIdsInput
  ): Promise<IEpisode> {
    const validated = validateInput(
      EpisodeCreateWithOptionalIdsInputSchema,
      input,
      "EpisodeCreateWithOptionalIdsInput"
    );

    return withTransaction(
      async (session) => {
        const {
          channelName,
          episodeNumber,
          episodeTitle,
          episodePageUrl,
          episodeTranscriptUrl,
          publishedAt,
          summaryShort,
          webPageSummary,
          summaryDetailed,
          publishedSummary,
          youtubeVideoId,
          youtubeWatchUrl,
          youtubeEmbedUrl,
          takeaways,
          s3TranscriptKey,
          s3TranscriptUrl,
          mediaLinks,
          sponsorLinkObjects,
          webPageTimelines,
          businessLinks,
          guestIds,
          sponsorBusinessIds,
          protocolIds,
        } = validated;

        if (guestIds?.length) {
          await this.validateEntities(Person, guestIds, "Guest", { session });
        }
        if (sponsorBusinessIds?.length) {
          await this.validateEntities(
            Business as any,
            sponsorBusinessIds,
            "Sponsor Business",
            { session }
          );
        }
        if (protocolIds?.length) {
          await this.validateEntities(
            Protocol as any,
            protocolIds,
            "Protocol",
            { session }
          );
        }

        const guestObjectIds = guestIds ? toObjectIds(guestIds) : [];
        const sponsorBusinessObjectIds = sponsorBusinessIds
          ? toObjectIds(sponsorBusinessIds)
          : [];
        const protocolObjectIds = protocolIds ? toObjectIds(protocolIds) : [];

        // Use create([doc], {session}) pattern to ensure session is applied.
        const [episode] = await Episode.create(
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
              publishedSummary,
              youtubeVideoId,
              youtubeWatchUrl,
              youtubeEmbedUrl,
              takeaways: takeaways ?? [],
              s3TranscriptKey,
              s3TranscriptUrl,
              mediaLinks,
              sponsorLinkObjects,
              webPageTimelines,
              businessLinks: businessLinks ?? [],
              guestIds: guestObjectIds,
              sponsorBusinessIds: sponsorBusinessObjectIds,
              protocolIds: protocolObjectIds,
            },
          ],
          { session }
        );

        return episode;
      },
      {
        operation: "createEpisodeWithOptionalIds",
        episodeTitle: validated.episodeTitle,
      }
    );
  }

  // ---------------------------------------------------------------------------
  // UPDATE (scalars + optional IDs)
  // ---------------------------------------------------------------------------
  async updateEpisodeWithOptionalIds(
    input: EpisodeUpdateWithOptionalIdsInput
  ): Promise<IEpisode | null> {
    const validated = validateInput(
      EpisodeUpdateWithOptionalIdsInputSchema,
      input,
      "EpisodeUpdateWithOptionalIdsInput"
    );

    return withTransaction(
      async (session) => {
        const { id } = validated;

        const episode = await this.findByIdOrNull(id, { session });
        if (!episode) return null;

        const {
          channelName,
          episodeNumber,
          episodeTitle,
          episodePageUrl,
          episodeTranscriptUrl,
          publishedAt,
          summaryShort,
          webPageSummary,
          summaryDetailed,
          publishedSummary,
          youtubeVideoId,
          youtubeWatchUrl,
          youtubeEmbedUrl,
          takeaways,
          s3TranscriptKey,
          s3TranscriptUrl,
          mediaLinks,
          sponsorLinkObjects,
          webPageTimelines,
          businessLinks,
          guestIds,
          sponsorBusinessIds,
          protocolIds,
        } = validated;

        // Scalars
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
        if (publishedSummary !== undefined)
          episode.publishedSummary = publishedSummary;
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

        // Arrays (merge semantics)
        if (takeaways?.length) {
          episode.takeaways = mergeUniqueStrings(
            episode.takeaways ?? [],
            takeaways
          );
        }
        if (mediaLinks?.length) {
          episode.mediaLinks = mergeUniqueBy(
            episode.mediaLinks ?? [],
            mediaLinks,
            (m) => m.url
          );
        }
        if (sponsorLinkObjects?.length) {
          episode.sponsorLinkObjects = mergeUniqueBy(
            episode.sponsorLinkObjects ?? [],
            sponsorLinkObjects,
            (s) => `${s.brand ?? ""}-${s.code ?? ""}-${s.text ?? ""}`
          );
        }
        if (webPageTimelines?.length) {
          episode.webPageTimelines = mergeUniqueBy(
            episode.webPageTimelines ?? [],
            webPageTimelines,
            (t) => `${t.from}-${t.to}-${t.title ?? ""}`
          );
        }
        if (businessLinks?.length) {
          episode.businessLinks = mergeUniqueStrings(
            episode.businessLinks ?? [],
            businessLinks
          );
        }

        // Canonical relation fields
        if (guestIds?.length) {
          await this.validateEntities(Person, guestIds, "Guest", { session });
          episode.guestIds = mergeAndDedupeIds(episode.guestIds, guestIds);
        }

        if (sponsorBusinessIds?.length) {
          await this.validateEntities(
            Business as any,
            sponsorBusinessIds,
            "Sponsor Business",
            { session }
          );
          episode.sponsorBusinessIds = mergeAndDedupeIds(
            episode.sponsorBusinessIds,
            sponsorBusinessIds
          );
        }

        if (protocolIds?.length) {
          await this.validateEntities(
            Protocol as any,
            protocolIds,
            "Protocol",
            { session }
          );
          episode.protocolIds = mergeAndDedupeIds(
            episode.protocolIds,
            protocolIds
          );
        }

        await episode.save({ session });
        return episode;
      },
      { operation: "updateEpisodeWithOptionalIds", episodeId: validated.id }
    );
  }

  // ---------------------------------------------------------------------------
  // NESTED UPSERT HELPERS (session-aware, no mirror writes)
  // ---------------------------------------------------------------------------
  private async upsertGuestsNested(
    guestsNested: EpisodeGuestNestedInput[] | undefined,
    session: ClientSession
  ): Promise<mongoose.Types.ObjectId[]> {
    if (!guestsNested?.length) return [];

    const guestIds: mongoose.Types.ObjectId[] = [];

    for (const raw of guestsNested) {
      const validated = validateInput(
        EpisodeGuestNestedInputSchema,
        raw,
        "EpisodeGuestNestedInput"
      );

      const { id, name, role, bio, mediaLinks } = validated;

      let person = null as any;

      if (id) {
        person = await Person.findById(id).session(session);
        if (!person && name) {
          person = await Person.findOne({ name }).session(session);
        }
      } else if (name) {
        person = await Person.findOne({ name }).session(session);
      }

      if (person) {
        if (name !== undefined) person.name = name;
        if (role !== undefined) person.role = role;
        if (bio !== undefined) person.bio = bio;
        if (mediaLinks?.length) {
          person.mediaLinks = mergeUniqueBy(
            person.mediaLinks ?? [],
            mediaLinks,
            (m) => m.url
          );
        }
        await person.save({ session });
      } else {
        if (!name) {
          throw Errors.validation(
            "guestsNested entry requires 'name' when neither 'id' nor an existing person by name is found",
            "name"
          );
        }

        const [created] = await Person.create(
          [
            {
              name,
              role,
              bio,
              mediaLinks,
            },
          ],
          { session }
        );
        person = created;
      }

      guestIds.push(person._id);
    }

    return guestIds;
  }

  private async upsertSponsorBusinessesNested(
    sponsorBusinessesNested: EpisodeSponsorBusinessNestedInput[] | undefined,
    session: ClientSession
  ): Promise<mongoose.Types.ObjectId[]> {
    if (!sponsorBusinessesNested?.length) return [];

    const businessIds: mongoose.Types.ObjectId[] = [];

    for (const raw of sponsorBusinessesNested) {
      const validated = validateInput(
        EpisodeSponsorBusinessNestedInputSchema,
        raw,
        "EpisodeSponsorBusinessNestedInput"
      );

      const { id, name, description, website, mediaLinks } = validated;

      let business = null as any;

      if (id) {
        business = await Business.findById(id).session(session);
        if (!business && name) {
          business = await Business.findOne({ name }).session(session);
        }
      } else if (name) {
        business = await Business.findOne({ name }).session(session);
      }

      if (business) {
        if (name !== undefined) business.name = name;
        if (description !== undefined) business.description = description;
        if (website !== undefined) business.website = website;
        if (mediaLinks?.length) {
          business.mediaLinks = mergeUniqueBy(
            business.mediaLinks ?? [],
            mediaLinks,
            (m) => m.url
          );
        }
        await business.save({ session });
      } else {
        if (!name) {
          throw Errors.validation(
            "sponsorBusinessesNested entry requires 'name' when neither 'id' nor an existing business by name is found",
            "name"
          );
        }

        const [created] = await Business.create(
          [
            {
              name,
              description,
              website,
              mediaLinks,
              ownerIds: [],
              executives: [],
              // IMPORTANT: do not write mirror sponsorEpisodeIds here.
              productIds: [],
              sponsorEpisodeIds: [],
            },
          ],
          { session }
        );

        business = created;
      }

      businessIds.push(business._id);
    }

    return businessIds;
  }

  // ---------------------------------------------------------------------------
  // RELATION UPDATE (IDs + nested)
  // ---------------------------------------------------------------------------
  async updateEpisodeWithRelationFields(
    input: EpisodeUpdateRelationFieldsInput
  ): Promise<IEpisode | null> {
    const validated = validateInput(
      EpisodeUpdateRelationFieldsInputSchema,
      input,
      "EpisodeUpdateRelationFieldsInput"
    );

    return withTransaction(
      async (session) => {
        const episode = await this.findByIdOrNull(validated.id, { session });
        if (!episode) return null;

        const {
          guestIds,
          guestsNested,
          sponsorBusinessIds,
          sponsorBusinessesNested,
          protocolIds,
        } = validated;

        // Guests (canonical)
        if (guestIds?.length) {
          await this.validateEntities(Person, guestIds, "Guest", { session });
          episode.guestIds = mergeAndDedupeIds(episode.guestIds, guestIds);
        }
        if (guestsNested?.length) {
          const nestedIds = await this.upsertGuestsNested(
            guestsNested,
            session
          );
          episode.guestIds = mergeAndDedupeIds(
            episode.guestIds,
            nestedIds.map((id) => id.toString())
          );
        }

        if (sponsorBusinessIds?.length) {
          await this.validateEntities(
            Business as any,
            sponsorBusinessIds,
            "Sponsor Business",
            { session }
          );
          episode.sponsorBusinessIds = mergeAndDedupeIds(
            episode.sponsorBusinessIds,
            sponsorBusinessIds
          );
        }
        if (sponsorBusinessesNested?.length) {
          const nestedIds = await this.upsertSponsorBusinessesNested(
            sponsorBusinessesNested,
            session
          );
          episode.sponsorBusinessIds = mergeAndDedupeIds(
            episode.sponsorBusinessIds,
            nestedIds.map((id) => id.toString())
          );
        }

        if (protocolIds?.length) {
          await this.validateEntities(
            Protocol as any,
            protocolIds,
            "Protocol",
            { session }
          );
          episode.protocolIds = mergeAndDedupeIds(
            episode.protocolIds,
            protocolIds
          );
        }

        await episode.save({ session });
        return episode;
      },
      { operation: "updateEpisodeWithRelationFields", episodeId: validated.id }
    );
  }

  async deleteEpisodeByPageUrlOrId(
    identifier: string
  ): Promise<IEpisode | null> {
    return withTransaction(
      async (session) => {
        const byUrl = await Episode.findOneAndDelete({
          episodePageUrl: identifier,
        }).session(session);
        if (byUrl) return byUrl;

        if (!mongoose.isValidObjectId(identifier)) return null;
        return await Episode.findOneAndDelete({ _id: identifier }).session(
          session
        );
      },
      { operation: "deleteEpisodeByPageUrlOrId", identifier }
    );
  }

  async deleteAllEpisodes(): Promise<{ deletedCount: number }> {
    return withTransaction(
      async (session) => {
        const ids = await Episode.find({})
          .select("_id")
          .session(session)
          .lean();

        let deletedCount = 0;
        for (const e of ids) {
          await Episode.findOneAndDelete({ _id: e._id }).session(session);
          deletedCount++;
        }
        return { deletedCount };
      },
      { operation: "deleteAllEpisodes" }
    );
  }
}

export const episodeService = new EpisodeService();

export const createEpisodeWithOptionalIds = (
  input: EpisodeCreateWithOptionalIdsInput
) => episodeService.createEpisodeWithOptionalIds(input);

export const updateEpisodeWithOptionalIds = (
  input: EpisodeUpdateWithOptionalIdsInput
) => episodeService.updateEpisodeWithOptionalIds(input);

export const updateEpisodeWithRelationFields = (
  input: EpisodeUpdateRelationFieldsInput
) => episodeService.updateEpisodeWithRelationFields(input);

export const deleteEpisodeByPageUrlOrId = (identifier: string) =>
  episodeService.deleteEpisodeByPageUrlOrId(identifier);

export const deleteAllEpisodes = () => episodeService.deleteAllEpisodes();
