// src/embeddings/embeddingConfig.ts

import type { EmbeddingTargetType } from "../graphql/enums/index.js";

// Re-export for convenience
export type { EmbeddingTargetType };  



export type EmbeddingConfig = {
  label: "Organization" | "Product";
  idProp: "organizationId" | "productId";

  /**
   * Where to store the denormalized text and embedding.
   */
  searchTextProp: string;   // "searchText"
  embeddingProp: string;    // "embedding"

  /**
   * For status / observability.
   */
  embeddingModelProp: string;       // "embeddingModel"
  embeddingUpdatedAtProp: string;   // "embeddingUpdatedAt"
  searchTextUpdatedAtProp: string;  // "searchTextUpdatedAt"
  embeddingVersionProp?: string;    // optional "embeddingVersion"

  /**
   * Which node properties contribute to searchText (server-controlled).
   */
  fields: string[];

  /**
   * Optional: additional builder logic (formatting)
   */
  buildText?: (props: Record<string, any>) => string;
};

export const EMBEDDING_CONFIG: Record<EmbeddingTargetType, EmbeddingConfig> = {
  ORGANIZATION: {
    label: "Organization",
    idProp: "organizationId",
    searchTextProp: "searchText",
    embeddingProp: "embedding",
    embeddingModelProp: "embeddingModel",
    embeddingUpdatedAtProp: "embeddingUpdatedAt",
    searchTextUpdatedAtProp: "searchTextUpdatedAt",
    embeddingVersionProp: "embeddingVersion",
    fields: [
      "name",
      "aliases",
      "legalName",
      "publicTicker",
      "description",
      "primaryIndustryTags",
      "regionsServed",
      "websiteUrl",
    ],
  },

  PRODUCT: {
    label: "Product",
    idProp: "productId",
    searchTextProp: "searchText",
    embeddingProp: "embedding",
    embeddingModelProp: "embeddingModel",
    embeddingUpdatedAtProp: "embeddingUpdatedAt",
    searchTextUpdatedAtProp: "searchTextUpdatedAt",
    embeddingVersionProp: "embeddingVersion",
    fields: [
      "name",
      "synonyms",
      "brandName",
      "modelNumber",
      "ndcCode",
      "upc",
      "gtin",
      "intendedUse",
      "description",
      "productDomain",
      "riskClass",
    ],
  },
};

function stringifyField(v: any): string {
  if (v == null) return "";
  if (Array.isArray(v)) return v.filter(Boolean).join(" ");
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return "";
}

export function buildSearchTextFromConfig(
  cfg: EmbeddingConfig,
  props: Record<string, any>
): string {
  if (cfg.buildText) return cfg.buildText(props);

  const chunks: string[] = [];
  for (const f of cfg.fields) {
    chunks.push(stringifyField(props[f]));
  }
  return chunks
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}
