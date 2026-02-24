export const organizationOffersProductCypher = `
// ==================================================================
// OFFERS_PRODUCT (create OR connect) (CONNECT = HARD FAIL if missing)
// ==================================================================
MATCH (o:Organization {organizationId: $organizationId})

UNWIND coalesce($offersProduct, []) AS prodRel
CALL {
  // ---- CREATE branch ----
  WITH o, prodRel 
  WITH o, prodRel  
  WHERE prodRel.product.create IS NOT NULL

  MERGE (p:Product { productId: coalesce(prodRel.product.create.productId, randomUUID()) })
  ON CREATE SET p.createdAt = datetime()

  SET p += {
    name: CASE WHEN prodRel.product.create.name IS NULL THEN p.name ELSE prodRel.product.create.name END,
    synonyms: CASE
      WHEN prodRel.product.create.synonyms IS NULL THEN p.synonyms
      ELSE apoc.coll.toSet(coalesce(p.synonyms, []) + coalesce(prodRel.product.create.synonyms, []))
    END,
    productDomain: CASE WHEN prodRel.product.create.productDomain IS NULL THEN p.productDomain ELSE prodRel.product.create.productDomain END,
    productType: CASE WHEN prodRel.product.create.productType IS NULL THEN p.productType ELSE prodRel.product.create.productType END,
    intendedUse: CASE WHEN prodRel.product.create.intendedUse IS NULL THEN p.intendedUse ELSE prodRel.product.create.intendedUse END,
    description: CASE WHEN prodRel.product.create.description IS NULL THEN p.description ELSE prodRel.product.create.description END,
    brandName: CASE WHEN prodRel.product.create.brandName IS NULL THEN p.brandName ELSE prodRel.product.create.brandName END,
    modelNumber: CASE WHEN prodRel.product.create.modelNumber IS NULL THEN p.modelNumber ELSE prodRel.product.create.modelNumber END,
    ndcCode: CASE WHEN prodRel.product.create.ndcCode IS NULL THEN p.ndcCode ELSE prodRel.product.create.ndcCode END,
    upc: CASE WHEN prodRel.product.create.upc IS NULL THEN p.upc ELSE prodRel.product.create.upc END,
    gtin: CASE WHEN prodRel.product.create.gtin IS NULL THEN p.gtin ELSE prodRel.product.create.gtin END,
    riskClass: CASE WHEN prodRel.product.create.riskClass IS NULL THEN p.riskClass ELSE prodRel.product.create.riskClass END,
    currency: CASE WHEN prodRel.product.create.currency IS NULL THEN p.currency ELSE prodRel.product.create.currency END,
    priceAmount: CASE WHEN prodRel.product.create.priceAmount IS NULL THEN p.priceAmount ELSE prodRel.product.create.priceAmount END
  }

  MERGE (o)-[r:OFFERS_PRODUCT]->(p)
  ON CREATE SET r.createdAt = datetime()

  SET r += {
    createdAt: CASE WHEN prodRel.createdAt IS NULL THEN r.createdAt ELSE prodRel.createdAt END,
    validAt: CASE WHEN prodRel.validAt IS NULL THEN r.validAt ELSE prodRel.validAt END,
    invalidAt: CASE WHEN prodRel.invalidAt IS NULL THEN r.invalidAt ELSE prodRel.invalidAt END,
    expiredAt: CASE WHEN prodRel.expiredAt IS NULL THEN r.expiredAt ELSE prodRel.expiredAt END
  }

  RETURN 1 AS ok

  UNION

  // ---- CONNECT branch (HARD FAIL if missing) ----
  WITH o, prodRel  
  WITH o, prodRel  
  WHERE prodRel.product.connect IS NOT NULL

  OPTIONAL MATCH (p:Product {productId: prodRel.product.connect.productId})
  WITH o, prodRel, p

  CALL apoc.util.validate(
    p IS NULL,
    'OFFERS_PRODUCT connect failed: Product not found for productId %s',
    [prodRel.product.connect.productId]
  )

  MERGE (o)-[r:OFFERS_PRODUCT]->(p)
  ON CREATE SET r.createdAt = datetime()

  SET r += {
    createdAt: CASE WHEN prodRel.createdAt IS NULL THEN r.createdAt ELSE prodRel.createdAt END,
    validAt: CASE WHEN prodRel.validAt IS NULL THEN r.validAt ELSE prodRel.validAt END,
    invalidAt: CASE WHEN prodRel.invalidAt IS NULL THEN r.invalidAt ELSE prodRel.invalidAt END,
    expiredAt: CASE WHEN prodRel.expiredAt IS NULL THEN r.expiredAt ELSE prodRel.expiredAt END
  }

  RETURN 1 AS ok
}

RETURN 1 AS ok
`;

export const updateOrganizationOffersProductCypher = `
  MATCH (o:Organization {organizationId: $organizationId})
  UNWIND $offersProduct AS rel
  CALL {
    // ---------------- CREATE ----------------
    WITH o, rel
    WITH o, rel WHERE rel.product.create IS NOT NULL
  
    MERGE (p:Product {productId: coalesce(rel.product.create.productId, randomUUID())})
    ON CREATE SET p.createdAt = datetime()
  
    SET p += {
      name: CASE WHEN rel.product.create.name IS NULL THEN p.name ELSE rel.product.create.name END,
      synonyms: CASE
        WHEN rel.product.create.synonyms IS NULL THEN p.synonyms
        ELSE apoc.coll.toSet(coalesce(p.synonyms, []) + coalesce(rel.product.create.synonyms, []))
      END,
      productDomain: CASE WHEN rel.product.create.productDomain IS NULL THEN p.productDomain ELSE rel.product.create.productDomain END,
      productType: CASE WHEN rel.product.create.productType IS NULL THEN p.productType ELSE rel.product.create.productType END,
      intendedUse: CASE WHEN rel.product.create.intendedUse IS NULL THEN p.intendedUse ELSE rel.product.create.intendedUse END,
      description: CASE WHEN rel.product.create.description IS NULL THEN p.description ELSE rel.product.create.description END,
      brandName: CASE WHEN rel.product.create.brandName IS NULL THEN p.brandName ELSE rel.product.create.brandName END,
      modelNumber: CASE WHEN rel.product.create.modelNumber IS NULL THEN p.modelNumber ELSE rel.product.create.modelNumber END,
      ndcCode: CASE WHEN rel.product.create.ndcCode IS NULL THEN p.ndcCode ELSE rel.product.create.ndcCode END,
      upc: CASE WHEN rel.product.create.upc IS NULL THEN p.upc ELSE rel.product.create.upc END,
      gtin: CASE WHEN rel.product.create.gtin IS NULL THEN p.gtin ELSE rel.product.create.gtin END,
      riskClass: CASE WHEN rel.product.create.riskClass IS NULL THEN p.riskClass ELSE rel.product.create.riskClass END,
      currency: CASE WHEN rel.product.create.currency IS NULL THEN p.currency ELSE rel.product.create.currency END,
      priceAmount: CASE WHEN rel.product.create.priceAmount IS NULL THEN p.priceAmount ELSE rel.product.create.priceAmount END
    }
  
    MERGE (o)-[r:OFFERS_PRODUCT]->(p)
    ON CREATE SET r.createdAt = datetime()
  
    SET r += {
      createdAt: CASE WHEN rel.createdAt IS NULL THEN r.createdAt ELSE rel.createdAt END,
      validAt: CASE WHEN rel.validAt IS NULL THEN r.validAt ELSE rel.validAt END,
      invalidAt: CASE WHEN rel.invalidAt IS NULL THEN r.invalidAt ELSE rel.invalidAt END,
      expiredAt: CASE WHEN rel.expiredAt IS NULL THEN r.expiredAt ELSE rel.expiredAt END
    }
  
    RETURN 1 AS okOP
  
    UNION
  
    // ---------------- CONNECT (strict) ----------------
    WITH o, rel
    WITH o, rel WHERE rel.product.connect IS NOT NULL
  
    OPTIONAL MATCH (p2:Product {productId: rel.product.connect.productId})
    CALL apoc.util.validate(
      p2 IS NULL,
      'OFFERS_PRODUCT connect failed: Product not found for productId %s',
      [rel.product.connect.productId]
    )
  
    MERGE (o)-[r2:OFFERS_PRODUCT]->(p2)
    ON CREATE SET r2.createdAt = datetime()
  
    SET r2 += {
      createdAt: CASE WHEN rel.createdAt IS NULL THEN r2.createdAt ELSE rel.createdAt END,
      validAt: CASE WHEN rel.validAt IS NULL THEN r2.validAt ELSE rel.validAt END,
      invalidAt: CASE WHEN rel.invalidAt IS NULL THEN r2.invalidAt ELSE rel.invalidAt END,
      expiredAt: CASE WHEN rel.expiredAt IS NULL THEN r2.expiredAt ELSE rel.expiredAt END
    }
  
    RETURN 1 AS okOP
  
    UNION
  
    // ---------------- UPDATE (strict) ----------------
    WITH o, rel
    WITH o, rel WHERE rel.product.update IS NOT NULL
  
    CALL apoc.util.validate(
      rel.product.update.productId IS NULL,
      'OFFERS_PRODUCT update failed: product.update.productId is required',
      []
    )
  
    OPTIONAL MATCH (p3:Product {productId: rel.product.update.productId})
    OPTIONAL MATCH (o)-[r3:OFFERS_PRODUCT]->(p3)
  
    CALL apoc.util.validate(
      p3 IS NULL,
      'OFFERS_PRODUCT update failed: Product not found for productId %s',
      [rel.product.update.productId]
    )
    CALL apoc.util.validate(
      r3 IS NULL,
      'OFFERS_PRODUCT update failed: relationship not found for org %s -> product %s',
      [$organizationId, rel.product.update.productId]
    )
  
    SET p3 += {
      name: CASE WHEN rel.product.update.name IS NULL THEN p3.name ELSE rel.product.update.name END,
      synonyms: CASE
        WHEN rel.product.update.synonyms IS NULL THEN p3.synonyms
        ELSE apoc.coll.toSet(coalesce(p3.synonyms, []) + coalesce(rel.product.update.synonyms, []))
      END,
      productDomain: CASE WHEN rel.product.update.productDomain IS NULL THEN p3.productDomain ELSE rel.product.update.productDomain END,
      productType: CASE WHEN rel.product.update.productType IS NULL THEN p3.productType ELSE rel.product.update.productType END,
      intendedUse: CASE WHEN rel.product.update.intendedUse IS NULL THEN p3.intendedUse ELSE rel.product.update.intendedUse END,
      description: CASE WHEN rel.product.update.description IS NULL THEN p3.description ELSE rel.product.update.description END,
      brandName: CASE WHEN rel.product.update.brandName IS NULL THEN p3.brandName ELSE rel.product.update.brandName END,
      modelNumber: CASE WHEN rel.product.update.modelNumber IS NULL THEN p3.modelNumber ELSE rel.product.update.modelNumber END,
      ndcCode: CASE WHEN rel.product.update.ndcCode IS NULL THEN p3.ndcCode ELSE rel.product.update.ndcCode END,
      upc: CASE WHEN rel.product.update.upc IS NULL THEN p3.upc ELSE rel.product.update.upc END,
      gtin: CASE WHEN rel.product.update.gtin IS NULL THEN p3.gtin ELSE rel.product.update.gtin END,
      riskClass: CASE WHEN rel.product.update.riskClass IS NULL THEN p3.riskClass ELSE rel.product.update.riskClass END,
      currency: CASE WHEN rel.product.update.currency IS NULL THEN p3.currency ELSE rel.product.update.currency END,
      priceAmount: CASE WHEN rel.product.update.priceAmount IS NULL THEN p3.priceAmount ELSE rel.product.update.priceAmount END
    }
  
    SET r3 += {
      createdAt: CASE WHEN rel.createdAt IS NULL THEN r3.createdAt ELSE rel.createdAt END,
      validAt: CASE WHEN rel.validAt IS NULL THEN r3.validAt ELSE rel.validAt END,
      invalidAt: CASE WHEN rel.invalidAt IS NULL THEN r3.invalidAt ELSE rel.invalidAt END,
      expiredAt: CASE WHEN rel.expiredAt IS NULL THEN r3.expiredAt ELSE rel.expiredAt END
    }
  
    RETURN 1 AS okOP
  }
  RETURN count(*) AS _offersProductProcessed
            `;
