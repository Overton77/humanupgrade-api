import { ProductIdentifierKey } from "../types.js";

export function buildProductUpdateCypher(identifierKey: ProductIdentifierKey) {
  return `
    OPTIONAL MATCH (p:Product { ${identifierKey}: $idValue })
    CALL apoc.util.validate(
      p IS NULL,
      'updateProduct failed: Product not found for ${identifierKey} %s',
      [$idValue]
    )

    // canonical id must always exist
    SET p.productId = coalesce(p.productId, randomUUID())

    SET p += {
      name: CASE WHEN $name IS NULL THEN p.name ELSE $name END,

      synonyms: CASE
        WHEN $synonyms IS NULL THEN p.synonyms
        ELSE apoc.coll.toSet(coalesce(p.synonyms, []) + coalesce($synonyms, []))
      END,

      productDomain: CASE WHEN $productDomain IS NULL THEN p.productDomain ELSE $productDomain END,
      productType: CASE WHEN $productType IS NULL THEN p.productType ELSE $productType END,
      intendedUse: CASE WHEN $intendedUse IS NULL THEN p.intendedUse ELSE $intendedUse END,
      description: CASE WHEN $description IS NULL THEN p.description ELSE $description END,
      brandName: CASE WHEN $brandName IS NULL THEN p.brandName ELSE $brandName END,
      modelNumber: CASE WHEN $modelNumber IS NULL THEN p.modelNumber ELSE $modelNumber END,

      gtin: CASE WHEN $gtin IS NULL THEN p.gtin ELSE $gtin END,
      upc: CASE WHEN $upc IS NULL THEN p.upc ELSE $upc END,
      productFingerprint: CASE WHEN $productFingerprint IS NULL THEN p.productFingerprint ELSE $productFingerprint END,

      riskClass: CASE WHEN $riskClass IS NULL THEN p.riskClass ELSE $riskClass END,
      currency: CASE WHEN $currency IS NULL THEN p.currency ELSE $currency END,
      priceAmount: CASE WHEN $priceAmount IS NULL THEN p.priceAmount ELSE $priceAmount END,

      validAt: CASE WHEN $validAt IS NULL THEN p.validAt ELSE $validAt END,
      invalidAt: CASE WHEN $invalidAt IS NULL THEN p.invalidAt ELSE $invalidAt END,
      expiredAt: CASE WHEN $expiredAt IS NULL THEN p.expiredAt ELSE $expiredAt END
    }

    RETURN p
  `;
}