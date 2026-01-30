export type ProductIdentifierKey =
  | "productId"
  | "gtin"
  | "upc"
  | "productFingerprint";

export type ProductIdentifier = { key: ProductIdentifierKey; value: string };