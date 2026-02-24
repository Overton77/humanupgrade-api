import {
  ChannelIdentifierKey,
  EpisodeIdentifierKey,
  EpisodeSegmentIdentifierKey,
  PlatformIdentifierKey,
  SeriesIdentifierKey,
} from "../types.js";

// ============================================================================
// PLATFORM
// ============================================================================

export function buildPlatformUpsertCypher(key: PlatformIdentifierKey): string {
  return `
    MERGE (pt:Platform { ${key}: $idValue })
    ON CREATE SET pt.createdAt = datetime()

    SET pt.platformId = coalesce(pt.platformId, randomUUID())

    SET pt += {
      canonicalName: CASE WHEN $canonicalName IS NULL THEN pt.canonicalName ELSE $canonicalName END,
      aliases: CASE
        WHEN $aliases IS NULL THEN pt.aliases
        ELSE apoc.coll.toSet(coalesce(pt.aliases, []) + coalesce($aliases, []))
      END,
      platformType: CASE WHEN $platformType IS NULL THEN pt.platformType ELSE $platformType END,
      description: CASE WHEN $description IS NULL THEN pt.description ELSE $description END,
      websiteUrl: CASE WHEN $websiteUrl IS NULL THEN pt.websiteUrl ELSE $websiteUrl END,
      validAt: CASE WHEN $validAt IS NULL THEN pt.validAt ELSE $validAt END,
      invalidAt: CASE WHEN $invalidAt IS NULL THEN pt.invalidAt ELSE $invalidAt END,
      expiredAt: CASE WHEN $expiredAt IS NULL THEN pt.expiredAt ELSE $expiredAt END
    }

    RETURN pt
  `;
}

// (Platform)-[:HOSTS_CHANNEL]->(Channel)
// Params: $platformId, $hostsChannel
export const platformHostsChannelCypher = `
MATCH (pt:Platform {platformId: $platformId})

UNWIND coalesce($hostsChannel, []) AS chRel
CALL {
  // ---- upsert branch ----
  WITH pt, chRel
  WITH pt, chRel
  WHERE chRel.channel.upsert IS NOT NULL

  MERGE (ch:Channel {channelId: coalesce(chRel.channel.upsert.channelId, randomUUID())})
  ON CREATE SET ch.createdAt = datetime()

  SET ch += {
    canonicalName: CASE WHEN chRel.channel.upsert.canonicalName IS NULL THEN ch.canonicalName ELSE chRel.channel.upsert.canonicalName END,
    aliases: CASE
      WHEN chRel.channel.upsert.aliases IS NULL THEN ch.aliases
      ELSE apoc.coll.toSet(coalesce(ch.aliases, []) + coalesce(chRel.channel.upsert.aliases, []))
    END,
    description: CASE WHEN chRel.channel.upsert.description IS NULL THEN ch.description ELSE chRel.channel.upsert.description END,
    channelHandle: CASE WHEN chRel.channel.upsert.channelHandle IS NULL THEN ch.channelHandle ELSE chRel.channel.upsert.channelHandle END,
    platformChannelId: CASE WHEN chRel.channel.upsert.platformChannelId IS NULL THEN ch.platformChannelId ELSE chRel.channel.upsert.platformChannelId END,
    webPageUrl: CASE WHEN chRel.channel.upsert.webPageUrl IS NULL THEN ch.webPageUrl ELSE chRel.channel.upsert.webPageUrl END,
    rssUrl: CASE WHEN chRel.channel.upsert.rssUrl IS NULL THEN ch.rssUrl ELSE chRel.channel.upsert.rssUrl END,
    imageUrl: CASE WHEN chRel.channel.upsert.imageUrl IS NULL THEN ch.imageUrl ELSE chRel.channel.upsert.imageUrl END,
    validAt: CASE WHEN chRel.channel.upsert.validAt IS NULL THEN ch.validAt ELSE chRel.channel.upsert.validAt END,
    invalidAt: CASE WHEN chRel.channel.upsert.invalidAt IS NULL THEN ch.invalidAt ELSE chRel.channel.upsert.invalidAt END,
    expiredAt: CASE WHEN chRel.channel.upsert.expiredAt IS NULL THEN ch.expiredAt ELSE chRel.channel.upsert.expiredAt END
  }

  MERGE (pt)-[r:HOSTS_CHANNEL]->(ch)
  ON CREATE SET r.createdAt = datetime()
  SET r += {
    createdAt: CASE WHEN chRel.createdAt IS NULL THEN r.createdAt ELSE chRel.createdAt END,
    validAt: CASE WHEN chRel.validAt IS NULL THEN r.validAt ELSE chRel.validAt END,
    invalidAt: CASE WHEN chRel.invalidAt IS NULL THEN r.invalidAt ELSE chRel.invalidAt END,
    expiredAt: CASE WHEN chRel.expiredAt IS NULL THEN r.expiredAt ELSE chRel.expiredAt END
  }

  RETURN 1 AS ok

  UNION

  // ---- connect branch (HARD FAIL if missing) ----
  WITH pt, chRel
  WITH pt, chRel
  WHERE chRel.channel.connect IS NOT NULL

  OPTIONAL MATCH (ch:Channel {channelId: chRel.channel.connect.channelId})
  WITH pt, chRel, ch

  CALL apoc.util.validate(
    ch IS NULL,
    'HOSTS_CHANNEL connect failed: Channel not found for channelId %s',
    [chRel.channel.connect.channelId]
  )

  MERGE (pt)-[r:HOSTS_CHANNEL]->(ch)
  ON CREATE SET r.createdAt = datetime()
  SET r += {
    createdAt: CASE WHEN chRel.createdAt IS NULL THEN r.createdAt ELSE chRel.createdAt END,
    validAt: CASE WHEN chRel.validAt IS NULL THEN r.validAt ELSE chRel.validAt END,
    invalidAt: CASE WHEN chRel.invalidAt IS NULL THEN r.invalidAt ELSE chRel.invalidAt END,
    expiredAt: CASE WHEN chRel.expiredAt IS NULL THEN r.expiredAt ELSE chRel.expiredAt END
  }

  RETURN 1 AS ok

  UNION

  // ---- connectByKey branch (HARD FAIL if missing) ----
  // Identifies Channel via its ON_PLATFORM relationship to a known Platform
  WITH pt, chRel
  WITH pt, chRel
  WHERE chRel.channel.connectByKey IS NOT NULL

  OPTIONAL MATCH (ch:Channel)-[:ON_PLATFORM]->(kp:Platform {platformId: chRel.channel.connectByKey.platformId})
  WHERE (chRel.channel.connectByKey.platformChannelId IS NOT NULL AND ch.platformChannelId = chRel.channel.connectByKey.platformChannelId)
     OR (chRel.channel.connectByKey.channelHandle IS NOT NULL AND ch.channelHandle = chRel.channel.connectByKey.channelHandle)
  WITH pt, chRel, ch

  CALL apoc.util.validate(
    ch IS NULL,
    'HOSTS_CHANNEL connectByKey failed: Channel not found for platformId %s',
    [chRel.channel.connectByKey.platformId]
  )

  MERGE (pt)-[r:HOSTS_CHANNEL]->(ch)
  ON CREATE SET r.createdAt = datetime()
  SET r += {
    createdAt: CASE WHEN chRel.createdAt IS NULL THEN r.createdAt ELSE chRel.createdAt END,
    validAt: CASE WHEN chRel.validAt IS NULL THEN r.validAt ELSE chRel.validAt END,
    invalidAt: CASE WHEN chRel.invalidAt IS NULL THEN r.invalidAt ELSE chRel.invalidAt END,
    expiredAt: CASE WHEN chRel.expiredAt IS NULL THEN r.expiredAt ELSE chRel.expiredAt END
  }

  RETURN 1 AS ok
}

RETURN 1 AS ok
`;

export const returnPlatformCypher = `
MATCH (pt:Platform {platformId: $platformId})
RETURN pt
`;

export const platformStatements = {
  platformHostsChannelCypher,
  returnPlatformCypher,
};

// ============================================================================
// CHANNEL
// ============================================================================

export function buildChannelUpsertCypher(key: ChannelIdentifierKey): string {
  return `
    MERGE (ch:Channel { ${key}: $idValue })
    ON CREATE SET ch.createdAt = datetime()

    SET ch.channelId = coalesce(ch.channelId, randomUUID())

    SET ch += {
      canonicalName: CASE WHEN $canonicalName IS NULL THEN ch.canonicalName ELSE $canonicalName END,
      aliases: CASE
        WHEN $aliases IS NULL THEN ch.aliases
        ELSE apoc.coll.toSet(coalesce(ch.aliases, []) + coalesce($aliases, []))
      END,
      description: CASE WHEN $description IS NULL THEN ch.description ELSE $description END,
      channelHandle: CASE WHEN $channelHandle IS NULL THEN ch.channelHandle ELSE $channelHandle END,
      platformChannelId: CASE WHEN $platformChannelId IS NULL THEN ch.platformChannelId ELSE $platformChannelId END,
      webPageUrl: CASE WHEN $webPageUrl IS NULL THEN ch.webPageUrl ELSE $webPageUrl END,
      rssUrl: CASE WHEN $rssUrl IS NULL THEN ch.rssUrl ELSE $rssUrl END,
      imageUrl: CASE WHEN $imageUrl IS NULL THEN ch.imageUrl ELSE $imageUrl END,
      validAt: CASE WHEN $validAt IS NULL THEN ch.validAt ELSE $validAt END,
      invalidAt: CASE WHEN $invalidAt IS NULL THEN ch.invalidAt ELSE $invalidAt END,
      expiredAt: CASE WHEN $expiredAt IS NULL THEN ch.expiredAt ELSE $expiredAt END
    }

    RETURN ch
  `;
}

// (Channel)-[:ON_PLATFORM]->(Platform)
// Params: $channelId, $onPlatform
export const channelOnPlatformCypher = `
MATCH (ch:Channel {channelId: $channelId})

UNWIND coalesce($onPlatform, []) AS ptRel
CALL {
  // ---- upsert branch ----
  WITH ch, ptRel
  WITH ch, ptRel
  WHERE ptRel.platform.upsert IS NOT NULL

  MERGE (pt:Platform {platformId: coalesce(ptRel.platform.upsert.platformId, randomUUID())})
  ON CREATE SET pt.createdAt = datetime()

  SET pt += {
    canonicalName: CASE WHEN ptRel.platform.upsert.canonicalName IS NULL THEN pt.canonicalName ELSE ptRel.platform.upsert.canonicalName END,
    aliases: CASE
      WHEN ptRel.platform.upsert.aliases IS NULL THEN pt.aliases
      ELSE apoc.coll.toSet(coalesce(pt.aliases, []) + coalesce(ptRel.platform.upsert.aliases, []))
    END,
    platformType: CASE WHEN ptRel.platform.upsert.platformType IS NULL THEN pt.platformType ELSE ptRel.platform.upsert.platformType END,
    description: CASE WHEN ptRel.platform.upsert.description IS NULL THEN pt.description ELSE ptRel.platform.upsert.description END,
    websiteUrl: CASE WHEN ptRel.platform.upsert.websiteUrl IS NULL THEN pt.websiteUrl ELSE ptRel.platform.upsert.websiteUrl END,
    validAt: CASE WHEN ptRel.platform.upsert.validAt IS NULL THEN pt.validAt ELSE ptRel.platform.upsert.validAt END,
    invalidAt: CASE WHEN ptRel.platform.upsert.invalidAt IS NULL THEN pt.invalidAt ELSE ptRel.platform.upsert.invalidAt END,
    expiredAt: CASE WHEN ptRel.platform.upsert.expiredAt IS NULL THEN pt.expiredAt ELSE ptRel.platform.upsert.expiredAt END
  }

  MERGE (ch)-[r:ON_PLATFORM]->(pt)
  ON CREATE SET r.createdAt = datetime()
  SET r += {
    createdAt: CASE WHEN ptRel.createdAt IS NULL THEN r.createdAt ELSE ptRel.createdAt END,
    validAt: CASE WHEN ptRel.validAt IS NULL THEN r.validAt ELSE ptRel.validAt END,
    invalidAt: CASE WHEN ptRel.invalidAt IS NULL THEN r.invalidAt ELSE ptRel.invalidAt END,
    expiredAt: CASE WHEN ptRel.expiredAt IS NULL THEN r.expiredAt ELSE ptRel.expiredAt END
  }

  RETURN 1 AS ok

  UNION

  // ---- connect branch (HARD FAIL if missing) ----
  WITH ch, ptRel
  WITH ch, ptRel
  WHERE ptRel.platform.connect IS NOT NULL

  OPTIONAL MATCH (pt:Platform {platformId: ptRel.platform.connect.platformId})
  WITH ch, ptRel, pt

  CALL apoc.util.validate(
    pt IS NULL,
    'ON_PLATFORM connect failed: Platform not found for platformId %s',
    [ptRel.platform.connect.platformId]
  )

  MERGE (ch)-[r:ON_PLATFORM]->(pt)
  ON CREATE SET r.createdAt = datetime()
  SET r += {
    createdAt: CASE WHEN ptRel.createdAt IS NULL THEN r.createdAt ELSE ptRel.createdAt END,
    validAt: CASE WHEN ptRel.validAt IS NULL THEN r.validAt ELSE ptRel.validAt END,
    invalidAt: CASE WHEN ptRel.invalidAt IS NULL THEN r.invalidAt ELSE ptRel.invalidAt END,
    expiredAt: CASE WHEN ptRel.expiredAt IS NULL THEN r.expiredAt ELSE ptRel.expiredAt END
  }

  RETURN 1 AS ok

  UNION

  // ---- connectByKey branch (HARD FAIL if missing) ----
  // Platform is uniquely identified by its canonicalName
  WITH ch, ptRel
  WITH ch, ptRel
  WHERE ptRel.platform.connectByKey IS NOT NULL

  OPTIONAL MATCH (pt:Platform {canonicalName: ptRel.platform.connectByKey.canonicalName})
  WITH ch, ptRel, pt

  CALL apoc.util.validate(
    pt IS NULL,
    'ON_PLATFORM connectByKey failed: Platform not found for canonicalName %s',
    [ptRel.platform.connectByKey.canonicalName]
  )

  MERGE (ch)-[r:ON_PLATFORM]->(pt)
  ON CREATE SET r.createdAt = datetime()
  SET r += {
    createdAt: CASE WHEN ptRel.createdAt IS NULL THEN r.createdAt ELSE ptRel.createdAt END,
    validAt: CASE WHEN ptRel.validAt IS NULL THEN r.validAt ELSE ptRel.validAt END,
    invalidAt: CASE WHEN ptRel.invalidAt IS NULL THEN r.invalidAt ELSE ptRel.invalidAt END,
    expiredAt: CASE WHEN ptRel.expiredAt IS NULL THEN r.expiredAt ELSE ptRel.expiredAt END
  }

  RETURN 1 AS ok
}

RETURN 1 AS ok
`;

// (Channel)-[:HAS_SERIES]->(Series)
// Params: $channelId, $hasSeries
export const channelHasSeriesCypher = `
MATCH (ch:Channel {channelId: $channelId})

UNWIND coalesce($hasSeries, []) AS srRel
CALL {
  // ---- upsert branch ----
  WITH ch, srRel
  WITH ch, srRel
  WHERE srRel.series.upsert IS NOT NULL

  MERGE (sr:Series {seriesId: coalesce(srRel.series.upsert.seriesId, randomUUID())})
  ON CREATE SET sr.createdAt = datetime()

  SET sr += {
    canonicalName: CASE WHEN srRel.series.upsert.canonicalName IS NULL THEN sr.canonicalName ELSE srRel.series.upsert.canonicalName END,
    aliases: CASE
      WHEN srRel.series.upsert.aliases IS NULL THEN sr.aliases
      ELSE apoc.coll.toSet(coalesce(sr.aliases, []) + coalesce(srRel.series.upsert.aliases, []))
    END,
    description: CASE WHEN srRel.series.upsert.description IS NULL THEN sr.description ELSE srRel.series.upsert.description END,
    seriesType: CASE WHEN srRel.series.upsert.seriesType IS NULL THEN sr.seriesType ELSE srRel.series.upsert.seriesType END,
    webPageUrl: CASE WHEN srRel.series.upsert.webPageUrl IS NULL THEN sr.webPageUrl ELSE srRel.series.upsert.webPageUrl END,
    imageUrl: CASE WHEN srRel.series.upsert.imageUrl IS NULL THEN sr.imageUrl ELSE srRel.series.upsert.imageUrl END,
    validAt: CASE WHEN srRel.series.upsert.validAt IS NULL THEN sr.validAt ELSE srRel.series.upsert.validAt END,
    invalidAt: CASE WHEN srRel.series.upsert.invalidAt IS NULL THEN sr.invalidAt ELSE srRel.series.upsert.invalidAt END,
    expiredAt: CASE WHEN srRel.series.upsert.expiredAt IS NULL THEN sr.expiredAt ELSE srRel.series.upsert.expiredAt END
  }

  MERGE (ch)-[r:HAS_SERIES]->(sr)
  ON CREATE SET r.createdAt = datetime()
  SET r += {
    orderIndex: CASE WHEN srRel.orderIndex IS NULL THEN r.orderIndex ELSE srRel.orderIndex END,
    createdAt: CASE WHEN srRel.createdAt IS NULL THEN r.createdAt ELSE srRel.createdAt END,
    validAt: CASE WHEN srRel.validAt IS NULL THEN r.validAt ELSE srRel.validAt END,
    invalidAt: CASE WHEN srRel.invalidAt IS NULL THEN r.invalidAt ELSE srRel.invalidAt END,
    expiredAt: CASE WHEN srRel.expiredAt IS NULL THEN r.expiredAt ELSE srRel.expiredAt END
  }

  RETURN 1 AS ok

  UNION

  // ---- connect branch (HARD FAIL if missing) ----
  WITH ch, srRel
  WITH ch, srRel
  WHERE srRel.series.connect IS NOT NULL

  OPTIONAL MATCH (sr:Series {seriesId: srRel.series.connect.seriesId})
  WITH ch, srRel, sr

  CALL apoc.util.validate(
    sr IS NULL,
    'HAS_SERIES connect failed: Series not found for seriesId %s',
    [srRel.series.connect.seriesId]
  )

  MERGE (ch)-[r:HAS_SERIES]->(sr)
  ON CREATE SET r.createdAt = datetime()
  SET r += {
    orderIndex: CASE WHEN srRel.orderIndex IS NULL THEN r.orderIndex ELSE srRel.orderIndex END,
    createdAt: CASE WHEN srRel.createdAt IS NULL THEN r.createdAt ELSE srRel.createdAt END,
    validAt: CASE WHEN srRel.validAt IS NULL THEN r.validAt ELSE srRel.validAt END,
    invalidAt: CASE WHEN srRel.invalidAt IS NULL THEN r.invalidAt ELSE srRel.invalidAt END,
    expiredAt: CASE WHEN srRel.expiredAt IS NULL THEN r.expiredAt ELSE srRel.expiredAt END
  }

  RETURN 1 AS ok

  UNION

  // ---- connectByKey branch (HARD FAIL if missing) ----
  // Series is uniquely identified by (channelId, canonicalName) — find via HAS_SERIES relationship
  WITH ch, srRel
  WITH ch, srRel
  WHERE srRel.series.connectByKey IS NOT NULL

  OPTIONAL MATCH (kc:Channel {channelId: srRel.series.connectByKey.channelId})-[:HAS_SERIES]->(sr:Series {canonicalName: srRel.series.connectByKey.canonicalName})
  WITH ch, srRel, sr

  CALL apoc.util.validate(
    sr IS NULL,
    'HAS_SERIES connectByKey failed: Series not found for channelId %s canonicalName %s',
    [srRel.series.connectByKey.channelId, srRel.series.connectByKey.canonicalName]
  )

  MERGE (ch)-[r:HAS_SERIES]->(sr)
  ON CREATE SET r.createdAt = datetime()
  SET r += {
    orderIndex: CASE WHEN srRel.orderIndex IS NULL THEN r.orderIndex ELSE srRel.orderIndex END,
    createdAt: CASE WHEN srRel.createdAt IS NULL THEN r.createdAt ELSE srRel.createdAt END,
    validAt: CASE WHEN srRel.validAt IS NULL THEN r.validAt ELSE srRel.validAt END,
    invalidAt: CASE WHEN srRel.invalidAt IS NULL THEN r.invalidAt ELSE srRel.invalidAt END,
    expiredAt: CASE WHEN srRel.expiredAt IS NULL THEN r.expiredAt ELSE srRel.expiredAt END
  }

  RETURN 1 AS ok
}

RETURN 1 AS ok
`;

// (Channel)-[:HAS_EPISODE]->(Episode)
// Params: $channelId, $hasEpisode
export const channelHasEpisodeCypher = `
MATCH (ch:Channel {channelId: $channelId})

UNWIND coalesce($hasEpisode, []) AS epRel
CALL {
  // ---- upsert branch ----
  WITH ch, epRel
  WITH ch, epRel
  WHERE epRel.episode.upsert IS NOT NULL

  MERGE (ep:Episode {episodeId: coalesce(epRel.episode.upsert.episodeId, randomUUID())})
  ON CREATE SET ep.createdAt = datetime()

  SET ep += {
    canonicalName: CASE WHEN epRel.episode.upsert.canonicalName IS NULL THEN ep.canonicalName ELSE epRel.episode.upsert.canonicalName END,
    description: CASE WHEN epRel.episode.upsert.description IS NULL THEN ep.description ELSE epRel.episode.upsert.description END,
    publishedAt: CASE WHEN epRel.episode.upsert.publishedAt IS NULL THEN ep.publishedAt ELSE epRel.episode.upsert.publishedAt END,
    durationSec: CASE WHEN epRel.episode.upsert.durationSec IS NULL THEN ep.durationSec ELSE epRel.episode.upsert.durationSec END,
    language: CASE WHEN epRel.episode.upsert.language IS NULL THEN ep.language ELSE epRel.episode.upsert.language END,
    s3TranscriptUrl: CASE WHEN epRel.episode.upsert.s3TranscriptUrl IS NULL THEN ep.s3TranscriptUrl ELSE epRel.episode.upsert.s3TranscriptUrl END,
    transcriptUrl: CASE WHEN epRel.episode.upsert.transcriptUrl IS NULL THEN ep.transcriptUrl ELSE epRel.episode.upsert.transcriptUrl END,
    webPageUrl: CASE WHEN epRel.episode.upsert.webPageUrl IS NULL THEN ep.webPageUrl ELSE epRel.episode.upsert.webPageUrl END,
    webPageSummary: CASE WHEN epRel.episode.upsert.webPageSummary IS NULL THEN ep.webPageSummary ELSE epRel.episode.upsert.webPageSummary END,
    searchText: CASE WHEN epRel.episode.upsert.searchText IS NULL THEN ep.searchText ELSE epRel.episode.upsert.searchText END,
    embedding: CASE WHEN epRel.episode.upsert.embedding IS NULL THEN ep.embedding ELSE epRel.episode.upsert.embedding END,
    youtubeUrl: CASE WHEN epRel.episode.upsert.youtubeUrl IS NULL THEN ep.youtubeUrl ELSE epRel.episode.upsert.youtubeUrl END,
    youtubeWatchUrl: CASE WHEN epRel.episode.upsert.youtubeWatchUrl IS NULL THEN ep.youtubeWatchUrl ELSE epRel.episode.upsert.youtubeWatchUrl END,
    youtubeEmbedUrl: CASE WHEN epRel.episode.upsert.youtubeEmbedUrl IS NULL THEN ep.youtubeEmbedUrl ELSE epRel.episode.upsert.youtubeEmbedUrl END,
    socialUrlsJson: CASE WHEN epRel.episode.upsert.socialUrlsJson IS NULL THEN ep.socialUrlsJson ELSE epRel.episode.upsert.socialUrlsJson END,
    timestampsJson: CASE WHEN epRel.episode.upsert.timestampsJson IS NULL THEN ep.timestampsJson ELSE epRel.episode.upsert.timestampsJson END,
    validAt: CASE WHEN epRel.episode.upsert.validAt IS NULL THEN ep.validAt ELSE epRel.episode.upsert.validAt END,
    invalidAt: CASE WHEN epRel.episode.upsert.invalidAt IS NULL THEN ep.invalidAt ELSE epRel.episode.upsert.invalidAt END,
    expiredAt: CASE WHEN epRel.episode.upsert.expiredAt IS NULL THEN ep.expiredAt ELSE epRel.episode.upsert.expiredAt END
  }

  MERGE (ch)-[r:HAS_EPISODE]->(ep)
  ON CREATE SET r.createdAt = datetime()
  SET r += {
    publishedAt: CASE WHEN epRel.publishedAt IS NULL THEN r.publishedAt ELSE epRel.publishedAt END,
    createdAt: CASE WHEN epRel.createdAt IS NULL THEN r.createdAt ELSE epRel.createdAt END,
    validAt: CASE WHEN epRel.validAt IS NULL THEN r.validAt ELSE epRel.validAt END,
    invalidAt: CASE WHEN epRel.invalidAt IS NULL THEN r.invalidAt ELSE epRel.invalidAt END,
    expiredAt: CASE WHEN epRel.expiredAt IS NULL THEN r.expiredAt ELSE epRel.expiredAt END
  }

  RETURN 1 AS ok

  UNION

  // ---- connect branch (HARD FAIL if missing) ----
  WITH ch, epRel
  WITH ch, epRel
  WHERE epRel.episode.connect IS NOT NULL

  OPTIONAL MATCH (ep:Episode {episodeId: epRel.episode.connect.episodeId})
  WITH ch, epRel, ep

  CALL apoc.util.validate(
    ep IS NULL,
    'HAS_EPISODE connect failed: Episode not found for episodeId %s',
    [epRel.episode.connect.episodeId]
  )

  MERGE (ch)-[r:HAS_EPISODE]->(ep)
  ON CREATE SET r.createdAt = datetime()
  SET r += {
    publishedAt: CASE WHEN epRel.publishedAt IS NULL THEN r.publishedAt ELSE epRel.publishedAt END,
    createdAt: CASE WHEN epRel.createdAt IS NULL THEN r.createdAt ELSE epRel.createdAt END,
    validAt: CASE WHEN epRel.validAt IS NULL THEN r.validAt ELSE epRel.validAt END,
    invalidAt: CASE WHEN epRel.invalidAt IS NULL THEN r.invalidAt ELSE epRel.invalidAt END,
    expiredAt: CASE WHEN epRel.expiredAt IS NULL THEN r.expiredAt ELSE epRel.expiredAt END
  }

  RETURN 1 AS ok

  UNION

  // ---- connectByKey branch (HARD FAIL if missing) ----
  // Episode is uniquely identified by webPageUrl
  WITH ch, epRel
  WITH ch, epRel
  WHERE epRel.episode.connectByKey IS NOT NULL

  OPTIONAL MATCH (ep:Episode {webPageUrl: epRel.episode.connectByKey.webPageUrl})
  WITH ch, epRel, ep

  CALL apoc.util.validate(
    ep IS NULL,
    'HAS_EPISODE connectByKey failed: Episode not found for webPageUrl %s',
    [epRel.episode.connectByKey.webPageUrl]
  )

  MERGE (ch)-[r:HAS_EPISODE]->(ep)
  ON CREATE SET r.createdAt = datetime()
  SET r += {
    publishedAt: CASE WHEN epRel.publishedAt IS NULL THEN r.publishedAt ELSE epRel.publishedAt END,
    createdAt: CASE WHEN epRel.createdAt IS NULL THEN r.createdAt ELSE epRel.createdAt END,
    validAt: CASE WHEN epRel.validAt IS NULL THEN r.validAt ELSE epRel.validAt END,
    invalidAt: CASE WHEN epRel.invalidAt IS NULL THEN r.invalidAt ELSE epRel.invalidAt END,
    expiredAt: CASE WHEN epRel.expiredAt IS NULL THEN r.expiredAt ELSE epRel.expiredAt END
  }

  RETURN 1 AS ok
}

RETURN 1 AS ok
`;

export const returnChannelCypher = `
MATCH (ch:Channel {channelId: $channelId})
RETURN ch
`;

export const channelStatements = {
  channelOnPlatformCypher,
  channelHasSeriesCypher,
  channelHasEpisodeCypher,
  returnChannelCypher,
};

// ============================================================================
// SERIES
// ============================================================================

export function buildSeriesUpsertCypher(key: SeriesIdentifierKey): string {
  return `
    MERGE (sr:Series { ${key}: $idValue })
    ON CREATE SET sr.createdAt = datetime()

    SET sr.seriesId = coalesce(sr.seriesId, randomUUID())

    SET sr += {
      canonicalName: CASE WHEN $canonicalName IS NULL THEN sr.canonicalName ELSE $canonicalName END,
      aliases: CASE
        WHEN $aliases IS NULL THEN sr.aliases
        ELSE apoc.coll.toSet(coalesce(sr.aliases, []) + coalesce($aliases, []))
      END,
      description: CASE WHEN $description IS NULL THEN sr.description ELSE $description END,
      seriesType: CASE WHEN $seriesType IS NULL THEN sr.seriesType ELSE $seriesType END,
      webPageUrl: CASE WHEN $webPageUrl IS NULL THEN sr.webPageUrl ELSE $webPageUrl END,
      imageUrl: CASE WHEN $imageUrl IS NULL THEN sr.imageUrl ELSE $imageUrl END,
      validAt: CASE WHEN $validAt IS NULL THEN sr.validAt ELSE $validAt END,
      invalidAt: CASE WHEN $invalidAt IS NULL THEN sr.invalidAt ELSE $invalidAt END,
      expiredAt: CASE WHEN $expiredAt IS NULL THEN sr.expiredAt ELSE $expiredAt END
    }

    RETURN sr
  `;
}

// (Series)-[:IN_CHANNEL]->(Channel)
// Params: $seriesId, $inChannel
export const seriesInChannelCypher = `
MATCH (sr:Series {seriesId: $seriesId})

UNWIND coalesce($inChannel, []) AS chRel
CALL {
  // ---- upsert branch ----
  WITH sr, chRel
  WITH sr, chRel
  WHERE chRel.channel.upsert IS NOT NULL

  MERGE (ch:Channel {channelId: coalesce(chRel.channel.upsert.channelId, randomUUID())})
  ON CREATE SET ch.createdAt = datetime()

  SET ch += {
    canonicalName: CASE WHEN chRel.channel.upsert.canonicalName IS NULL THEN ch.canonicalName ELSE chRel.channel.upsert.canonicalName END,
    aliases: CASE
      WHEN chRel.channel.upsert.aliases IS NULL THEN ch.aliases
      ELSE apoc.coll.toSet(coalesce(ch.aliases, []) + coalesce(chRel.channel.upsert.aliases, []))
    END,
    description: CASE WHEN chRel.channel.upsert.description IS NULL THEN ch.description ELSE chRel.channel.upsert.description END,
    channelHandle: CASE WHEN chRel.channel.upsert.channelHandle IS NULL THEN ch.channelHandle ELSE chRel.channel.upsert.channelHandle END,
    platformChannelId: CASE WHEN chRel.channel.upsert.platformChannelId IS NULL THEN ch.platformChannelId ELSE chRel.channel.upsert.platformChannelId END,
    webPageUrl: CASE WHEN chRel.channel.upsert.webPageUrl IS NULL THEN ch.webPageUrl ELSE chRel.channel.upsert.webPageUrl END,
    rssUrl: CASE WHEN chRel.channel.upsert.rssUrl IS NULL THEN ch.rssUrl ELSE chRel.channel.upsert.rssUrl END,
    imageUrl: CASE WHEN chRel.channel.upsert.imageUrl IS NULL THEN ch.imageUrl ELSE chRel.channel.upsert.imageUrl END,
    validAt: CASE WHEN chRel.channel.upsert.validAt IS NULL THEN ch.validAt ELSE chRel.channel.upsert.validAt END,
    invalidAt: CASE WHEN chRel.channel.upsert.invalidAt IS NULL THEN ch.invalidAt ELSE chRel.channel.upsert.invalidAt END,
    expiredAt: CASE WHEN chRel.channel.upsert.expiredAt IS NULL THEN ch.expiredAt ELSE chRel.channel.upsert.expiredAt END
  }

  MERGE (sr)-[r:IN_CHANNEL]->(ch)
  ON CREATE SET r.createdAt = datetime()
  SET r += {
    createdAt: CASE WHEN chRel.createdAt IS NULL THEN r.createdAt ELSE chRel.createdAt END,
    validAt: CASE WHEN chRel.validAt IS NULL THEN r.validAt ELSE chRel.validAt END,
    invalidAt: CASE WHEN chRel.invalidAt IS NULL THEN r.invalidAt ELSE chRel.invalidAt END,
    expiredAt: CASE WHEN chRel.expiredAt IS NULL THEN r.expiredAt ELSE chRel.expiredAt END
  }

  RETURN 1 AS ok

  UNION

  // ---- connect branch (HARD FAIL if missing) ----
  WITH sr, chRel
  WITH sr, chRel
  WHERE chRel.channel.connect IS NOT NULL

  OPTIONAL MATCH (ch:Channel {channelId: chRel.channel.connect.channelId})
  WITH sr, chRel, ch

  CALL apoc.util.validate(
    ch IS NULL,
    'IN_CHANNEL connect failed: Channel not found for channelId %s',
    [chRel.channel.connect.channelId]
  )

  MERGE (sr)-[r:IN_CHANNEL]->(ch)
  ON CREATE SET r.createdAt = datetime()
  SET r += {
    createdAt: CASE WHEN chRel.createdAt IS NULL THEN r.createdAt ELSE chRel.createdAt END,
    validAt: CASE WHEN chRel.validAt IS NULL THEN r.validAt ELSE chRel.validAt END,
    invalidAt: CASE WHEN chRel.invalidAt IS NULL THEN r.invalidAt ELSE chRel.invalidAt END,
    expiredAt: CASE WHEN chRel.expiredAt IS NULL THEN r.expiredAt ELSE chRel.expiredAt END
  }

  RETURN 1 AS ok

  UNION

  // ---- connectByKey branch (HARD FAIL if missing) ----
  WITH sr, chRel
  WITH sr, chRel
  WHERE chRel.channel.connectByKey IS NOT NULL

  OPTIONAL MATCH (ch:Channel)-[:ON_PLATFORM]->(kp:Platform {platformId: chRel.channel.connectByKey.platformId})
  WHERE (chRel.channel.connectByKey.platformChannelId IS NOT NULL AND ch.platformChannelId = chRel.channel.connectByKey.platformChannelId)
     OR (chRel.channel.connectByKey.channelHandle IS NOT NULL AND ch.channelHandle = chRel.channel.connectByKey.channelHandle)
  WITH sr, chRel, ch

  CALL apoc.util.validate(
    ch IS NULL,
    'IN_CHANNEL connectByKey failed: Channel not found for platformId %s',
    [chRel.channel.connectByKey.platformId]
  )

  MERGE (sr)-[r:IN_CHANNEL]->(ch)
  ON CREATE SET r.createdAt = datetime()
  SET r += {
    createdAt: CASE WHEN chRel.createdAt IS NULL THEN r.createdAt ELSE chRel.createdAt END,
    validAt: CASE WHEN chRel.validAt IS NULL THEN r.validAt ELSE chRel.validAt END,
    invalidAt: CASE WHEN chRel.invalidAt IS NULL THEN r.invalidAt ELSE chRel.invalidAt END,
    expiredAt: CASE WHEN chRel.expiredAt IS NULL THEN r.expiredAt ELSE chRel.expiredAt END
  }

  RETURN 1 AS ok
}

RETURN 1 AS ok
`;

// (Series)-[:INCLUDES_EPISODE]->(Episode)
// Params: $seriesId, $includesEpisode
export const seriesIncludesEpisodeCypher = `
MATCH (sr:Series {seriesId: $seriesId})

UNWIND coalesce($includesEpisode, []) AS epRel
CALL {
  // ---- upsert branch ----
  WITH sr, epRel
  WITH sr, epRel
  WHERE epRel.episode.upsert IS NOT NULL

  MERGE (ep:Episode {episodeId: coalesce(epRel.episode.upsert.episodeId, randomUUID())})
  ON CREATE SET ep.createdAt = datetime()

  SET ep += {
    canonicalName: CASE WHEN epRel.episode.upsert.canonicalName IS NULL THEN ep.canonicalName ELSE epRel.episode.upsert.canonicalName END,
    description: CASE WHEN epRel.episode.upsert.description IS NULL THEN ep.description ELSE epRel.episode.upsert.description END,
    publishedAt: CASE WHEN epRel.episode.upsert.publishedAt IS NULL THEN ep.publishedAt ELSE epRel.episode.upsert.publishedAt END,
    durationSec: CASE WHEN epRel.episode.upsert.durationSec IS NULL THEN ep.durationSec ELSE epRel.episode.upsert.durationSec END,
    language: CASE WHEN epRel.episode.upsert.language IS NULL THEN ep.language ELSE epRel.episode.upsert.language END,
    s3TranscriptUrl: CASE WHEN epRel.episode.upsert.s3TranscriptUrl IS NULL THEN ep.s3TranscriptUrl ELSE epRel.episode.upsert.s3TranscriptUrl END,
    transcriptUrl: CASE WHEN epRel.episode.upsert.transcriptUrl IS NULL THEN ep.transcriptUrl ELSE epRel.episode.upsert.transcriptUrl END,
    webPageUrl: CASE WHEN epRel.episode.upsert.webPageUrl IS NULL THEN ep.webPageUrl ELSE epRel.episode.upsert.webPageUrl END,
    webPageSummary: CASE WHEN epRel.episode.upsert.webPageSummary IS NULL THEN ep.webPageSummary ELSE epRel.episode.upsert.webPageSummary END,
    searchText: CASE WHEN epRel.episode.upsert.searchText IS NULL THEN ep.searchText ELSE epRel.episode.upsert.searchText END,
    embedding: CASE WHEN epRel.episode.upsert.embedding IS NULL THEN ep.embedding ELSE epRel.episode.upsert.embedding END,
    youtubeUrl: CASE WHEN epRel.episode.upsert.youtubeUrl IS NULL THEN ep.youtubeUrl ELSE epRel.episode.upsert.youtubeUrl END,
    youtubeWatchUrl: CASE WHEN epRel.episode.upsert.youtubeWatchUrl IS NULL THEN ep.youtubeWatchUrl ELSE epRel.episode.upsert.youtubeWatchUrl END,
    youtubeEmbedUrl: CASE WHEN epRel.episode.upsert.youtubeEmbedUrl IS NULL THEN ep.youtubeEmbedUrl ELSE epRel.episode.upsert.youtubeEmbedUrl END,
    socialUrlsJson: CASE WHEN epRel.episode.upsert.socialUrlsJson IS NULL THEN ep.socialUrlsJson ELSE epRel.episode.upsert.socialUrlsJson END,
    timestampsJson: CASE WHEN epRel.episode.upsert.timestampsJson IS NULL THEN ep.timestampsJson ELSE epRel.episode.upsert.timestampsJson END,
    validAt: CASE WHEN epRel.episode.upsert.validAt IS NULL THEN ep.validAt ELSE epRel.episode.upsert.validAt END,
    invalidAt: CASE WHEN epRel.episode.upsert.invalidAt IS NULL THEN ep.invalidAt ELSE epRel.episode.upsert.invalidAt END,
    expiredAt: CASE WHEN epRel.episode.upsert.expiredAt IS NULL THEN ep.expiredAt ELSE epRel.episode.upsert.expiredAt END
  }

  MERGE (sr)-[r:INCLUDES_EPISODE]->(ep)
  ON CREATE SET r.createdAt = datetime()
  SET r += {
    orderIndex: CASE WHEN epRel.orderIndex IS NULL THEN r.orderIndex ELSE epRel.orderIndex END,
    createdAt: CASE WHEN epRel.createdAt IS NULL THEN r.createdAt ELSE epRel.createdAt END,
    validAt: CASE WHEN epRel.validAt IS NULL THEN r.validAt ELSE epRel.validAt END,
    invalidAt: CASE WHEN epRel.invalidAt IS NULL THEN r.invalidAt ELSE epRel.invalidAt END,
    expiredAt: CASE WHEN epRel.expiredAt IS NULL THEN r.expiredAt ELSE epRel.expiredAt END
  }

  RETURN 1 AS ok

  UNION

  // ---- connect branch (HARD FAIL if missing) ----
  WITH sr, epRel
  WITH sr, epRel
  WHERE epRel.episode.connect IS NOT NULL

  OPTIONAL MATCH (ep:Episode {episodeId: epRel.episode.connect.episodeId})
  WITH sr, epRel, ep

  CALL apoc.util.validate(
    ep IS NULL,
    'INCLUDES_EPISODE connect failed: Episode not found for episodeId %s',
    [epRel.episode.connect.episodeId]
  )

  MERGE (sr)-[r:INCLUDES_EPISODE]->(ep)
  ON CREATE SET r.createdAt = datetime()
  SET r += {
    orderIndex: CASE WHEN epRel.orderIndex IS NULL THEN r.orderIndex ELSE epRel.orderIndex END,
    createdAt: CASE WHEN epRel.createdAt IS NULL THEN r.createdAt ELSE epRel.createdAt END,
    validAt: CASE WHEN epRel.validAt IS NULL THEN r.validAt ELSE epRel.validAt END,
    invalidAt: CASE WHEN epRel.invalidAt IS NULL THEN r.invalidAt ELSE epRel.invalidAt END,
    expiredAt: CASE WHEN epRel.expiredAt IS NULL THEN r.expiredAt ELSE epRel.expiredAt END
  }

  RETURN 1 AS ok

  UNION

  // ---- connectByKey branch (HARD FAIL if missing) ----
  WITH sr, epRel
  WITH sr, epRel
  WHERE epRel.episode.connectByKey IS NOT NULL

  OPTIONAL MATCH (ep:Episode {webPageUrl: epRel.episode.connectByKey.webPageUrl})
  WITH sr, epRel, ep

  CALL apoc.util.validate(
    ep IS NULL,
    'INCLUDES_EPISODE connectByKey failed: Episode not found for webPageUrl %s',
    [epRel.episode.connectByKey.webPageUrl]
  )

  MERGE (sr)-[r:INCLUDES_EPISODE]->(ep)
  ON CREATE SET r.createdAt = datetime()
  SET r += {
    orderIndex: CASE WHEN epRel.orderIndex IS NULL THEN r.orderIndex ELSE epRel.orderIndex END,
    createdAt: CASE WHEN epRel.createdAt IS NULL THEN r.createdAt ELSE epRel.createdAt END,
    validAt: CASE WHEN epRel.validAt IS NULL THEN r.validAt ELSE epRel.validAt END,
    invalidAt: CASE WHEN epRel.invalidAt IS NULL THEN r.invalidAt ELSE epRel.invalidAt END,
    expiredAt: CASE WHEN epRel.expiredAt IS NULL THEN r.expiredAt ELSE epRel.expiredAt END
  }

  RETURN 1 AS ok
}

RETURN 1 AS ok
`;

export const returnSeriesCypher = `
MATCH (sr:Series {seriesId: $seriesId})
RETURN sr
`;

export const seriesStatements = {
  seriesInChannelCypher,
  seriesIncludesEpisodeCypher,
  returnSeriesCypher,
};

// ============================================================================
// EPISODE
// ============================================================================

export function buildEpisodeUpsertCypher(key: EpisodeIdentifierKey): string {
  return `
    MERGE (ep:Episode { ${key}: $idValue })
    ON CREATE SET ep.createdAt = datetime()

    SET ep.episodeId = coalesce(ep.episodeId, randomUUID())

    SET ep += {
      canonicalName: CASE WHEN $canonicalName IS NULL THEN ep.canonicalName ELSE $canonicalName END,
      description: CASE WHEN $description IS NULL THEN ep.description ELSE $description END,
      publishedAt: CASE WHEN $publishedAt IS NULL THEN ep.publishedAt ELSE $publishedAt END,
      durationSec: CASE WHEN $durationSec IS NULL THEN ep.durationSec ELSE $durationSec END,
      language: CASE WHEN $language IS NULL THEN ep.language ELSE $language END,
      s3TranscriptUrl: CASE WHEN $s3TranscriptUrl IS NULL THEN ep.s3TranscriptUrl ELSE $s3TranscriptUrl END,
      transcriptUrl: CASE WHEN $transcriptUrl IS NULL THEN ep.transcriptUrl ELSE $transcriptUrl END,
      webPageUrl: CASE WHEN $webPageUrl IS NULL THEN ep.webPageUrl ELSE $webPageUrl END,
      webPageSummary: CASE WHEN $webPageSummary IS NULL THEN ep.webPageSummary ELSE $webPageSummary END,
      searchText: CASE WHEN $searchText IS NULL THEN ep.searchText ELSE $searchText END,
      embedding: CASE WHEN $embedding IS NULL THEN ep.embedding ELSE $embedding END,
      youtubeUrl: CASE WHEN $youtubeUrl IS NULL THEN ep.youtubeUrl ELSE $youtubeUrl END,
      youtubeWatchUrl: CASE WHEN $youtubeWatchUrl IS NULL THEN ep.youtubeWatchUrl ELSE $youtubeWatchUrl END,
      youtubeEmbedUrl: CASE WHEN $youtubeEmbedUrl IS NULL THEN ep.youtubeEmbedUrl ELSE $youtubeEmbedUrl END,
      socialUrlsJson: CASE WHEN $socialUrlsJson IS NULL THEN ep.socialUrlsJson ELSE $socialUrlsJson END,
      timestampsJson: CASE WHEN $timestampsJson IS NULL THEN ep.timestampsJson ELSE $timestampsJson END,
      validAt: CASE WHEN $validAt IS NULL THEN ep.validAt ELSE $validAt END,
      invalidAt: CASE WHEN $invalidAt IS NULL THEN ep.invalidAt ELSE $invalidAt END,
      expiredAt: CASE WHEN $expiredAt IS NULL THEN ep.expiredAt ELSE $expiredAt END
    }

    RETURN ep
  `;
}

// (Episode)-[:IN_CHANNEL]->(Channel)
// Params: $episodeId, $inChannel
export const episodeInChannelCypher = `
MATCH (ep:Episode {episodeId: $episodeId})

UNWIND coalesce($inChannel, []) AS chRel
CALL {
  // ---- upsert branch ----
  WITH ep, chRel
  WITH ep, chRel
  WHERE chRel.channel.upsert IS NOT NULL

  MERGE (ch:Channel {channelId: coalesce(chRel.channel.upsert.channelId, randomUUID())})
  ON CREATE SET ch.createdAt = datetime()

  SET ch += {
    canonicalName: CASE WHEN chRel.channel.upsert.canonicalName IS NULL THEN ch.canonicalName ELSE chRel.channel.upsert.canonicalName END,
    aliases: CASE
      WHEN chRel.channel.upsert.aliases IS NULL THEN ch.aliases
      ELSE apoc.coll.toSet(coalesce(ch.aliases, []) + coalesce(chRel.channel.upsert.aliases, []))
    END,
    description: CASE WHEN chRel.channel.upsert.description IS NULL THEN ch.description ELSE chRel.channel.upsert.description END,
    channelHandle: CASE WHEN chRel.channel.upsert.channelHandle IS NULL THEN ch.channelHandle ELSE chRel.channel.upsert.channelHandle END,
    platformChannelId: CASE WHEN chRel.channel.upsert.platformChannelId IS NULL THEN ch.platformChannelId ELSE chRel.channel.upsert.platformChannelId END,
    webPageUrl: CASE WHEN chRel.channel.upsert.webPageUrl IS NULL THEN ch.webPageUrl ELSE chRel.channel.upsert.webPageUrl END,
    rssUrl: CASE WHEN chRel.channel.upsert.rssUrl IS NULL THEN ch.rssUrl ELSE chRel.channel.upsert.rssUrl END,
    imageUrl: CASE WHEN chRel.channel.upsert.imageUrl IS NULL THEN ch.imageUrl ELSE chRel.channel.upsert.imageUrl END,
    validAt: CASE WHEN chRel.channel.upsert.validAt IS NULL THEN ch.validAt ELSE chRel.channel.upsert.validAt END,
    invalidAt: CASE WHEN chRel.channel.upsert.invalidAt IS NULL THEN ch.invalidAt ELSE chRel.channel.upsert.invalidAt END,
    expiredAt: CASE WHEN chRel.channel.upsert.expiredAt IS NULL THEN ch.expiredAt ELSE chRel.channel.upsert.expiredAt END
  }

  MERGE (ep)-[r:IN_CHANNEL]->(ch)
  ON CREATE SET r.createdAt = datetime()
  SET r += {
    createdAt: CASE WHEN chRel.createdAt IS NULL THEN r.createdAt ELSE chRel.createdAt END,
    validAt: CASE WHEN chRel.validAt IS NULL THEN r.validAt ELSE chRel.validAt END,
    invalidAt: CASE WHEN chRel.invalidAt IS NULL THEN r.invalidAt ELSE chRel.invalidAt END,
    expiredAt: CASE WHEN chRel.expiredAt IS NULL THEN r.expiredAt ELSE chRel.expiredAt END
  }

  RETURN 1 AS ok

  UNION

  // ---- connect branch (HARD FAIL if missing) ----
  WITH ep, chRel
  WITH ep, chRel
  WHERE chRel.channel.connect IS NOT NULL

  OPTIONAL MATCH (ch:Channel {channelId: chRel.channel.connect.channelId})
  WITH ep, chRel, ch

  CALL apoc.util.validate(
    ch IS NULL,
    'IN_CHANNEL connect failed: Channel not found for channelId %s',
    [chRel.channel.connect.channelId]
  )

  MERGE (ep)-[r:IN_CHANNEL]->(ch)
  ON CREATE SET r.createdAt = datetime()
  SET r += {
    createdAt: CASE WHEN chRel.createdAt IS NULL THEN r.createdAt ELSE chRel.createdAt END,
    validAt: CASE WHEN chRel.validAt IS NULL THEN r.validAt ELSE chRel.validAt END,
    invalidAt: CASE WHEN chRel.invalidAt IS NULL THEN r.invalidAt ELSE chRel.invalidAt END,
    expiredAt: CASE WHEN chRel.expiredAt IS NULL THEN r.expiredAt ELSE chRel.expiredAt END
  }

  RETURN 1 AS ok

  UNION

  // ---- connectByKey branch (HARD FAIL if missing) ----
  WITH ep, chRel
  WITH ep, chRel
  WHERE chRel.channel.connectByKey IS NOT NULL

  OPTIONAL MATCH (ch:Channel)-[:ON_PLATFORM]->(kp:Platform {platformId: chRel.channel.connectByKey.platformId})
  WHERE (chRel.channel.connectByKey.platformChannelId IS NOT NULL AND ch.platformChannelId = chRel.channel.connectByKey.platformChannelId)
     OR (chRel.channel.connectByKey.channelHandle IS NOT NULL AND ch.channelHandle = chRel.channel.connectByKey.channelHandle)
  WITH ep, chRel, ch

  CALL apoc.util.validate(
    ch IS NULL,
    'IN_CHANNEL connectByKey failed: Channel not found for platformId %s',
    [chRel.channel.connectByKey.platformId]
  )

  MERGE (ep)-[r:IN_CHANNEL]->(ch)
  ON CREATE SET r.createdAt = datetime()
  SET r += {
    createdAt: CASE WHEN chRel.createdAt IS NULL THEN r.createdAt ELSE chRel.createdAt END,
    validAt: CASE WHEN chRel.validAt IS NULL THEN r.validAt ELSE chRel.validAt END,
    invalidAt: CASE WHEN chRel.invalidAt IS NULL THEN r.invalidAt ELSE chRel.invalidAt END,
    expiredAt: CASE WHEN chRel.expiredAt IS NULL THEN r.expiredAt ELSE chRel.expiredAt END
  }

  RETURN 1 AS ok
}

RETURN 1 AS ok
`;

// (Episode)-[:IN_SERIES]->(Series)
// Params: $episodeId, $inSeries
export const episodeInSeriesCypher = `
MATCH (ep:Episode {episodeId: $episodeId})

UNWIND coalesce($inSeries, []) AS srRel
CALL {
  // ---- upsert branch ----
  WITH ep, srRel
  WITH ep, srRel
  WHERE srRel.series.upsert IS NOT NULL

  MERGE (sr:Series {seriesId: coalesce(srRel.series.upsert.seriesId, randomUUID())})
  ON CREATE SET sr.createdAt = datetime()

  SET sr += {
    canonicalName: CASE WHEN srRel.series.upsert.canonicalName IS NULL THEN sr.canonicalName ELSE srRel.series.upsert.canonicalName END,
    aliases: CASE
      WHEN srRel.series.upsert.aliases IS NULL THEN sr.aliases
      ELSE apoc.coll.toSet(coalesce(sr.aliases, []) + coalesce(srRel.series.upsert.aliases, []))
    END,
    description: CASE WHEN srRel.series.upsert.description IS NULL THEN sr.description ELSE srRel.series.upsert.description END,
    seriesType: CASE WHEN srRel.series.upsert.seriesType IS NULL THEN sr.seriesType ELSE srRel.series.upsert.seriesType END,
    webPageUrl: CASE WHEN srRel.series.upsert.webPageUrl IS NULL THEN sr.webPageUrl ELSE srRel.series.upsert.webPageUrl END,
    imageUrl: CASE WHEN srRel.series.upsert.imageUrl IS NULL THEN sr.imageUrl ELSE srRel.series.upsert.imageUrl END,
    validAt: CASE WHEN srRel.series.upsert.validAt IS NULL THEN sr.validAt ELSE srRel.series.upsert.validAt END,
    invalidAt: CASE WHEN srRel.series.upsert.invalidAt IS NULL THEN sr.invalidAt ELSE srRel.series.upsert.invalidAt END,
    expiredAt: CASE WHEN srRel.series.upsert.expiredAt IS NULL THEN sr.expiredAt ELSE srRel.series.upsert.expiredAt END
  }

  MERGE (ep)-[r:IN_SERIES]->(sr)
  ON CREATE SET r.createdAt = datetime()
  SET r += {
    orderIndex: CASE WHEN srRel.orderIndex IS NULL THEN r.orderIndex ELSE srRel.orderIndex END,
    createdAt: CASE WHEN srRel.createdAt IS NULL THEN r.createdAt ELSE srRel.createdAt END,
    validAt: CASE WHEN srRel.validAt IS NULL THEN r.validAt ELSE srRel.validAt END,
    invalidAt: CASE WHEN srRel.invalidAt IS NULL THEN r.invalidAt ELSE srRel.invalidAt END,
    expiredAt: CASE WHEN srRel.expiredAt IS NULL THEN r.expiredAt ELSE srRel.expiredAt END
  }

  RETURN 1 AS ok

  UNION

  // ---- connect branch (HARD FAIL if missing) ----
  WITH ep, srRel
  WITH ep, srRel
  WHERE srRel.series.connect IS NOT NULL

  OPTIONAL MATCH (sr:Series {seriesId: srRel.series.connect.seriesId})
  WITH ep, srRel, sr

  CALL apoc.util.validate(
    sr IS NULL,
    'IN_SERIES connect failed: Series not found for seriesId %s',
    [srRel.series.connect.seriesId]
  )

  MERGE (ep)-[r:IN_SERIES]->(sr)
  ON CREATE SET r.createdAt = datetime()
  SET r += {
    orderIndex: CASE WHEN srRel.orderIndex IS NULL THEN r.orderIndex ELSE srRel.orderIndex END,
    createdAt: CASE WHEN srRel.createdAt IS NULL THEN r.createdAt ELSE srRel.createdAt END,
    validAt: CASE WHEN srRel.validAt IS NULL THEN r.validAt ELSE srRel.validAt END,
    invalidAt: CASE WHEN srRel.invalidAt IS NULL THEN r.invalidAt ELSE srRel.invalidAt END,
    expiredAt: CASE WHEN srRel.expiredAt IS NULL THEN r.expiredAt ELSE srRel.expiredAt END
  }

  RETURN 1 AS ok

  UNION

  // ---- connectByKey branch (HARD FAIL if missing) ----
  WITH ep, srRel
  WITH ep, srRel
  WHERE srRel.series.connectByKey IS NOT NULL

  OPTIONAL MATCH (kc:Channel {channelId: srRel.series.connectByKey.channelId})-[:HAS_SERIES]->(sr:Series {canonicalName: srRel.series.connectByKey.canonicalName})
  WITH ep, srRel, sr

  CALL apoc.util.validate(
    sr IS NULL,
    'IN_SERIES connectByKey failed: Series not found for channelId %s canonicalName %s',
    [srRel.series.connectByKey.channelId, srRel.series.connectByKey.canonicalName]
  )

  MERGE (ep)-[r:IN_SERIES]->(sr)
  ON CREATE SET r.createdAt = datetime()
  SET r += {
    orderIndex: CASE WHEN srRel.orderIndex IS NULL THEN r.orderIndex ELSE srRel.orderIndex END,
    createdAt: CASE WHEN srRel.createdAt IS NULL THEN r.createdAt ELSE srRel.createdAt END,
    validAt: CASE WHEN srRel.validAt IS NULL THEN r.validAt ELSE srRel.validAt END,
    invalidAt: CASE WHEN srRel.invalidAt IS NULL THEN r.invalidAt ELSE srRel.invalidAt END,
    expiredAt: CASE WHEN srRel.expiredAt IS NULL THEN r.expiredAt ELSE srRel.expiredAt END
  }

  RETURN 1 AS ok
}

RETURN 1 AS ok
`;

// (Episode)-[:ON_PLATFORM]->(Platform)
// Params: $episodeId, $onPlatform
export const episodeOnPlatformCypher = `
MATCH (ep:Episode {episodeId: $episodeId})

UNWIND coalesce($onPlatform, []) AS ptRel
CALL {
  // ---- upsert branch ----
  WITH ep, ptRel
  WITH ep, ptRel
  WHERE ptRel.platform.upsert IS NOT NULL

  MERGE (pt:Platform {platformId: coalesce(ptRel.platform.upsert.platformId, randomUUID())})
  ON CREATE SET pt.createdAt = datetime()

  SET pt += {
    canonicalName: CASE WHEN ptRel.platform.upsert.canonicalName IS NULL THEN pt.canonicalName ELSE ptRel.platform.upsert.canonicalName END,
    aliases: CASE
      WHEN ptRel.platform.upsert.aliases IS NULL THEN pt.aliases
      ELSE apoc.coll.toSet(coalesce(pt.aliases, []) + coalesce(ptRel.platform.upsert.aliases, []))
    END,
    platformType: CASE WHEN ptRel.platform.upsert.platformType IS NULL THEN pt.platformType ELSE ptRel.platform.upsert.platformType END,
    description: CASE WHEN ptRel.platform.upsert.description IS NULL THEN pt.description ELSE ptRel.platform.upsert.description END,
    websiteUrl: CASE WHEN ptRel.platform.upsert.websiteUrl IS NULL THEN pt.websiteUrl ELSE ptRel.platform.upsert.websiteUrl END,
    validAt: CASE WHEN ptRel.platform.upsert.validAt IS NULL THEN pt.validAt ELSE ptRel.platform.upsert.validAt END,
    invalidAt: CASE WHEN ptRel.platform.upsert.invalidAt IS NULL THEN pt.invalidAt ELSE ptRel.platform.upsert.invalidAt END,
    expiredAt: CASE WHEN ptRel.platform.upsert.expiredAt IS NULL THEN pt.expiredAt ELSE ptRel.platform.upsert.expiredAt END
  }

  MERGE (ep)-[r:ON_PLATFORM]->(pt)
  ON CREATE SET r.createdAt = datetime()
  SET r += {
    createdAt: CASE WHEN ptRel.createdAt IS NULL THEN r.createdAt ELSE ptRel.createdAt END,
    validAt: CASE WHEN ptRel.validAt IS NULL THEN r.validAt ELSE ptRel.validAt END,
    invalidAt: CASE WHEN ptRel.invalidAt IS NULL THEN r.invalidAt ELSE ptRel.invalidAt END,
    expiredAt: CASE WHEN ptRel.expiredAt IS NULL THEN r.expiredAt ELSE ptRel.expiredAt END
  }

  RETURN 1 AS ok

  UNION

  // ---- connect branch (HARD FAIL if missing) ----
  WITH ep, ptRel
  WITH ep, ptRel
  WHERE ptRel.platform.connect IS NOT NULL

  OPTIONAL MATCH (pt:Platform {platformId: ptRel.platform.connect.platformId})
  WITH ep, ptRel, pt

  CALL apoc.util.validate(
    pt IS NULL,
    'ON_PLATFORM connect failed: Platform not found for platformId %s',
    [ptRel.platform.connect.platformId]
  )

  MERGE (ep)-[r:ON_PLATFORM]->(pt)
  ON CREATE SET r.createdAt = datetime()
  SET r += {
    createdAt: CASE WHEN ptRel.createdAt IS NULL THEN r.createdAt ELSE ptRel.createdAt END,
    validAt: CASE WHEN ptRel.validAt IS NULL THEN r.validAt ELSE ptRel.validAt END,
    invalidAt: CASE WHEN ptRel.invalidAt IS NULL THEN r.invalidAt ELSE ptRel.invalidAt END,
    expiredAt: CASE WHEN ptRel.expiredAt IS NULL THEN r.expiredAt ELSE ptRel.expiredAt END
  }

  RETURN 1 AS ok

  UNION

  // ---- connectByKey branch (HARD FAIL if missing) ----
  WITH ep, ptRel
  WITH ep, ptRel
  WHERE ptRel.platform.connectByKey IS NOT NULL

  OPTIONAL MATCH (pt:Platform {canonicalName: ptRel.platform.connectByKey.canonicalName})
  WITH ep, ptRel, pt

  CALL apoc.util.validate(
    pt IS NULL,
    'ON_PLATFORM connectByKey failed: Platform not found for canonicalName %s',
    [ptRel.platform.connectByKey.canonicalName]
  )

  MERGE (ep)-[r:ON_PLATFORM]->(pt)
  ON CREATE SET r.createdAt = datetime()
  SET r += {
    createdAt: CASE WHEN ptRel.createdAt IS NULL THEN r.createdAt ELSE ptRel.createdAt END,
    validAt: CASE WHEN ptRel.validAt IS NULL THEN r.validAt ELSE ptRel.validAt END,
    invalidAt: CASE WHEN ptRel.invalidAt IS NULL THEN r.invalidAt ELSE ptRel.invalidAt END,
    expiredAt: CASE WHEN ptRel.expiredAt IS NULL THEN r.expiredAt ELSE ptRel.expiredAt END
  }

  RETURN 1 AS ok
}

RETURN 1 AS ok
`;

// (Episode)-[:HAS_SEGMENT]->(EpisodeSegment)
// Params: $episodeId, $hasSegment
// Reused by both upsertEpisode (episode.hasSegment) and upsertEpisodeSegments (input.segments)
export const episodeHasSegmentCypher = `
MATCH (ep:Episode {episodeId: $episodeId})

UNWIND coalesce($hasSegment, []) AS segRel
CALL {
  // ---- upsert branch ----
  WITH ep, segRel
  WITH ep, segRel
  WHERE segRel.segment.upsert IS NOT NULL

  MERGE (seg:EpisodeSegment {episodeSegmentId: coalesce(segRel.segment.upsert.episodeSegmentId, randomUUID())})
  ON CREATE SET seg.createdAt = datetime()

  SET seg += {
    canonicalName: CASE WHEN segRel.segment.upsert.canonicalName IS NULL THEN seg.canonicalName ELSE segRel.segment.upsert.canonicalName END,
    description: CASE WHEN segRel.segment.upsert.description IS NULL THEN seg.description ELSE segRel.segment.upsert.description END,
    orderIndex: CASE WHEN segRel.segment.upsert.orderIndex IS NULL THEN seg.orderIndex ELSE segRel.segment.upsert.orderIndex END,
    startTimeSec: CASE WHEN segRel.segment.upsert.startTimeSec IS NULL THEN seg.startTimeSec ELSE segRel.segment.upsert.startTimeSec END,
    endTimeSec: CASE WHEN segRel.segment.upsert.endTimeSec IS NULL THEN seg.endTimeSec ELSE segRel.segment.upsert.endTimeSec END,
    timeRangeJson: CASE WHEN segRel.segment.upsert.timeRangeJson IS NULL THEN seg.timeRangeJson ELSE segRel.segment.upsert.timeRangeJson END,
    validAt: CASE WHEN segRel.segment.upsert.validAt IS NULL THEN seg.validAt ELSE segRel.segment.upsert.validAt END,
    invalidAt: CASE WHEN segRel.segment.upsert.invalidAt IS NULL THEN seg.invalidAt ELSE segRel.segment.upsert.invalidAt END,
    expiredAt: CASE WHEN segRel.segment.upsert.expiredAt IS NULL THEN seg.expiredAt ELSE segRel.segment.upsert.expiredAt END
  }

  MERGE (ep)-[r:HAS_SEGMENT]->(seg)
  ON CREATE SET r.createdAt = datetime()
  SET r += {
    orderIndex: CASE WHEN segRel.orderIndex IS NULL THEN r.orderIndex ELSE segRel.orderIndex END,
    createdAt: CASE WHEN segRel.createdAt IS NULL THEN r.createdAt ELSE segRel.createdAt END,
    validAt: CASE WHEN segRel.validAt IS NULL THEN r.validAt ELSE segRel.validAt END,
    invalidAt: CASE WHEN segRel.invalidAt IS NULL THEN r.invalidAt ELSE segRel.invalidAt END,
    expiredAt: CASE WHEN segRel.expiredAt IS NULL THEN r.expiredAt ELSE segRel.expiredAt END
  }

  RETURN 1 AS ok

  UNION

  // ---- connect branch (HARD FAIL if missing) ----
  WITH ep, segRel
  WITH ep, segRel
  WHERE segRel.segment.connect IS NOT NULL

  OPTIONAL MATCH (seg:EpisodeSegment {episodeSegmentId: segRel.segment.connect.episodeSegmentId})
  WITH ep, segRel, seg

  CALL apoc.util.validate(
    seg IS NULL,
    'HAS_SEGMENT connect failed: EpisodeSegment not found for episodeSegmentId %s',
    [segRel.segment.connect.episodeSegmentId]
  )

  MERGE (ep)-[r:HAS_SEGMENT]->(seg)
  ON CREATE SET r.createdAt = datetime()
  SET r += {
    orderIndex: CASE WHEN segRel.orderIndex IS NULL THEN r.orderIndex ELSE segRel.orderIndex END,
    createdAt: CASE WHEN segRel.createdAt IS NULL THEN r.createdAt ELSE segRel.createdAt END,
    validAt: CASE WHEN segRel.validAt IS NULL THEN r.validAt ELSE segRel.validAt END,
    invalidAt: CASE WHEN segRel.invalidAt IS NULL THEN r.invalidAt ELSE segRel.invalidAt END,
    expiredAt: CASE WHEN segRel.expiredAt IS NULL THEN r.expiredAt ELSE segRel.expiredAt END
  }

  RETURN 1 AS ok

  UNION

  // ---- connectByKey branch (HARD FAIL if missing) ----
  // EpisodeSegment is uniquely identified by (episodeId, orderIndex) via HAS_SEGMENT
  WITH ep, segRel
  WITH ep, segRel
  WHERE segRel.segment.connectByKey IS NOT NULL

  OPTIONAL MATCH (ke:Episode {episodeId: segRel.segment.connectByKey.episodeId})-[:HAS_SEGMENT]->(seg:EpisodeSegment {orderIndex: segRel.segment.connectByKey.orderIndex})
  WITH ep, segRel, seg

  CALL apoc.util.validate(
    seg IS NULL,
    'HAS_SEGMENT connectByKey failed: EpisodeSegment not found for episodeId %s orderIndex %s',
    [segRel.segment.connectByKey.episodeId, segRel.segment.connectByKey.orderIndex]
  )

  MERGE (ep)-[r:HAS_SEGMENT]->(seg)
  ON CREATE SET r.createdAt = datetime()
  SET r += {
    orderIndex: CASE WHEN segRel.orderIndex IS NULL THEN r.orderIndex ELSE segRel.orderIndex END,
    createdAt: CASE WHEN segRel.createdAt IS NULL THEN r.createdAt ELSE segRel.createdAt END,
    validAt: CASE WHEN segRel.validAt IS NULL THEN r.validAt ELSE segRel.validAt END,
    invalidAt: CASE WHEN segRel.invalidAt IS NULL THEN r.invalidAt ELSE segRel.invalidAt END,
    expiredAt: CASE WHEN segRel.expiredAt IS NULL THEN r.expiredAt ELSE segRel.expiredAt END
  }

  RETURN 1 AS ok
}

RETURN 1 AS ok
`;

export const returnEpisodeCypher = `
MATCH (ep:Episode {episodeId: $episodeId})
RETURN ep
`;

export const episodeStatements = {
  episodeInChannelCypher,
  episodeInSeriesCypher,
  episodeOnPlatformCypher,
  episodeHasSegmentCypher,
  returnEpisodeCypher,
};

// ============================================================================
// EPISODE SEGMENT (standalone node upsert — used internally for segments)
// ============================================================================

export function buildEpisodeSegmentUpsertCypher(
  key: EpisodeSegmentIdentifierKey
): string {
  return `
    MERGE (seg:EpisodeSegment { ${key}: $idValue })
    ON CREATE SET seg.createdAt = datetime()

    SET seg.episodeSegmentId = coalesce(seg.episodeSegmentId, randomUUID())

    SET seg += {
      canonicalName: CASE WHEN $canonicalName IS NULL THEN seg.canonicalName ELSE $canonicalName END,
      description: CASE WHEN $description IS NULL THEN seg.description ELSE $description END,
      orderIndex: CASE WHEN $orderIndex IS NULL THEN seg.orderIndex ELSE $orderIndex END,
      startTimeSec: CASE WHEN $startTimeSec IS NULL THEN seg.startTimeSec ELSE $startTimeSec END,
      endTimeSec: CASE WHEN $endTimeSec IS NULL THEN seg.endTimeSec ELSE $endTimeSec END,
      timeRangeJson: CASE WHEN $timeRangeJson IS NULL THEN seg.timeRangeJson ELSE $timeRangeJson END,
      validAt: CASE WHEN $validAt IS NULL THEN seg.validAt ELSE $validAt END,
      invalidAt: CASE WHEN $invalidAt IS NULL THEN seg.invalidAt ELSE $invalidAt END,
      expiredAt: CASE WHEN $expiredAt IS NULL THEN seg.expiredAt ELSE $expiredAt END
    }

    RETURN seg
  `;
}
