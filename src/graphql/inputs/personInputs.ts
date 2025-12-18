import { MediaLink } from "../../models/MediaLink.js";
import { ISponsorLinkObject, IWebPageTimeline } from "../../models/Episode.js";

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

export interface PersonUpdateWithOptionalIdsInput
  extends PersonScalarUpdateFields {
  id: string;
  businessIds?: string[];
  episodeIds?: string[];
}

/** Nested business input (for upsert by name or id) */
export interface PersonBusinessNestedInput {
  id?: string;
  name?: string;
  description?: string;
  website?: string;
  mediaLinks?: MediaLink[];
}

export interface PersonEpisodeNestedInput {
  id?: string;
  channelName: string;
  episodeNumber?: number;
  episodePageUrl?: string;
  episodeTranscriptUrl?: string;
  episodeTitle?: string;
  publishedAt?: Date;
  summaryShort?: string;
  webPageSummary?: string;
  summaryDetailed?: string;
  youtubeVideoId?: string;
  youtubeWatchUrl?: string;
  youtubeEmbedUrl?: string;
  takeaways?: string[];
  s3TranscriptKey?: string;
  s3TranscriptUrl?: string;
  mediaLinks?: MediaLink[];
  sponsorLinkObjects?: ISponsorLinkObject[];
  webPageTimelines?: IWebPageTimeline[];
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

  episodeIds?: string[];
  episodesNested?: PersonEpisodeNestedInput[];
}
