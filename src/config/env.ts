import dotenv from "dotenv";
import ms from "ms";

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
  refreshTokenTtlDays: parseInt(process.env.REFRESH_TOKEN_TTL_DAYS || "30", 10),
  accessTokenTtl: requireEnv("ACCESS_TOKEN_TTL") as ms.StringValue,
  webOrigin: requireEnv("WEB_ORIGIN"),
  refreshCookieName: requireEnv("REFRESH_COOKIE_NAME"),
  cookieSecure: requireEnv("COOKIE_SECURE") === "true",
  cookieSameSite: requireEnv("COOKIE_SAME_SITE") as "lax" | "strict" | "none",
  cookieDomain: process.env.COOKIE_DOMAIN || undefined,
  redisUrl: requireEnv("REDIS_URL"),
  neo4jAuraInstanceName: requireEnv("NEO4J_AURA_INSTANCE_NAME"),
  neo4jAuraURI: requireEnv("NEO4J_URI"),
  neo4jAuraQueryAPI: requireEnv("NEO4J_AURA_QUERY_API"),
  neo4jAuraInstanceId: requireEnv("NEO4J_AURA_INSTANCE_ID"),
  neo4jAuraPassword: requireEnv("NEO4J_AURA_PASSWORD"),
  neo4jAuraUsername: requireEnv("NEO4J_AURA_USERNAME"),
  neo4jAuraDatabaseName: requireEnv("NEO4J_AURA_DATABASE_NAME"),
};
