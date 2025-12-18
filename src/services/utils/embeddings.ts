import {
  openAIClient,
  DEFAULT_EMBED_MODEL,
} from "../../llmproviders/openAIClient.js";

export async function embedText(
  input: string,
  model: string = DEFAULT_EMBED_MODEL
) {
  const text = (input ?? "").trim();

  if (!text) return;

  const resp = await openAIClient.embeddings.create({
    model,
    input: text,
  });

  return resp.data[0].embedding;
}
