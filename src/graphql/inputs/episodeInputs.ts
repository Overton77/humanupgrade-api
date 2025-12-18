import { MediaLink } from "../../models/MediaLink.js";
import { ISponsorLinkObject, IWebPageTimeline } from "../../models/Episode.js";

export interface EpisodeCreateWithOptionalIdsInput {
  channelName: string;
  episodeNumber?: number;
  episodeTitle?: string;
  episodePageUrl?: string;
  episodeTranscriptUrl?: string;
  publishedAt?: Date;
  summaryShort?: string;
  webPageSummary?: string;
  summaryDetailed?: string;
  publishedSummary?: string;
  youtubeVideoId?: string;
  youtubeWatchUrl?: string;
  youtubeEmbedUrl?: string;
  takeaways?: string[];
  s3TranscriptKey?: string;
  s3TranscriptUrl?: string;
  mediaLinks?: MediaLink[];
  sponsorLinkObjects?: ISponsorLinkObject[];
  webPageTimelines?: IWebPageTimeline[];
  businessLinks?: string[];
  guestIds?: string[];
  sponsorBusinessIds?: string[];
  protocolIds?: string[];
}

export interface EpisodeUpdateWithOptionalIdsInput {
  id: string;
  channelName?: string;
  episodeNumber?: number;
  episodeTitle?: string;
  episodePageUrl?: string;
  episodeTranscriptUrl?: string;
  publishedAt?: Date;
  summaryShort?: string;
  webPageSummary?: string;
  summaryDetailed?: string;
  publishedSummary?: string;
  youtubeVideoId?: string;
  youtubeWatchUrl?: string;
  youtubeEmbedUrl?: string;
  takeaways?: string[];
  s3TranscriptKey?: string;
  s3TranscriptUrl?: string;
  mediaLinks?: MediaLink[];
  sponsorLinkObjects?: ISponsorLinkObject[];
  webPageTimelines?: IWebPageTimeline[];
  businessLinks?: string[];
  guestIds?: string[];
  sponsorBusinessIds?: string[];
  protocolIds?: string[];
}

export interface EpisodeGuestNestedInput {
  id?: string;
  name?: string;
  role?: string;
  bio?: string;
  mediaLinks?: MediaLink[];
}

export interface EpisodeSponsorBusinessNestedInput {
  id?: string;
  name?: string;
  description?: string;
  website?: string;
  mediaLinks?: MediaLink[];
}

export interface EpisodeUpdateRelationFieldsInput {
  id: string;
  guestIds?: string[];
  guestsNested?: EpisodeGuestNestedInput[];
  sponsorBusinessIds?: string[];
  sponsorBusinessesNested?: EpisodeSponsorBusinessNestedInput[];
  protocolIds?: string[];
}
