import mongoose from "mongoose";
import { Episode, IEpisode, EpisodeDoc } from "../models/Episode";
import { Person } from "../models/Person";
import { Business } from "../models/Business";
import {
  EpisodeCreateWithOptionalIdsInput,
  EpisodeUpdateWithOptionalIdsInput,
  EpisodeUpdateRelationFieldsInput,
  EpisodeGuestNestedInput,
  EpisodeSponsorBusinessNestedInput,
} from "../graphql/inputs/episodeInputs";
import { toObjectIds } from "./utils/general";
import {
  mergeAndDedupeIds,
  mergeUniqueStrings,
  mergeUniqueBy,
} from "./utils/merging";
import { validateEntitiesExist } from "./utils/validation";

/**
 * Create an Episode and optionally connect guests and sponsor businesses.
 *
 * Relationship rules:
 *
 * - Guests:
 *   - Episode.guestIds is canonical.
 *   - Person.episodeIds is a mirror, maintained by Episode.syncGuestLinks()
 *     and/or Episode middleware.
 *
 * - Sponsor Businesses:
 *   - Episode.sponsorBusinessIds is canonical.
 *   - Business.sponsorEpisodeIds is a mirror, maintained by
 *     Business.syncSponsorEpisodesForBusiness() and/or Episode middleware.
 */

export async function createEpisodeWithOptionalIds(
  input: EpisodeCreateWithOptionalIdsInput
): Promise<IEpisode> {
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
    youtubeVideoId,
    youtubeWatchUrl,
    youtubeEmbedUrl,
    takeaways,
    s3TranscriptKey,
    s3TranscriptUrl,
    mediaLinks,
    sponsorLinkObjects,
    webPageTimelines,
    guestIds,
    sponsorBusinessIds,
  } = input;

  // --- 1) Validate all referenced entities exist up front -------------------

  if (guestIds && guestIds.length > 0) {
    await validateEntitiesExist(Person, guestIds, "Guest");
  }

  if (sponsorBusinessIds && sponsorBusinessIds.length > 0) {
    await validateEntitiesExist(
      Business as any,
      sponsorBusinessIds,
      "Sponsor Business"
    );
  }

  // --- 2) Create the Episode (canonical side for guests and sponsors) -------

  const guestObjectIds = guestIds ? toObjectIds(guestIds) : [];
  const sponsorBusinessObjectIds = sponsorBusinessIds
    ? toObjectIds(sponsorBusinessIds)
    : [];

  const episode = await Episode.create({
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
    mediaLinks,
    sponsorLinkObjects,
    webPageTimelines,
    guestIds: guestObjectIds,
    sponsorBusinessIds: sponsorBusinessObjectIds,
  });

  // --- 3) Sync mirrors (middleware handles this on save, but explicit is safe)

  const episodeDoc = episode as EpisodeDoc;

  // Sync Person.episodeIds mirror
  if (guestObjectIds.length > 0) {
    await Episode.syncGuestLinks(episodeDoc);
  }

  // Sync Business.sponsorEpisodeIds mirror
  if (sponsorBusinessObjectIds.length > 0) {
    for (const businessId of sponsorBusinessObjectIds) {
      await Business.syncSponsorEpisodesForBusiness(businessId);
    }
  }

  return episode;
}

// ============================================================================
//  SIMPLE UPDATE: SCALARS + OPTIONAL GUEST / SPONSOR IDS
// ============================================================================

/**
 * Simple update: scalar fields + optional guests/sponsors.
 *
 * Semantics:
 *
 * - guestIds:
 *   - Merge + dedupe into Episode.guestIds (canonical).
 *   - Person.episodeIds is updated via Episode.syncGuestLinks(episode).
 *
 * - sponsorBusinessIds:
 *   - Merge + dedupe into Episode.sponsorBusinessIds (canonical).
 *   - Business.sponsorEpisodeIds is updated via
 *     Business.syncSponsorEpisodesForBusiness(businessId).
 */
export async function updateEpisodeWithOptionalIds(
  input: EpisodeUpdateWithOptionalIdsInput
): Promise<IEpisode | null> {
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
    guestIds,
    sponsorBusinessIds,
  } = input;

  const episode = await Episode.findById(id);
  if (!episode) return null;

  // --- Update scalar fields -------------------------------------------------

  if (channelName !== undefined) episode.channelName = channelName;
  if (episodeNumber !== undefined) episode.episodeNumber = episodeNumber;
  if (episodeTitle !== undefined) episode.episodeTitle = episodeTitle;
  if (episodePageUrl !== undefined) episode.episodePageUrl = episodePageUrl;
  if (episodeTranscriptUrl !== undefined) {
    episode.episodeTranscriptUrl = episodeTranscriptUrl;
  }
  if (publishedAt !== undefined) episode.publishedAt = publishedAt;
  if (summaryShort !== undefined) episode.summaryShort = summaryShort;
  if (webPageSummary !== undefined) episode.webPageSummary = webPageSummary;
  if (summaryDetailed !== undefined) episode.summaryDetailed = summaryDetailed;
  if (youtubeVideoId !== undefined) episode.youtubeVideoId = youtubeVideoId;
  if (youtubeWatchUrl !== undefined) episode.youtubeWatchUrl = youtubeWatchUrl;
  if (youtubeEmbedUrl !== undefined) episode.youtubeEmbedUrl = youtubeEmbedUrl;
  if (s3TranscriptKey !== undefined) episode.s3TranscriptKey = s3TranscriptKey;
  if (s3TranscriptUrl !== undefined) episode.s3TranscriptUrl = s3TranscriptUrl;

  // --- Merge arrays (addToSet semantics) ------------------------------------

  if (takeaways !== undefined && takeaways.length > 0) {
    episode.takeaways = mergeUniqueStrings(episode.takeaways ?? [], takeaways);
  }

  if (mediaLinks !== undefined && mediaLinks.length > 0) {
    episode.mediaLinks = mergeUniqueBy(
      episode.mediaLinks ?? [],
      mediaLinks,
      (m) => m.url
    );
  }

  if (sponsorLinkObjects !== undefined && sponsorLinkObjects.length > 0) {
    episode.sponsorLinkObjects = mergeUniqueBy(
      episode.sponsorLinkObjects ?? [],
      sponsorLinkObjects,
      (s) => `${s.brand ?? ""}-${s.code ?? ""}-${s.text ?? ""}`
    );
  }

  if (webPageTimelines !== undefined && webPageTimelines.length > 0) {
    episode.webPageTimelines = mergeUniqueBy(
      episode.webPageTimelines ?? [],
      webPageTimelines,
      (t) => `${t.from}-${t.to}-${t.title ?? ""}`
    );
  }

  const episodeId = episode._id;

  // --- Guests: merge + dedupe (canonical: Episode.guestIds) ----------------

  if (guestIds && guestIds.length > 0) {
    await validateEntitiesExist(Person, guestIds, "Guest");
    episode.guestIds = mergeAndDedupeIds(episode.guestIds, guestIds);
  }

  // --- Sponsor Businesses: merge + dedupe (canonical: Episode.sponsorBusinessIds)

  if (sponsorBusinessIds && sponsorBusinessIds.length > 0) {
    await validateEntitiesExist(
      Business as any,
      sponsorBusinessIds,
      "Sponsor Business"
    );
    episode.sponsorBusinessIds = mergeAndDedupeIds(
      episode.sponsorBusinessIds,
      sponsorBusinessIds
    );
  }

  // Persist changes
  await episode.save();

  // Update mirrors
  const episodeDoc = episode as EpisodeDoc;
  await Episode.syncGuestLinks(episodeDoc);

  if (sponsorBusinessIds && sponsorBusinessIds.length > 0) {
    for (const businessId of toObjectIds(sponsorBusinessIds)) {
      await Business.syncSponsorEpisodesForBusiness(businessId);
    }
  }

  return episode;
}

// ============================================================================
//  NESTED UPSERT HELPERS
// ============================================================================

/**
 * Nested upsert for guests (Person).
 *
 * Rules:
 * - If id is provided: update Person by id.
 * - Else if name is provided: find Person by unique name,
 *   update if exists, otherwise create.
 */
async function upsertGuestsNested(
  guestsNested: EpisodeGuestNestedInput[] | undefined,
  episodeId: mongoose.Types.ObjectId
): Promise<mongoose.Types.ObjectId[]> {
  if (!guestsNested || guestsNested.length === 0) return [];

  const guestIds: mongoose.Types.ObjectId[] = [];

  for (const guestInput of guestsNested) {
    const { id, name, role, bio, mediaLinks } = guestInput;

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
      // Update existing
      if (name !== undefined) person.name = name;
      if (role !== undefined) person.role = role;
      if (bio !== undefined) person.bio = bio;
      if (mediaLinks !== undefined)
        person.mediaLinks = mergeUniqueBy(
          person.mediaLinks ?? [],
          mediaLinks,
          (m) => m.url
        );
      await person.save();
    } else {
      // Create new
      if (!name) {
        throw new Error(
          "guestsNested entry requires 'name' when neither 'id' nor an existing person by name is found"
        );
      }

      person = await Person.create({
        name,
        role,
        bio,
        mediaLinks,
        businessIds: [],
        episodeIds: [episodeId], // convenience; Episode.syncGuestLinks is canonical maintainer
      });
    }

    guestIds.push(person._id);
  }

  return guestIds;
}

/**
 * Nested upsert for sponsor businesses (Business).
 *
 * Rules:
 * - If id is provided: update Business by id.
 * - Else if name is provided: find Business by unique name,
 *   update if exists, otherwise create.
 */
async function upsertSponsorBusinessesNested(
  sponsorBusinessesNested: EpisodeSponsorBusinessNestedInput[] | undefined,
  episodeId: mongoose.Types.ObjectId
): Promise<mongoose.Types.ObjectId[]> {
  if (!sponsorBusinessesNested || sponsorBusinessesNested.length === 0) {
    return [];
  }

  const businessIds: mongoose.Types.ObjectId[] = [];

  for (const businessInput of sponsorBusinessesNested) {
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
      if (mediaLinks !== undefined)
        business.mediaLinks = mergeUniqueBy(
          business.mediaLinks ?? [],
          mediaLinks,
          (m) => m.url
        );
      await business.save();
    } else {
      // Create new
      if (!name) {
        throw new Error(
          "sponsorBusinessesNested entry requires 'name' when neither 'id' nor an existing business by name is found"
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
        sponsorEpisodeIds: [episodeId], // convenience; Business.syncSponsorEpisodesForBusiness is canonical maintainer
      });
    }

    businessIds.push(business._id);
  }

  return businessIds;
}

// ============================================================================
//  RICH RELATION UPDATE (NESTED INPUTS)
// ============================================================================

/**
 * Rich relation update:
 *
 * Handles:
 * - guestIds / guestsNested
 * - sponsorBusinessIds / sponsorBusinessesNested
 *
 * Canonical sides:
 * - Guests: Episode.guestIds
 * - Sponsors: Episode.sponsorBusinessIds
 *
 * Mirrors:
 * - Person.episodeIds    <- Episode.syncGuestLinks(episode)
 * - Business.sponsorEpisodeIds <- Business.syncSponsorEpisodesForBusiness(businessId)
 */
export async function updateEpisodeWithRelationFields(
  input: EpisodeUpdateRelationFieldsInput
): Promise<IEpisode | null> {
  const {
    id,
    guestIds,
    guestsNested,
    sponsorBusinessIds,
    sponsorBusinessesNested,
  } = input;

  const episode = await Episode.findById(id);
  if (!episode) return null;

  const episodeId = episode._id;

  // --- Guests: merge + dedupe (canonical: Episode.guestIds) ----------------

  if (guestIds && guestIds.length > 0) {
    await validateEntitiesExist(Person, guestIds, "Guest");
    episode.guestIds = mergeAndDedupeIds(episode.guestIds, guestIds);
  }

  if (guestsNested) {
    const nestedGuestIds = await upsertGuestsNested(guestsNested, episodeId);
    episode.guestIds = mergeAndDedupeIds(
      episode.guestIds,
      nestedGuestIds.map((id) => id.toString())
    );
  }

  // --- Sponsor Businesses: merge + dedupe (canonical: Episode.sponsorBusinessIds)

  if (sponsorBusinessIds && sponsorBusinessIds.length > 0) {
    await validateEntitiesExist(
      Business as any,
      sponsorBusinessIds,
      "Sponsor Business"
    );
    episode.sponsorBusinessIds = mergeAndDedupeIds(
      episode.sponsorBusinessIds,
      sponsorBusinessIds
    );
  }

  if (sponsorBusinessesNested) {
    const nestedBusinessIds = await upsertSponsorBusinessesNested(
      sponsorBusinessesNested,
      episodeId
    );
    episode.sponsorBusinessIds = mergeAndDedupeIds(
      episode.sponsorBusinessIds,
      nestedBusinessIds.map((id) => id.toString())
    );
  }

  // Persist changes
  await episode.save();

  // Update mirrors
  const episodeDoc = episode as EpisodeDoc;
  await Episode.syncGuestLinks(episodeDoc);

  // Sync all affected businesses
  const allBusinessIds = episode.sponsorBusinessIds;
  for (const businessId of allBusinessIds) {
    await Business.syncSponsorEpisodesForBusiness(businessId);
  }

  return episode;
}
