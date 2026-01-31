import { openAIClient, DEFAULT_EMBED_MODEL } from "../llmproviders/openAIClient.js"; 


//Good defaults:
// - dimensions: omit (model default). You can set it later if you want smaller vectors.
// - batch size: keep small and simple for now
// - input normalization: trim + collapse whitespace
export type OpenAIEmbedderConfig = {
  model?: string;
  /**
   * Optional: OpenAI embeddings API supports dimensions for some models.
   * If you set this, your Neo4j vector index dimensions MUST match.
   */
  dimensions?: number;
  /**
   * Optional: tag request for tracing/debug.
   */
  user?: string;
};

export type Embedder = {
  embed: (text: string) => Promise<number[]>;
  embedMany: (texts: string[]) => Promise<number[][]>;
  config: Required<Pick<OpenAIEmbedderConfig, "model">> &
    Omit<OpenAIEmbedderConfig, "model">;
};

function normalizeInput(text: string): string {
  return text.trim().replace(/\s+/g, " ");
}

function assertNonEmpty(text: string): void {
  if (!text || !text.trim()) {
    throw new Error("Embedder input text is empty.");
  }
}

/**
 * Create an OpenAI embedder with sane defaults.
 */
export function createOpenAIEmbedder(
  cfg: OpenAIEmbedderConfig = {}
): Embedder {
  const model = cfg.model ?? DEFAULT_EMBED_MODEL;

  async function embed(text: string): Promise<number[]> {
    assertNonEmpty(text);
    const input = normalizeInput(text);

    const resp = await openAIClient.embeddings.create({
      model,
      input,
      ...(cfg.dimensions ? { dimensions: cfg.dimensions } : {}),
      ...(cfg.user ? { user: cfg.user } : {}),
    });

    const vec = resp.data?.[0]?.embedding;
    if (!vec || !Array.isArray(vec)) {
      throw new Error("OpenAI embeddings response missing embedding vector.");
    }
    return vec;
  }

  async function embedMany(texts: string[]): Promise<number[][]> {
    const cleaned = texts
      .map((t) => normalizeInput(String(t ?? "")))
      .filter((t) => t.length > 0);

    if (cleaned.length === 0) return [];

    const resp = await openAIClient.embeddings.create({
      model,
      input: cleaned,
      ...(cfg.dimensions ? { dimensions: cfg.dimensions } : {}),
      ...(cfg.user ? { user: cfg.user } : {}),
    });

    const vectors = resp.data?.map((d) => d.embedding) ?? [];
    if (vectors.length !== cleaned.length) {
      throw new Error(
        `OpenAI embeddings response count mismatch: expected ${cleaned.length}, got ${vectors.length}`
      );
    }
    return vectors;
  }

  return {
    embed,
    embedMany,
    config: { model, ...cfg },
  };
}