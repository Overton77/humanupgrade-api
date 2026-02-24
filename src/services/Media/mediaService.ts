import { executeWrite } from "../../db/neo4j/executor.js";
import { firstRecordOrNull } from "../../db/neo4j/utils.js";
import { logger } from "../../lib/logger.js";
import { validateInput } from "../../lib/validation.js";
import { Errors } from "../../lib/errors.js";
import {
  UpsertPlatformInput,
  UpsertPlatformInputSchema,
  UpsertChannelInput,
  UpsertChannelInputSchema,
  UpsertSeriesInput,
  UpsertSeriesInputSchema,
  UpsertEpisodeInput,
  UpsertEpisodeInputSchema,
  UpsertEpisodeSegmentsInput,
  UpsertEpisodeSegmentsInputSchema,
} from "../../graphql/inputs/MediaInputs.js";
import { Platform } from "../../graphql/types/PlatformModel.js";
import { Channel } from "../../graphql/types/ChannelModel.js";
import { Series } from "../../graphql/types/SeriesModel.js";
import { Episode } from "../../graphql/types/EpisodeModel.js";
import {
  buildPlatformUpsertCypher,
  platformStatements,
  buildChannelUpsertCypher,
  channelStatements,
  buildSeriesUpsertCypher,
  seriesStatements,
  buildEpisodeUpsertCypher,
  episodeStatements,
} from "./statements/upsertMediaStatements.js";
import {
  resolvePlatformIdentifier,
  resolveChannelIdentifier,
  resolveSeriesIdentifier,
  resolveEpisodeIdentifier,
} from "./utils/resolveMediaIdentities.js";

// ============================================================================
// PLATFORM
// ============================================================================

export async function upsertPlatform(
  input: UpsertPlatformInput
): Promise<Platform> {
  const validated = validateInput(
    UpsertPlatformInputSchema,
    input,
    "UpsertPlatformInput"
  );

  const params = {
    platformId: validated.platformId ?? null,
    canonicalName: validated.canonicalName,
    aliases: validated.aliases ?? null,
    platformType: validated.platformType,
    description: validated.description ?? null,
    websiteUrl: validated.websiteUrl ?? null,
    validAt: validated.validAt ?? null,
    invalidAt: validated.invalidAt ?? null,
    expiredAt: validated.expiredAt ?? null,

    hostsChannel: validated.hostsChannel ?? [],
  };

  const { key, value } = resolvePlatformIdentifier(params);
  const upsertCypher = buildPlatformUpsertCypher(key);

  try {
    const platform = await executeWrite(async (tx) => {
      // 1) Upsert Platform node
      const writeRes = await tx.run(upsertCypher, { ...params, idValue: value });
      const upsertRecord = firstRecordOrNull(writeRes);
      if (!upsertRecord)
        throw new Error("upsertPlatform: no record returned from upsert");

      const ptNode = upsertRecord.get("pt");
      const resolvedPlatformId =
        ptNode?.properties?.platformId ?? ptNode?.platformId;

      if (!resolvedPlatformId)
        throw Errors.internalError("Upsert did not produce a platformId");

      const nextParams = { ...params, platformId: resolvedPlatformId };

      // 2) HOSTS_CHANNEL edges
      if (nextParams.hostsChannel.length) {
        await tx.run(platformStatements.platformHostsChannelCypher, nextParams);
      }

      // 3) Return Platform
      const finalRes = await tx.run(platformStatements.returnPlatformCypher, {
        platformId: resolvedPlatformId,
      });
      const finalRecord = firstRecordOrNull(finalRes);
      if (!finalRecord)
        throw new Error("upsertPlatform: platform not found after writes");

      const node = finalRecord.get("pt");
      return node?.properties ?? node;
    });

    return platform as Platform;
  } catch (err: any) {
    logger.error("upsertPlatform: Neo4j write failed", {
      message: err?.message,
      code: err?.code,
      name: err?.name,
      stack: err?.stack,
    });
    throw err;
  }
}

// ============================================================================
// CHANNEL
// ============================================================================

export async function upsertChannel(
  input: UpsertChannelInput
): Promise<Channel> {
  // Zod v4 lazy schemas infer as unknown; runtime validation is still enforced by validateInput
  const v = validateInput(
    UpsertChannelInputSchema,
    input,
    "UpsertChannelInput"
  ) as any;

  const params = {
    channelId: v.channelId ?? null,
    canonicalName: v.canonicalName,
    aliases: v.aliases ?? null,
    description: v.description ?? null,
    channelHandle: v.channelHandle ?? null,
    platformChannelId: v.platformChannelId ?? null,
    webPageUrl: v.webPageUrl ?? null,
    rssUrl: v.rssUrl ?? null,
    imageUrl: v.imageUrl ?? null,
    validAt: v.validAt ?? null,
    invalidAt: v.invalidAt ?? null,
    expiredAt: v.expiredAt ?? null,

    onPlatform: v.onPlatform ?? [],
    hasSeries: v.hasSeries ?? [],
    hasEpisode: v.hasEpisode ?? [],
  };

  const { key, value } = resolveChannelIdentifier(params);
  const upsertCypher = buildChannelUpsertCypher(key);

  try {
    const channel = await executeWrite(async (tx) => {
      // 1) Upsert Channel node
      const writeRes = await tx.run(upsertCypher, { ...params, idValue: value });
      const upsertRecord = firstRecordOrNull(writeRes);
      if (!upsertRecord)
        throw new Error("upsertChannel: no record returned from upsert");

      const chNode = upsertRecord.get("ch");
      const resolvedChannelId =
        chNode?.properties?.channelId ?? chNode?.channelId;

      if (!resolvedChannelId)
        throw Errors.internalError("Upsert did not produce a channelId");

      const nextParams = { ...params, channelId: resolvedChannelId };

      // 2) ON_PLATFORM edges
      if (nextParams.onPlatform.length) {
        await tx.run(channelStatements.channelOnPlatformCypher, nextParams);
      }

      // 3) HAS_SERIES edges
      if (nextParams.hasSeries.length) {
        await tx.run(channelStatements.channelHasSeriesCypher, nextParams);
      }

      // 4) HAS_EPISODE edges
      if (nextParams.hasEpisode.length) {
        await tx.run(channelStatements.channelHasEpisodeCypher, nextParams);
      }

      // 5) Return Channel
      const finalRes = await tx.run(channelStatements.returnChannelCypher, {
        channelId: resolvedChannelId,
      });
      const finalRecord = firstRecordOrNull(finalRes);
      if (!finalRecord)
        throw new Error("upsertChannel: channel not found after writes");

      const node = finalRecord.get("ch");
      return node?.properties ?? node;
    });

    return channel as Channel;
  } catch (err: any) {
    logger.error("upsertChannel: Neo4j write failed", {
      message: err?.message,
      code: err?.code,
      name: err?.name,
      stack: err?.stack,
    });
    throw err;
  }
}

// ============================================================================
// SERIES
// ============================================================================

export async function upsertSeries(input: UpsertSeriesInput): Promise<Series> {
  // Zod v4 lazy schemas infer as unknown; runtime validation is still enforced by validateInput
  const v = validateInput(
    UpsertSeriesInputSchema,
    input,
    "UpsertSeriesInput"
  ) as any;

  const params = {
    seriesId: v.seriesId ?? null,
    canonicalName: v.canonicalName,
    aliases: v.aliases ?? null,
    description: v.description ?? null,
    seriesType: v.seriesType,
    webPageUrl: v.webPageUrl ?? null,
    imageUrl: v.imageUrl ?? null,
    validAt: v.validAt ?? null,
    invalidAt: v.invalidAt ?? null,
    expiredAt: v.expiredAt ?? null,

    inChannel: v.inChannel ?? [],
    includesEpisode: v.includesEpisode ?? [],
  };

  const { key, value } = resolveSeriesIdentifier(params);
  const upsertCypher = buildSeriesUpsertCypher(key);

  try {
    const series = await executeWrite(async (tx) => {
      // 1) Upsert Series node
      const writeRes = await tx.run(upsertCypher, { ...params, idValue: value });
      const upsertRecord = firstRecordOrNull(writeRes);
      if (!upsertRecord)
        throw new Error("upsertSeries: no record returned from upsert");

      const srNode = upsertRecord.get("sr");
      const resolvedSeriesId =
        srNode?.properties?.seriesId ?? srNode?.seriesId;

      if (!resolvedSeriesId)
        throw Errors.internalError("Upsert did not produce a seriesId");

      const nextParams = { ...params, seriesId: resolvedSeriesId };

      // 2) IN_CHANNEL edges
      if (nextParams.inChannel.length) {
        await tx.run(seriesStatements.seriesInChannelCypher, nextParams);
      }

      // 3) INCLUDES_EPISODE edges
      if (nextParams.includesEpisode.length) {
        await tx.run(seriesStatements.seriesIncludesEpisodeCypher, nextParams);
      }

      // 4) Return Series
      const finalRes = await tx.run(seriesStatements.returnSeriesCypher, {
        seriesId: resolvedSeriesId,
      });
      const finalRecord = firstRecordOrNull(finalRes);
      if (!finalRecord)
        throw new Error("upsertSeries: series not found after writes");

      const node = finalRecord.get("sr");
      return node?.properties ?? node;
    });

    return series as Series;
  } catch (err: any) {
    logger.error("upsertSeries: Neo4j write failed", {
      message: err?.message,
      code: err?.code,
      name: err?.name,
      stack: err?.stack,
    });
    throw err;
  }
}

// ============================================================================
// EPISODE
// ============================================================================

export async function upsertEpisode(
  input: UpsertEpisodeInput
): Promise<Episode> {
  // Zod v4 lazy schemas infer as unknown; runtime validation is still enforced by validateInput
  const v = validateInput(
    UpsertEpisodeInputSchema,
    input,
    "UpsertEpisodeInput"
  ) as any;

  const params = {
    episodeId: v.episodeId ?? null,
    canonicalName: v.canonicalName,
    description: v.description ?? null,
    publishedAt: v.publishedAt ?? null,
    durationSec: v.durationSec ?? null,
    language: v.language ?? null,
    s3TranscriptUrl: v.s3TranscriptUrl ?? null,
    transcriptUrl: v.transcriptUrl ?? null,
    webPageUrl: v.webPageUrl ?? null,
    webPageSummary: v.webPageSummary ?? null,
    searchText: v.searchText ?? null,
    embedding: v.embedding ?? null,
    youtubeUrl: v.youtubeUrl ?? null,
    youtubeWatchUrl: v.youtubeWatchUrl ?? null,
    youtubeEmbedUrl: v.youtubeEmbedUrl ?? null,
    socialUrlsJson: v.socialUrlsJson ?? null,
    timestampsJson: v.timestampsJson ?? null,
    validAt: v.validAt ?? null,
    invalidAt: v.invalidAt ?? null,
    expiredAt: v.expiredAt ?? null,

    inChannel: v.inChannel ?? [],
    inSeries: v.inSeries ?? [],
    onPlatform: v.onPlatform ?? [],
    hasSegment: v.hasSegment ?? [],
  };

  const { key, value } = resolveEpisodeIdentifier(params);
  const upsertCypher = buildEpisodeUpsertCypher(key);

  try {
    const episode = await executeWrite(async (tx) => {
      // 1) Upsert Episode node
      const writeRes = await tx.run(upsertCypher, { ...params, idValue: value });
      const upsertRecord = firstRecordOrNull(writeRes);
      if (!upsertRecord)
        throw new Error("upsertEpisode: no record returned from upsert");

      const epNode = upsertRecord.get("ep");
      const resolvedEpisodeId =
        epNode?.properties?.episodeId ?? epNode?.episodeId;

      if (!resolvedEpisodeId)
        throw Errors.internalError("Upsert did not produce an episodeId");

      const nextParams = { ...params, episodeId: resolvedEpisodeId };

      // 2) IN_CHANNEL edges
      if (nextParams.inChannel.length) {
        await tx.run(episodeStatements.episodeInChannelCypher, nextParams);
      }

      // 3) IN_SERIES edges
      if (nextParams.inSeries.length) {
        await tx.run(episodeStatements.episodeInSeriesCypher, nextParams);
      }

      // 4) ON_PLATFORM edges
      if (nextParams.onPlatform.length) {
        await tx.run(episodeStatements.episodeOnPlatformCypher, nextParams);
      }

      // 5) HAS_SEGMENT edges
      if (nextParams.hasSegment.length) {
        await tx.run(episodeStatements.episodeHasSegmentCypher, nextParams);
      }

      // 6) Return Episode
      const finalRes = await tx.run(episodeStatements.returnEpisodeCypher, {
        episodeId: resolvedEpisodeId,
      });
      const finalRecord = firstRecordOrNull(finalRes);
      if (!finalRecord)
        throw new Error("upsertEpisode: episode not found after writes");

      const node = finalRecord.get("ep");
      return node?.properties ?? node;
    });

    return episode as Episode;
  } catch (err: any) {
    logger.error("upsertEpisode: Neo4j write failed", {
      message: err?.message,
      code: err?.code,
      name: err?.name,
      stack: err?.stack,
    });
    throw err;
  }
}

// ============================================================================
// UPSERT EPISODE SEGMENTS
// Resolves the episode reference first (connect / connectByKey / upsert),
// then upserts each segment and wires HAS_SEGMENT edges.
// ============================================================================

export async function upsertEpisodeSegments(
  input: UpsertEpisodeSegmentsInput
): Promise<Episode> {
  // Zod v4 lazy schemas infer as unknown; runtime validation is still enforced by validateInput
  const v = validateInput(
    UpsertEpisodeSegmentsInputSchema,
    input,
    "UpsertEpisodeSegmentsInput"
  ) as any;

  try {
    const episode = await executeWrite(async (tx) => {
      // 1) Resolve or create the episode
      const resolvedEpisodeId = await resolveEpisodeRef(tx, v.episode);

      // 2) Wire HAS_SEGMENT edges
      if (v.segments.length) {
        await tx.run(episodeStatements.episodeHasSegmentCypher, {
          episodeId: resolvedEpisodeId,
          // Map input.segments → $hasSegment consumed by episodeHasSegmentCypher
          hasSegment: v.segments,
        });
      }

      // 3) Return Episode
      const finalRes = await tx.run(episodeStatements.returnEpisodeCypher, {
        episodeId: resolvedEpisodeId,
      });
      const finalRecord = firstRecordOrNull(finalRes);
      if (!finalRecord)
        throw new Error(
          "upsertEpisodeSegments: episode not found after segment writes"
        );

      const node = finalRecord.get("ep");
      return node?.properties ?? node;
    });

    return episode as Episode;
  } catch (err: any) {
    logger.error("upsertEpisodeSegments: Neo4j write failed", {
      message: err?.message,
      code: err?.code,
      name: err?.name,
      stack: err?.stack,
    });
    throw err;
  }
}

// ============================================================================
// Internal helper — resolves an EpisodeRelateUpsertInput within a transaction
// Returns the resolved episodeId.
// For the upsert branch, only scalar Episode properties are written
// (nested edge arrays are intentionally skipped here — use upsertEpisode for those).
// ============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function resolveEpisodeRef(
  tx: Parameters<Parameters<typeof executeWrite>[0]>[0],
  // typed as any because EpisodeRelateUpsertInput infers unknown in Zod v4 due to lazy schema
  episodeRef: any
): Promise<string> {
  // ---- connect branch: HARD FAIL if episode missing ----
  if (episodeRef.connect) {
    const res = await tx.run(
      `OPTIONAL MATCH (ep:Episode {episodeId: $episodeId})
       RETURN ep.episodeId AS episodeId`,
      { episodeId: episodeRef.connect.episodeId }
    );
    const record = firstRecordOrNull(res);
    const episodeId = record?.get("episodeId");
    if (!episodeId)
      throw Errors.notFound("Episode", episodeRef.connect.episodeId);
    return episodeId as string;
  }

  // ---- connectByKey branch: HARD FAIL if episode missing ----
  if (episodeRef.connectByKey) {
    const res = await tx.run(
      `OPTIONAL MATCH (ep:Episode {webPageUrl: $webPageUrl})
       RETURN ep.episodeId AS episodeId`,
      { webPageUrl: episodeRef.connectByKey.webPageUrl }
    );
    const record = firstRecordOrNull(res);
    const episodeId = record?.get("episodeId");
    if (!episodeId)
      throw Errors.notFound("Episode", episodeRef.connectByKey.webPageUrl);
    return episodeId as string;
  }

  // ---- upsert branch: create/update Episode scalars ----
  if (episodeRef.upsert) {
    const upsertData = episodeRef.upsert;
    const { key, value } = resolveEpisodeIdentifier({
      episodeId: upsertData.episodeId,
      webPageUrl: upsertData.webPageUrl,
      canonicalName: upsertData.canonicalName,
    });
    const upsertCypher = buildEpisodeUpsertCypher(key);

    const episodeParams = {
      idValue: value,
      episodeId: upsertData.episodeId ?? null,
      canonicalName: upsertData.canonicalName,
      description: upsertData.description ?? null,
      publishedAt: upsertData.publishedAt ?? null,
      durationSec: upsertData.durationSec ?? null,
      language: upsertData.language ?? null,
      s3TranscriptUrl: upsertData.s3TranscriptUrl ?? null,
      transcriptUrl: upsertData.transcriptUrl ?? null,
      webPageUrl: upsertData.webPageUrl ?? null,
      webPageSummary: upsertData.webPageSummary ?? null,
      searchText: upsertData.searchText ?? null,
      embedding: upsertData.embedding ?? null,
      youtubeUrl: upsertData.youtubeUrl ?? null,
      youtubeWatchUrl: upsertData.youtubeWatchUrl ?? null,
      youtubeEmbedUrl: upsertData.youtubeEmbedUrl ?? null,
      socialUrlsJson: upsertData.socialUrlsJson ?? null,
      timestampsJson: upsertData.timestampsJson ?? null,
      validAt: upsertData.validAt ?? null,
      invalidAt: upsertData.invalidAt ?? null,
      expiredAt: upsertData.expiredAt ?? null,
    };

    const res = await tx.run(upsertCypher, episodeParams);
    const record = firstRecordOrNull(res);
    if (!record)
      throw Errors.internalError(
        "upsertEpisodeSegments: episode upsert returned no record"
      );

    const epNode = record.get("ep");
    const episodeId = epNode?.properties?.episodeId ?? epNode?.episodeId;
    if (!episodeId)
      throw Errors.internalError(
        "upsertEpisodeSegments: episode upsert did not produce an episodeId"
      );

    return episodeId as string;
  }

  throw Errors.invalidInput(
    "EpisodeRelateUpsertInput: must provide connect, connectByKey, or upsert"
  );
}
