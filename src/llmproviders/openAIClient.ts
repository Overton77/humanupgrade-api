import OpenAI from "openai";
import { env } from "../config/env.js";

export const openAIClient = new OpenAI({
  apiKey: env.openaiApiKey,
});

export const DEFAULT_EMBED_MODEL = "text-embedding-3-small" as const;
