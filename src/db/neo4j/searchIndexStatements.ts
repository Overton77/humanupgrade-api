// src/neo4j/searchIndexStatements.ts

export type SearchIndexStatementsOpts = {
    /**
     * Must match the length of Organization.embedding / Product.embedding arrays.
     * Common: 1536, 3072, 1024, etc.
     */
    vectorDimensions: number;
  
    /**
     * Default: cosine
     */
    vectorSimilarityFunction?: "cosine" | "euclidean";
  
    /**
     * If you *don't* want to include searchText in fulltext, set false.
     * (I usually keep it in; you can always remove later.)
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
  
  export function buildSearchIndexStatements(
    opts: SearchIndexStatementsOpts
  ): string[] {
    const similarity = opts.vectorSimilarityFunction ?? "cosine";
    const includeSearchText = opts.includeSearchTextInFulltext ?? true;
    const includeIsActive = opts.includeIsActivePropertyIndexes ?? true;
  
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
  
    const statements: string[] = [
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
  
      ...(includeIsActive
        ? [`CREATE INDEX org_isActive IF NOT EXISTS FOR (o:Organization) ON (o.isActive)`]
        : []),
  
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
  
      ...(includeIsActive
        ? [`CREATE INDEX product_isActive IF NOT EXISTS FOR (p:Product) ON (p.isActive)`]
        : []),
    ];
  
    return statements;
  }
  