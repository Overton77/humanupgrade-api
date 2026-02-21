export const findExistingProductIdCypher = `
  // Try to locate an existing product by any provided key.
  // Order of precedence: productId, gtin, upc, fingerprint.
  OPTIONAL MATCH (pById:Product {productId: $productId})
  WITH pById
  WHERE pById IS NOT NULL
  RETURN pById.productId AS productId
  UNION
  OPTIONAL MATCH (pByGtin:Product {gtin: $gtin})
  WITH pByGtin
  WHERE $gtin IS NOT NULL AND pByGtin IS NOT NULL
  RETURN pByGtin.productId AS productId
  UNION
  OPTIONAL MATCH (pByUpc:Product {upc: $upc})
  WITH pByUpc
  WHERE $upc IS NOT NULL AND pByUpc IS NOT NULL
  RETURN pByUpc.productId AS productId
  UNION
  OPTIONAL MATCH (pByFp:Product {productFingerprint: $productFingerprint})
  WITH pByFp
  WHERE $productFingerprint IS NOT NULL AND pByFp IS NOT NULL
  RETURN pByFp.productId AS productId
`;
