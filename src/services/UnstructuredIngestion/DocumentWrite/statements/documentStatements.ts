// ============================================================================
// Document Upsert Cypher
// ============================================================================

export function buildDocumentUpsertCypher() {
  return `
    MERGE (d:Document { documentKey: $documentKey })
    ON CREATE SET d.createdAt = datetime()

    SET d.documentId = coalesce(d.documentId, randomUUID())

    SET d += {
      type: CASE WHEN $type IS NULL THEN d.type ELSE $type END,
      title: CASE WHEN $title IS NULL THEN d.title ELSE $title END,
      url: CASE WHEN $url IS NULL THEN d.url ELSE $url END,

      publishedAt: CASE WHEN $publishedAt IS NULL THEN d.publishedAt ELSE datetime($publishedAt) END,
      retrievedAt: CASE WHEN $retrievedAt IS NULL THEN d.retrievedAt ELSE datetime($retrievedAt) END,

      validAt: CASE WHEN $validAt IS NULL THEN d.validAt ELSE datetime($validAt) END,
      invalidAt: CASE WHEN $invalidAt IS NULL THEN d.invalidAt ELSE datetime($invalidAt) END,
      expiredAt: CASE WHEN $expiredAt IS NULL THEN d.expiredAt ELSE datetime($expiredAt) END,
      createdAt: CASE WHEN $createdAt IS NULL THEN d.createdAt ELSE datetime($createdAt) END,
      updatedAt: CASE WHEN $updatedAt IS NULL THEN d.updatedAt ELSE datetime($updatedAt) END,

      // NEW: search surface fields
      searchText: CASE WHEN $searchText IS NULL THEN d.searchText ELSE $searchText END,
      searchTextEmbedding: CASE WHEN $searchTextEmbedding IS NULL THEN d.searchTextEmbedding ELSE $searchTextEmbedding END,
      searchTextModel: CASE WHEN $searchTextModel IS NULL THEN d.searchTextModel ELSE $searchTextModel END,
      searchTextVersion: CASE WHEN $searchTextVersion IS NULL THEN d.searchTextVersion ELSE $searchTextVersion END,
      searchTextUpdatedAt: CASE WHEN $searchTextUpdatedAt IS NULL THEN d.searchTextUpdatedAt ELSE datetime($searchTextUpdatedAt) END
    }

    RETURN d
  `;
}

// ============================================================================
// Validate ResearchRunRef Exists Cypher
// ============================================================================

export const validateResearchRunRefExistsCypher = `
  MATCH (rrr:ResearchRunRef { mongoRunId: $mongoRunId })
  RETURN rrr.researchRunRefId AS researchRunRefId
  LIMIT 1
`;

// ============================================================================
// Create GeneratedBy Relationship Cypher
// ============================================================================

export const createDocumentGeneratedByCypher = `
  MATCH (d:Document { documentId: $documentId })
  MATCH (rrr:ResearchRunRef { mongoRunId: $mongoRunId })
  
  MERGE (d)-[r:GENERATED_BY]->(rrr)
  ON CREATE SET r.createdAt = datetime()
  
  SET r += {
    operation: CASE WHEN $operation IS NULL THEN r.operation ELSE $operation END,
    stageKey: CASE WHEN $stageKey IS NULL THEN r.stageKey ELSE $stageKey END,
    subStageKey: CASE WHEN $subStageKey IS NULL THEN r.subStageKey ELSE $subStageKey END,
    extractorVersion: CASE WHEN $extractorVersion IS NULL THEN r.extractorVersion ELSE $extractorVersion END,
    extractedAt: CASE WHEN $extractedAt IS NULL THEN r.extractedAt ELSE $extractedAt END,
    validAt: CASE WHEN $validAt IS NULL THEN r.validAt ELSE datetime($validAt) END,
    invalidAt: CASE WHEN $invalidAt IS NULL THEN r.invalidAt ELSE datetime($invalidAt) END,
    expiredAt: CASE WHEN $expiredAt IS NULL THEN r.expiredAt ELSE datetime($expiredAt) END,
    updatedAt: CASE WHEN $updatedAt IS NULL THEN r.updatedAt ELSE datetime($updatedAt) END
  }
  
  RETURN d, r, rrr
`;

// ============================================================================
// Return Document Cypher
// ============================================================================

export const returnDocumentCypher = `
  MATCH (d:Document { documentId: $documentId })
  RETURN properties(d) AS document
`;

export const returnDocumentByDocumentKeyCypher = `
  MATCH (d:Document { documentKey: $documentKey })
  RETURN properties(d) AS document
`;



export const upsertDocumentTextVersionAndLinkCypher = `
  MATCH (d:Document { documentId: $documentId })

  MERGE (tv:DocumentTextVersion { textVersionHash: $textVersionHash })
  ON CREATE SET
    tv.documentTextVersionId = coalesce(tv.documentTextVersionId, randomUUID()),
    tv.createdAt = coalesce(tv.createdAt, datetime())

  SET tv.documentTextVersionId = coalesce(tv.documentTextVersionId, randomUUID())

  SET tv += {
    source: CASE WHEN $source IS NULL THEN tv.source ELSE $source END,
    language: CASE WHEN $language IS NULL THEN tv.language ELSE $language END,
    text: CASE WHEN $text IS NULL THEN tv.text ELSE $text END,

    validAt: CASE WHEN $tv_validAt IS NULL THEN tv.validAt ELSE datetime($tv_validAt) END,
    expiredAt: CASE WHEN $tv_expiredAt IS NULL THEN tv.expiredAt ELSE datetime($tv_expiredAt) END,
    invalidAt: CASE WHEN $tv_invalidAt IS NULL THEN tv.invalidAt ELSE datetime($tv_invalidAt) END,
    createdAt: CASE WHEN $tv_createdAt IS NULL THEN tv.createdAt ELSE datetime($tv_createdAt) END,
    updatedAt: CASE WHEN $tv_updatedAt IS NULL THEN tv.updatedAt ELSE datetime($tv_updatedAt) END,

    // Search surface
    searchText: CASE WHEN $tv_searchText IS NULL THEN tv.searchText ELSE $tv_searchText END,
    searchTextEmbedding: CASE WHEN $tv_searchTextEmbedding IS NULL THEN tv.searchTextEmbedding ELSE $tv_searchTextEmbedding END,
    searchTextModel: CASE WHEN $tv_searchTextModel IS NULL THEN tv.searchTextModel ELSE $tv_searchTextModel END,
    searchTextVersion: CASE WHEN $tv_searchTextVersion IS NULL THEN tv.searchTextVersion ELSE $tv_searchTextVersion END,
    searchTextUpdatedAt: CASE WHEN $tv_searchTextUpdatedAt IS NULL THEN tv.searchTextUpdatedAt ELSE datetime($tv_searchTextUpdatedAt) END
  }

  MERGE (d)-[r:HAS_TEXT_VERSION]->(tv)
  ON CREATE SET r.createdAt = datetime()

  SET r += {
    validAt: CASE WHEN $htv_validAt IS NULL THEN r.validAt ELSE datetime($htv_validAt) END,
    expiredAt: CASE WHEN $htv_expiredAt IS NULL THEN r.expiredAt ELSE datetime($htv_expiredAt) END,
    invalidAt: CASE WHEN $htv_invalidAt IS NULL THEN r.invalidAt ELSE datetime($htv_invalidAt) END,
    createdAt: CASE WHEN $htv_createdAt IS NULL THEN r.createdAt ELSE datetime($htv_createdAt) END,
    updatedAt: CASE WHEN $htv_updatedAt IS NULL THEN r.updatedAt ELSE datetime($htv_updatedAt) END
  }

  RETURN tv.documentTextVersionId AS documentTextVersionId
`;

export const upsertSegmentationAndLinkCypher = `
  MATCH (tv:DocumentTextVersion { documentTextVersionId: $documentTextVersionId })

  MERGE (s:Segmentation { segmentationHash: $segmentationHash })
  ON CREATE SET
    s.segmentationId = coalesce(s.segmentationId, randomUUID()),
    s.createdAt = coalesce(s.createdAt, datetime())

  SET s += {
    strategy: CASE WHEN $strategy IS NULL THEN s.strategy ELSE $strategy END,
    chunkSize: CASE WHEN $chunkSize IS NULL THEN s.chunkSize ELSE $chunkSize END,
    overlap: CASE WHEN $overlap IS NULL THEN s.overlap ELSE $overlap END,

    validAt: CASE WHEN $s_validAt IS NULL THEN s.validAt ELSE datetime($s_validAt) END,
    expiredAt: CASE WHEN $s_expiredAt IS NULL THEN s.expiredAt ELSE datetime($s_expiredAt) END,
    invalidAt: CASE WHEN $s_invalidAt IS NULL THEN s.invalidAt ELSE datetime($s_invalidAt) END,
    createdAt: CASE WHEN $s_createdAt IS NULL THEN s.createdAt ELSE datetime($s_createdAt) END,
    updatedAt: CASE WHEN $s_updatedAt IS NULL THEN s.updatedAt ELSE datetime($s_updatedAt) END
  }

  MERGE (tv)-[r:HAS_SEGMENTATION]->(s)
  ON CREATE SET r.createdAt = datetime()

  SET r += {
    validAt: CASE WHEN $hseg_validAt IS NULL THEN r.validAt ELSE datetime($hseg_validAt) END,
    expiredAt: CASE WHEN $hseg_expiredAt IS NULL THEN r.expiredAt ELSE datetime($hseg_expiredAt) END,
    invalidAt: CASE WHEN $hseg_invalidAt IS NULL THEN r.invalidAt ELSE datetime($hseg_invalidAt) END,
    createdAt: CASE WHEN $hseg_createdAt IS NULL THEN r.createdAt ELSE datetime($hseg_createdAt) END,
    updatedAt: CASE WHEN $hseg_updatedAt IS NULL THEN r.updatedAt ELSE datetime($hseg_updatedAt) END
  }

  RETURN s.segmentationId AS segmentationId
`;


export const upsertChunksAndLinkCypher = `
  MATCH (d:Document { documentId: $documentId })
  MATCH (s:Segmentation { segmentationId: $segmentationId })

  UNWIND $chunks AS c
    MERGE (ch:Chunk { chunkKey: c.chunkKey })
    ON CREATE SET
      ch.chunkId = coalesce(ch.chunkId, randomUUID()),
      ch.createdAt = coalesce(ch.createdAt, datetime())

    SET ch += {
      index: c.index,
      text: c.text,

      charStart: c.charStart,
      charEnd: c.charEnd,

      startMs: c.startMs,
      endMs: c.endMs,

      embedding: c.embedding,
      embeddingModel: c.embeddingModel,
      embeddingVersion: c.embeddingVersion,

      validAt: CASE WHEN c.validAt IS NULL THEN ch.validAt ELSE datetime(c.validAt) END,
      expiredAt: CASE WHEN c.expiredAt IS NULL THEN ch.expiredAt ELSE datetime(c.expiredAt) END,
      invalidAt: CASE WHEN c.invalidAt IS NULL THEN ch.invalidAt ELSE datetime(c.invalidAt) END,
      createdAt: CASE WHEN c.createdAt IS NULL THEN ch.createdAt ELSE datetime(c.createdAt) END,
      updatedAt: CASE WHEN c.updatedAt IS NULL THEN ch.updatedAt ELSE datetime(c.updatedAt) END
    }

    MERGE (s)-[r1:HAS_CHUNK]->(ch)
    ON CREATE SET r1.createdAt = datetime()
    SET r1 += {
      validAt: CASE WHEN $segChunk_validAt IS NULL THEN r1.validAt ELSE datetime($segChunk_validAt) END,
      expiredAt: CASE WHEN $segChunk_expiredAt IS NULL THEN r1.expiredAt ELSE datetime($segChunk_expiredAt) END,
      invalidAt: CASE WHEN $segChunk_invalidAt IS NULL THEN r1.invalidAt ELSE datetime($segChunk_invalidAt) END,
      createdAt: CASE WHEN $segChunk_createdAt IS NULL THEN r1.createdAt ELSE datetime($segChunk_createdAt) END,
      updatedAt: CASE WHEN $segChunk_updatedAt IS NULL THEN r1.updatedAt ELSE datetime($segChunk_updatedAt) END
    }

    FOREACH (_ IN CASE WHEN $alsoCreateDocumentHasChunkEdges THEN [1] ELSE [] END |
      MERGE (d)-[r2:HAS_CHUNK]->(ch)
      ON CREATE SET r2.createdAt = datetime()
      SET r2 += {
        validAt: CASE WHEN $docChunk_validAt IS NULL THEN r2.validAt ELSE datetime($docChunk_validAt) END,
        expiredAt: CASE WHEN $docChunk_expiredAt IS NULL THEN r2.expiredAt ELSE datetime($docChunk_expiredAt) END,
        invalidAt: CASE WHEN $docChunk_invalidAt IS NULL THEN r2.invalidAt ELSE datetime($docChunk_invalidAt) END,
        createdAt: CASE WHEN $docChunk_createdAt IS NULL THEN r2.createdAt ELSE datetime($docChunk_createdAt) END,
        updatedAt: CASE WHEN $docChunk_updatedAt IS NULL THEN r2.updatedAt ELSE datetime($docChunk_updatedAt) END
      }
    )

  RETURN collect({ chunkId: ch.chunkId, chunkKey: ch.chunkKey, index: ch.index }) AS chunkMetas
`;


export const createNextChunkEdgesForSegmentationCypher = `
  MATCH (s:Segmentation { segmentationId: $segmentationId })
  MATCH (s)-[:HAS_CHUNK]->(c:Chunk)
  WITH c ORDER BY c.index ASC
  WITH collect(c) AS cs
  UNWIND range(0, size(cs) - 2) AS i
    WITH cs[i] AS a, cs[i+1] AS b
    MERGE (a)-[r:NEXT_CHUNK]->(b)
    ON CREATE SET r.createdAt = datetime()
    SET r += {
      validAt: CASE WHEN $next_validAt IS NULL THEN r.validAt ELSE datetime($next_validAt) END,
      expiredAt: CASE WHEN $next_expiredAt IS NULL THEN r.expiredAt ELSE datetime($next_expiredAt) END,
      invalidAt: CASE WHEN $next_invalidAt IS NULL THEN r.invalidAt ELSE datetime($next_invalidAt) END,
      createdAt: CASE WHEN $next_createdAt IS NULL THEN r.createdAt ELSE datetime($next_createdAt) END,
      updatedAt: CASE WHEN $next_updatedAt IS NULL THEN r.updatedAt ELSE datetime($next_updatedAt) END
    }
  RETURN true AS ok
`;