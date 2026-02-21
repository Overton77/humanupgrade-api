import { ProductIdentifier, ProductIdentifierKey } from "../types.js";

function normalizeForFingerprint(s: string) {
  return s
    .trim()
    .toLowerCase()
    .replace(/[\u2019']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function computeProductFingerprint(params: {
  brandName?: string | null;
  name?: string | null;
}) {
  if (!params.brandName?.trim() || !params.name?.trim()) return null;
  return `${normalizeForFingerprint(params.brandName)}::${normalizeForFingerprint(
    params.name
  )}`;
} 

export function resolveProductIdentifier(params: {
    productId?: string | null;
    gtin?: string | null;
    upc?: string | null;
    brandName?: string | null;
    name?: string | null;
  }): ProductIdentifier {
    const productId = params.productId?.trim();
    if (productId) return { key: "productId", value: productId };
  
    const gtin = params.gtin?.trim();
    if (gtin) return { key: "gtin", value: gtin };
  
    const upc = params.upc?.trim();
    if (upc) return { key: "upc", value: upc };
  
    const fp = computeProductFingerprint(params);
    if (fp) return { key: "productFingerprint", value: fp };
  
    throw new Error(
      "Product identifier required: productId OR gtin OR upc OR (brandName+name for fingerprint)."
    );
  }