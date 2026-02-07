// src/neo4j/searchIndexStatements.ts

export type SearchIndexStatementsOpts = {
  /**
   * Must match the length of embedding arrays.
   * Common: 1536, 3072, 1024, etc.
   */
  vectorDimensions: number;

  /**
   * Default: cosine
   */
  vectorSimilarityFunction?: "cosine" | "euclidean";

  /**
   * If you *don't* want to include searchText in fulltext, set false.
   */
  includeSearchTextInFulltext?: boolean;

  /**
   * If you materialize isActive, keep true; otherwise set false.
   */
  includeIsActivePropertyIndexes?: boolean;
};

function maybeSearchText(enabled: boolean, prop: string): string {
  return enabled ? `, ${prop}` : "";
}

export function buildSearchIndexStatements(opts: SearchIndexStatementsOpts): string[] {
  const similarity = opts.vectorSimilarityFunction ?? "cosine";
  const includeSearchText = opts.includeSearchTextInFulltext ?? true;
  const includeIsActive = opts.includeIsActivePropertyIndexes ?? true;

  // ===========================================================================
  // FULLTEXT PROPS
  // ===========================================================================

  const orgFulltextProps = `
    o.name,
    o.aliases,
    o.legalName,
    o.publicTicker,
    o.websiteUrl,
    o.description
    ${maybeSearchText(includeSearchText, "o.searchText")}
  `.trim();

  const productFulltextProps = `
    p.name,
    p.synonyms,
    p.brandName,
    p.modelNumber,
    p.ndcCode,
    p.upc,
    p.gtin,
    p.description,
    p.intendedUse
    ${maybeSearchText(includeSearchText, "p.searchText")}
  `.trim();

  const docFulltextProps = `
    d.title,
    d.url,
    d.type
    ${maybeSearchText(includeSearchText, "d.searchText")}
  `.trim();

  const dtvFulltextProps = `
    v.source,
    v.language,
    v.text
    ${maybeSearchText(includeSearchText, "v.searchText")}
  `.trim();

  const statements: string[] = [
    // =========================================================================
    // CONSTRAINTS (UNIQUENESS + NOT NULL)
    // =========================================================================

    // --- Chunk ---
    `CREATE CONSTRAINT chunk_chunkId_unique IF NOT EXISTS FOR (c:Chunk) REQUIRE c.chunkId IS UNIQUE`,
    `CREATE CONSTRAINT chunk_chunkKey_unique IF NOT EXISTS FOR (c:Chunk) REQUIRE c.chunkKey IS UNIQUE`,
    `CREATE CONSTRAINT chunk_chunkId_not_null IF NOT EXISTS FOR (c:Chunk) REQUIRE c.chunkId IS NOT NULL`,
    `CREATE CONSTRAINT chunk_chunkKey_not_null IF NOT EXISTS FOR (c:Chunk) REQUIRE c.chunkKey IS NOT NULL`,
    `CREATE CONSTRAINT chunk_index_not_null IF NOT EXISTS FOR (c:Chunk) REQUIRE c.index IS NOT NULL`,
    `CREATE CONSTRAINT chunk_text_not_null IF NOT EXISTS FOR (c:Chunk) REQUIRE c.text IS NOT NULL`,

    // --- Document ---
    `CREATE CONSTRAINT document_documentId_unique IF NOT EXISTS FOR (d:Document) REQUIRE d.documentId IS UNIQUE`,
    `CREATE CONSTRAINT document_documentKey_unique IF NOT EXISTS FOR (d:Document) REQUIRE d.documentKey IS UNIQUE`,
    `CREATE CONSTRAINT document_documentId_not_null IF NOT EXISTS FOR (d:Document) REQUIRE d.documentId IS NOT NULL`,
    `CREATE CONSTRAINT document_documentKey_not_null IF NOT EXISTS FOR (d:Document) REQUIRE d.documentKey IS NOT NULL`,
    `CREATE CONSTRAINT document_type_not_null IF NOT EXISTS FOR (d:Document) REQUIRE d.type IS NOT NULL`,

    // --- DocumentTextVersion ---
    `CREATE CONSTRAINT dtv_documentTextVersionId_unique IF NOT EXISTS FOR (v:DocumentTextVersion) REQUIRE v.documentTextVersionId IS UNIQUE`,
    `CREATE CONSTRAINT dtv_textVersionHash_unique IF NOT EXISTS FOR (v:DocumentTextVersion) REQUIRE v.textVersionHash IS UNIQUE`,
    `CREATE CONSTRAINT dtv_documentTextVersionId_not_null IF NOT EXISTS FOR (v:DocumentTextVersion) REQUIRE v.documentTextVersionId IS NOT NULL`,
    `CREATE CONSTRAINT dtv_textVersionHash_not_null IF NOT EXISTS FOR (v:DocumentTextVersion) REQUIRE v.textVersionHash IS NOT NULL`,
    `CREATE CONSTRAINT dtv_source_not_null IF NOT EXISTS FOR (v:DocumentTextVersion) REQUIRE v.source IS NOT NULL`,
    `CREATE CONSTRAINT dtv_text_not_null IF NOT EXISTS FOR (v:DocumentTextVersion) REQUIRE v.text IS NOT NULL`,

    // --- Segmentation ---
    `CREATE CONSTRAINT segmentation_segmentationId_unique IF NOT EXISTS FOR (s:Segmentation) REQUIRE s.segmentationId IS UNIQUE`,
    `CREATE CONSTRAINT segmentation_segmentationHash_unique IF NOT EXISTS FOR (s:Segmentation) REQUIRE s.segmentationHash IS UNIQUE`,
    `CREATE CONSTRAINT segmentation_segmentationId_not_null IF NOT EXISTS FOR (s:Segmentation) REQUIRE s.segmentationId IS NOT NULL`,
    `CREATE CONSTRAINT segmentation_segmentationHash_not_null IF NOT EXISTS FOR (s:Segmentation) REQUIRE s.segmentationHash IS NOT NULL`,
    `CREATE CONSTRAINT segmentation_strategy_not_null IF NOT EXISTS FOR (s:Segmentation) REQUIRE s.strategy IS NOT NULL`,
    `CREATE CONSTRAINT segmentation_chunkSize_not_null IF NOT EXISTS FOR (s:Segmentation) REQUIRE s.chunkSize IS NOT NULL`,
    `CREATE CONSTRAINT segmentation_overlap_not_null IF NOT EXISTS FOR (s:Segmentation) REQUIRE s.overlap IS NOT NULL`,

    // --- ResearchPlanRef ---
    `CREATE CONSTRAINT rpr_researchPlanRefId_unique IF NOT EXISTS FOR (r:ResearchPlanRef) REQUIRE r.researchPlanRefId IS UNIQUE`,
    `CREATE CONSTRAINT rpr_mongoPlanId_unique IF NOT EXISTS FOR (r:ResearchPlanRef) REQUIRE r.mongoPlanId IS UNIQUE`,
    `CREATE CONSTRAINT rpr_researchPlanRefId_not_null IF NOT EXISTS FOR (r:ResearchPlanRef) REQUIRE r.researchPlanRefId IS NOT NULL`,
    `CREATE CONSTRAINT rpr_mongoPlanId_not_null IF NOT EXISTS FOR (r:ResearchPlanRef) REQUIRE r.mongoPlanId IS NOT NULL`,

    // --- ResearchRunRef ---
    `CREATE CONSTRAINT rrr_researchRunRefId_unique IF NOT EXISTS FOR (r:ResearchRunRef) REQUIRE r.researchRunRefId IS UNIQUE`,
    `CREATE CONSTRAINT rrr_mongoRunId_unique IF NOT EXISTS FOR (r:ResearchRunRef) REQUIRE r.mongoRunId IS UNIQUE`,
    `CREATE CONSTRAINT rrr_researchRunRefId_not_null IF NOT EXISTS FOR (r:ResearchRunRef) REQUIRE r.researchRunRefId IS NOT NULL`,
    `CREATE CONSTRAINT rrr_mongoRunId_not_null IF NOT EXISTS FOR (r:ResearchRunRef) REQUIRE r.mongoRunId IS NOT NULL`,

    // =========================================================================
    // FULLTEXT
    // =========================================================================
    `
CREATE FULLTEXT INDEX org_fulltext IF NOT EXISTS
FOR (o:Organization)
ON EACH [${orgFulltextProps}]
    `.trim(),

    `
CREATE FULLTEXT INDEX product_fulltext IF NOT EXISTS
FOR (p:Product)
ON EACH [${productFulltextProps}]
    `.trim(),

    `
CREATE FULLTEXT INDEX chunk_fulltext IF NOT EXISTS
FOR (c:Chunk)
ON EACH [c.text]
    `.trim(),

    `
CREATE FULLTEXT INDEX document_fulltext IF NOT EXISTS
FOR (d:Document)
ON EACH [${docFulltextProps}]
    `.trim(),

    `
CREATE FULLTEXT INDEX document_text_version_fulltext IF NOT EXISTS
FOR (v:DocumentTextVersion)
ON EACH [${dtvFulltextProps}]
    `.trim(),

    // =========================================================================
    // VECTOR
    // =========================================================================
    `
CREATE VECTOR INDEX org_embedding_index IF NOT EXISTS
FOR (o:Organization) ON (o.embedding)
OPTIONS {
  indexConfig: {
    \`vector.dimensions\`: ${opts.vectorDimensions},
    \`vector.similarity_function\`: '${similarity}'
  }
}
    `.trim(),

    `
CREATE VECTOR INDEX product_embedding_index IF NOT EXISTS
FOR (p:Product) ON (p.embedding)
OPTIONS {
  indexConfig: {
    \`vector.dimensions\`: ${opts.vectorDimensions},
    \`vector.similarity_function\`: '${similarity}'
  }
}
    `.trim(),

    `
CREATE VECTOR INDEX chunk_embedding_index IF NOT EXISTS
FOR (c:Chunk) ON (c.embedding)
OPTIONS {
  indexConfig: {
    \`vector.dimensions\`: ${opts.vectorDimensions},
    \`vector.similarity_function\`: '${similarity}'
  }
}
    `.trim(),

    `
CREATE VECTOR INDEX document_searchTextEmbedding_index IF NOT EXISTS
FOR (d:Document) ON (d.searchTextEmbedding)
OPTIONS {
  indexConfig: {
    \`vector.dimensions\`: ${opts.vectorDimensions},
    \`vector.similarity_function\`: '${similarity}'
  }
}
    `.trim(),

    `
CREATE VECTOR INDEX documentTextVersion_searchTextEmbedding_index IF NOT EXISTS
FOR (v:DocumentTextVersion) ON (v.searchTextEmbedding)
OPTIONS {
  indexConfig: {
    \`vector.dimensions\`: ${opts.vectorDimensions},
    \`vector.similarity_function\`: '${similarity}'
  }
}
    `.trim(),

    // =========================================================================
    // ORGANIZATION PROPERTY INDEXES
    // =========================================================================
    `CREATE INDEX org_orgType IF NOT EXISTS FOR (o:Organization) ON (o.orgType)`,
    `CREATE INDEX org_businessModel IF NOT EXISTS FOR (o:Organization) ON (o.businessModel)`,
    `CREATE INDEX org_publicTicker IF NOT EXISTS FOR (o:Organization) ON (o.publicTicker)`,
    `CREATE INDEX org_employeeCountMin IF NOT EXISTS FOR (o:Organization) ON (o.employeeCountMin)`,
    `CREATE INDEX org_employeeCountMax IF NOT EXISTS FOR (o:Organization) ON (o.employeeCountMax)`,
    `CREATE INDEX org_regionsServed IF NOT EXISTS FOR (o:Organization) ON (o.regionsServed)`,
    `CREATE INDEX org_primaryIndustryTags IF NOT EXISTS FOR (o:Organization) ON (o.primaryIndustryTags)`,
    `CREATE INDEX org_validAt IF NOT EXISTS FOR (o:Organization) ON (o.validAt)`,
    `CREATE INDEX org_invalidAt IF NOT EXISTS FOR (o:Organization) ON (o.invalidAt)`,
    `CREATE INDEX org_expiredAt IF NOT EXISTS FOR (o:Organization) ON (o.expiredAt)`,
    ...(includeIsActive ? [`CREATE INDEX org_isActive IF NOT EXISTS FOR (o:Organization) ON (o.isActive)`] : []),

    // =========================================================================
    // PRODUCT PROPERTY INDEXES
    // =========================================================================
    `CREATE INDEX product_productDomain IF NOT EXISTS FOR (p:Product) ON (p.productDomain)`,
    `CREATE INDEX product_riskClass IF NOT EXISTS FOR (p:Product) ON (p.riskClass)`,
    `CREATE INDEX product_priceAmount IF NOT EXISTS FOR (p:Product) ON (p.priceAmount)`,
    `CREATE INDEX product_currency IF NOT EXISTS FOR (p:Product) ON (p.currency)`,
    `CREATE INDEX product_brandName IF NOT EXISTS FOR (p:Product) ON (p.brandName)`,
    `CREATE INDEX product_modelNumber IF NOT EXISTS FOR (p:Product) ON (p.modelNumber)`,
    `CREATE INDEX product_ndcCode IF NOT EXISTS FOR (p:Product) ON (p.ndcCode)`,
    `CREATE INDEX product_upc IF NOT EXISTS FOR (p:Product) ON (p.upc)`,
    `CREATE INDEX product_gtin IF NOT EXISTS FOR (p:Product) ON (p.gtin)`,
    `CREATE INDEX product_validAt IF NOT EXISTS FOR (p:Product) ON (p.validAt)`,
    `CREATE INDEX product_invalidAt IF NOT EXISTS FOR (p:Product) ON (p.invalidAt)`,
    `CREATE INDEX product_expiredAt IF NOT EXISTS FOR (p:Product) ON (p.expiredAt)`,
    ...(includeIsActive ? [`CREATE INDEX product_isActive IF NOT EXISTS FOR (p:Product) ON (p.isActive)`] : []),

    // =========================================================================
    // CHUNK PROPERTY INDEXES (ordering + time slicing + model/version)
    // =========================================================================
    `CREATE INDEX chunk_chunkKey IF NOT EXISTS FOR (c:Chunk) ON (c.chunkKey)`,
    `CREATE INDEX chunk_index IF NOT EXISTS FOR (c:Chunk) ON (c.index)`,
    `CREATE INDEX chunk_startMs IF NOT EXISTS FOR (c:Chunk) ON (c.startMs)`,
    `CREATE INDEX chunk_endMs IF NOT EXISTS FOR (c:Chunk) ON (c.endMs)`,
    `CREATE INDEX chunk_embeddingModel IF NOT EXISTS FOR (c:Chunk) ON (c.embeddingModel)`,
    `CREATE INDEX chunk_embeddingVersion IF NOT EXISTS FOR (c:Chunk) ON (c.embeddingVersion)`,
    `CREATE INDEX chunk_validAt IF NOT EXISTS FOR (c:Chunk) ON (c.validAt)`,
    `CREATE INDEX chunk_invalidAt IF NOT EXISTS FOR (c:Chunk) ON (c.invalidAt)`,
    `CREATE INDEX chunk_expiredAt IF NOT EXISTS FOR (c:Chunk) ON (c.expiredAt)`,

    // =========================================================================
    // DOCUMENT PROPERTY INDEXES (type + time + search surface metadata)
    // =========================================================================
    `CREATE INDEX document_documentKey IF NOT EXISTS FOR (d:Document) ON (d.documentKey)`,
    `CREATE INDEX document_type IF NOT EXISTS FOR (d:Document) ON (d.type)`,
    `CREATE INDEX document_url IF NOT EXISTS FOR (d:Document) ON (d.url)`,
    `CREATE INDEX document_publishedAt IF NOT EXISTS FOR (d:Document) ON (d.publishedAt)`,
    `CREATE INDEX document_retrievedAt IF NOT EXISTS FOR (d:Document) ON (d.retrievedAt)`,
    `CREATE INDEX document_searchTextModel IF NOT EXISTS FOR (d:Document) ON (d.searchTextModel)`,
    `CREATE INDEX document_searchTextVersion IF NOT EXISTS FOR (d:Document) ON (d.searchTextVersion)`,
    `CREATE INDEX document_searchTextUpdatedAt IF NOT EXISTS FOR (d:Document) ON (d.searchTextUpdatedAt)`,
    `CREATE INDEX document_validAt IF NOT EXISTS FOR (d:Document) ON (d.validAt)`,
    `CREATE INDEX document_invalidAt IF NOT EXISTS FOR (d:Document) ON (d.invalidAt)`,
    `CREATE INDEX document_expiredAt IF NOT EXISTS FOR (d:Document) ON (d.expiredAt)`,

    // =========================================================================
    // DOCUMENT TEXT VERSION PROPERTY INDEXES
    // =========================================================================
    `CREATE INDEX dtv_textVersionHash IF NOT EXISTS FOR (v:DocumentTextVersion) ON (v.textVersionHash)`,
    `CREATE INDEX dtv_source IF NOT EXISTS FOR (v:DocumentTextVersion) ON (v.source)`,
    `CREATE INDEX dtv_language IF NOT EXISTS FOR (v:DocumentTextVersion) ON (v.language)`,
    `CREATE INDEX dtv_searchTextModel IF NOT EXISTS FOR (v:DocumentTextVersion) ON (v.searchTextModel)`,
    `CREATE INDEX dtv_searchTextVersion IF NOT EXISTS FOR (v:DocumentTextVersion) ON (v.searchTextVersion)`,
    `CREATE INDEX dtv_searchTextUpdatedAt IF NOT EXISTS FOR (v:DocumentTextVersion) ON (v.searchTextUpdatedAt)`,
    `CREATE INDEX dtv_validAt IF NOT EXISTS FOR (v:DocumentTextVersion) ON (v.validAt)`,
    `CREATE INDEX dtv_invalidAt IF NOT EXISTS FOR (v:DocumentTextVersion) ON (v.invalidAt)`,
    `CREATE INDEX dtv_expiredAt IF NOT EXISTS FOR (v:DocumentTextVersion) ON (v.expiredAt)`,

    // =========================================================================
    // SEGMENTATION PROPERTY INDEXES
    // =========================================================================
    `CREATE INDEX segmentation_segmentationHash IF NOT EXISTS FOR (s:Segmentation) ON (s.segmentationHash)`,
    `CREATE INDEX segmentation_strategy IF NOT EXISTS FOR (s:Segmentation) ON (s.strategy)`,
    `CREATE INDEX segmentation_chunkSize IF NOT EXISTS FOR (s:Segmentation) ON (s.chunkSize)`,
    `CREATE INDEX segmentation_overlap IF NOT EXISTS FOR (s:Segmentation) ON (s.overlap)`,
    `CREATE INDEX segmentation_validAt IF NOT EXISTS FOR (s:Segmentation) ON (s.validAt)`,
    `CREATE INDEX segmentation_invalidAt IF NOT EXISTS FOR (s:Segmentation) ON (s.invalidAt)`,
    `CREATE INDEX segmentation_expiredAt IF NOT EXISTS FOR (s:Segmentation) ON (s.expiredAt)`,

    // =========================================================================
    // RESEARCH REFS PROPERTY INDEXES
    // =========================================================================
    `CREATE INDEX rpr_mongoPlanId IF NOT EXISTS FOR (r:ResearchPlanRef) ON (r.mongoPlanId)`,
    `CREATE INDEX rpr_version IF NOT EXISTS FOR (r:ResearchPlanRef) ON (r.version)`,
    `CREATE INDEX rpr_validAt IF NOT EXISTS FOR (r:ResearchPlanRef) ON (r.validAt)`,
    `CREATE INDEX rpr_invalidAt IF NOT EXISTS FOR (r:ResearchPlanRef) ON (r.invalidAt)`,
    `CREATE INDEX rpr_expiredAt IF NOT EXISTS FOR (r:ResearchPlanRef) ON (r.expiredAt)`,

    `CREATE INDEX rrr_mongoRunId IF NOT EXISTS FOR (r:ResearchRunRef) ON (r.mongoRunId)`,
    `CREATE INDEX rrr_startedAt IF NOT EXISTS FOR (r:ResearchRunRef) ON (r.startedAt)`,
    `CREATE INDEX rrr_endedAt IF NOT EXISTS FOR (r:ResearchRunRef) ON (r.endedAt)`,
    `CREATE INDEX rrr_validAt IF NOT EXISTS FOR (r:ResearchRunRef) ON (r.validAt)`,
    `CREATE INDEX rrr_invalidAt IF NOT EXISTS FOR (r:ResearchRunRef) ON (r.invalidAt)`,
    `CREATE INDEX rrr_expiredAt IF NOT EXISTS FOR (r:ResearchRunRef) ON (r.expiredAt)`,
  ];

  return statements;
}