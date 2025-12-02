import { MediaLink } from "../../models/MediaLink.js";
import { IWebPageTimeline, ISponsorLinkObject } from "../../models/Episode.js";

export interface BusinessExecutiveRelationInput {
  personId: string;
  title?: string;
  role?: string;
}

/** Scalar fields (no relations) */
export interface BusinessScalarFields {
  name: string;
  description?: string;
  website?: string;
  biography?: string;
  mediaLinks?: MediaLink[];
}

/** Scalar update fields (all optional) */
export interface BusinessScalarUpdateFields {
  name?: string;
  description?: string;
  website?: string;
  biography?: string;
  mediaLinks?: MediaLink[];
}

/** Simple create: scalars + optional owner/product/episode IDs */
export interface BusinessCreateWithOptionalIdsInput
  extends BusinessScalarFields {
  ownerIds?: string[];
  productIds?: string[];
  executives?: BusinessExecutiveRelationInput[];
  sponsorEpisodeIds?: string[];
}
/** Simple update: scalars + optional owner/product/episode IDs */
export interface BusinessUpdateWithOptionalIdsInput
  extends BusinessScalarUpdateFields {
  id: string;
  ownerIds?: string[];
  productIds?: string[];
  sponsorEpisodeIds?: string[];
}

/** Nested owner (Person) input */
export interface BusinessOwnerNestedInput {
  id?: string;
  name?: string;
  role?: string;
  bio?: string;
  mediaLinks?: MediaLink[];
}

/** Nested product input */
export interface BusinessProductNestedInput {
  id?: string;
  name?: string;
  description?: string;
  ingredients?: string[];
  mediaLinks?: MediaLink[];
  sourceUrl?: string;
}

/** Nested episode input */
export interface BusinessEpisodeNestedInput {
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

/** Executive relation input */
export interface BusinessExecutiveRelationInput {
  personId: string; // Person _id as string
  title?: string;
  role?: string;
}

/**
 * Rich relation update input.
 * - ownerIds / ownersNested: manage owners
 * - productIds / productsNested: manage products
 * - executives: manage executive list
 * - sponsorEpisodeIds / sponsorEpisodesNested: manage sponsored episodes
 */
export interface BusinessUpdateRelationFieldsInput {
  id: string;

  ownerIds?: string[];
  ownersNested?: BusinessOwnerNestedInput[];

  productIds?: string[];
  productsNested?: BusinessProductNestedInput[];

  executives?: BusinessExecutiveRelationInput[];

  sponsorEpisodeIds?: string[];
  sponsorEpisodesNested?: BusinessEpisodeNestedInput[];
}
