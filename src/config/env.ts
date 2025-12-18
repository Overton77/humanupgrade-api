import dotenv from "dotenv";

dotenv.config();

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required env var: ${key}`);
  }
  return value;
}

export const env = {
  port: parseInt(process.env.PORT || "4000", 10),
  mongoUri: requireEnv("MONGODB_URI"),
  jwtSecret: requireEnv("JWT_SECRET"),
  seedDBName: requireEnv("SEED_DB_NAME"),
  dbName: requireEnv("DB_NAME"),
  seedDBCollectionName: requireEnv("SEED_DB_COLLECTION_NAME"),
  transcriptBucketName: requireEnv("HU_TRANSCRIPT_BUCKET"),
  qdrantUrl: requireEnv("QDRANT_URL"),
  qdrantApiKey: process.env.QDRANT_API_KEY || "",
  qdrantCollectionName: process.env.QDRANT_COLLECTION_NAME || "human-upgrade",
  qdrantVectorDimension: parseInt(
    process.env.QDRANT_VECTOR_DIMENSION || "1536",
    10
  ),
  openaiApiKey: requireEnv("OPENAI_API_KEY"),
};
