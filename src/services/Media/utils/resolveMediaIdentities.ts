import {
  ChannelIdentifierKey,
  EpisodeIdentifierKey,
  EpisodeSegmentIdentifierKey,
  PlatformIdentifierKey,
  SeriesIdentifierKey,
} from "../types.js";

export function resolvePlatformIdentifier(params: {
  platformId?: string | null;
  canonicalName?: string | null;
}): { key: PlatformIdentifierKey; value: string } {
  if (params.platformId) return { key: "platformId", value: params.platformId };
  if (params.canonicalName)
    return { key: "canonicalName", value: params.canonicalName };
  throw new Error(
    "Platform identifier required: platformId or canonicalName"
  );
}

export function resolveChannelIdentifier(params: {
  channelId?: string | null;
  canonicalName?: string | null;
}): { key: ChannelIdentifierKey; value: string } {
  if (params.channelId) return { key: "channelId", value: params.channelId };
  if (params.canonicalName)
    return { key: "canonicalName", value: params.canonicalName };
  throw new Error(
    "Channel identifier required: channelId or canonicalName"
  );
}

export function resolveSeriesIdentifier(params: {
  seriesId?: string | null;
  canonicalName?: string | null;
}): { key: SeriesIdentifierKey; value: string } {
  if (params.seriesId) return { key: "seriesId", value: params.seriesId };
  if (params.canonicalName)
    return { key: "canonicalName", value: params.canonicalName };
  throw new Error(
    "Series identifier required: seriesId or canonicalName"
  );
}

export function resolveEpisodeIdentifier(params: {
  episodeId?: string | null;
  webPageUrl?: string | null;
  canonicalName?: string | null;
}): { key: EpisodeIdentifierKey; value: string } {
  if (params.episodeId) return { key: "episodeId", value: params.episodeId };
  if (params.webPageUrl) return { key: "webPageUrl", value: params.webPageUrl };
  if (params.canonicalName)
    return { key: "canonicalName", value: params.canonicalName };
  throw new Error(
    "Episode identifier required: episodeId, webPageUrl, or canonicalName"
  );
}

export function resolveEpisodeSegmentIdentifier(params: {
  episodeSegmentId?: string | null;
  canonicalName?: string | null;
}): { key: EpisodeSegmentIdentifierKey; value: string } {
  if (params.episodeSegmentId)
    return { key: "episodeSegmentId", value: params.episodeSegmentId };
  if (params.canonicalName)
    return { key: "canonicalName", value: params.canonicalName };
  throw new Error(
    "EpisodeSegment identifier required: episodeSegmentId or canonicalName"
  );
}
