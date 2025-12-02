// scripts/createVectorIndexes.ts
import { MongoClient, type Db } from "mongodb";
import mongoose from "mongoose";
import { env } from "../config/env.js";
import { connectToDatabase } from "../db/connection.js";

const DB_NAME = "humanupgrade";
const NUM_DIMENSIONS = 1536;
const MAX_SEARCH_INDEXES_FREE_TIER = 3;

type VectorIndexConfig = {
  collection: string;
  path: string; // embedding field
};

// You can change this config as needed.
// On free tier: you're only allowed 3 FTS/search/vector indexes total.
const allDesiredVectorIndexes: VectorIndexConfig[] = [
  { collection: "products", path: "descriptionEmbedding" },
  { collection: "businesses", path: "descriptionEmbedding" },
  { collection: "people", path: "bioEmbedding" },
];

async function indexExists(
  db: Db,
  collection: string,
  indexName: string
): Promise<boolean> {
  const coll = db.collection(collection);

  try {
    const cursor = coll.listSearchIndexes();

    for await (const index of cursor as any) {
      if (index.name === indexName) {
        return true;
      }
    }
  } catch (err: any) {
    // If collection doesn't exist or listSearchIndexes isn't available for some reason
    console.warn(
      `[DB] Could not list Search indexes for ${collection} (maybe collection missing?):`,
      err
    );
  }

  return false;
}

async function ensureVectorIndex(
  db: Db,
  config: VectorIndexConfig
): Promise<void> {
  const { collection, path } = config;
  const indexName = `${collection}_${path}_vector`;

  const exists = await indexExists(db, collection, indexName);

  if (exists) {
    console.log(
      `[DB] Search index "${indexName}" already exists on ${collection}, skipping.`
    );
    return;
  }

  console.log(
    `[DB] Creating vectorSearch index "${indexName}" on ${collection}.${path}...`
  );

  const indexCommand = {
    createSearchIndexes: collection,
    indexes: [
      {
        name: indexName,
        type: "vectorSearch",
        definition: {
          fields: [
            {
              type: "vector",
              path,
              numDimensions: NUM_DIMENSIONS,
              similarity: "cosine",
              // quantization: none (omit this field)
            },
          ],
        },
      },
    ],
  } as const;

  const result = await db.command(indexCommand);
  console.log(`[DB] Result for ${indexName}:`, JSON.stringify(result));
}

async function main() {
  console.log(
    `[DB] Free tier note: allowed Search/Vector indexes ≈ ${MAX_SEARCH_INDEXES_FREE_TIER}. ` +
      `Configured indexes: ${allDesiredVectorIndexes.length}.`
  );

  // Ensure Mongoose is connected (your existing helper)
  await connectToDatabase(DB_NAME);

  const client = new MongoClient(env.mongoUri);

  try {
    await client.connect();
    console.log("[DB] Connected with MongoClient for vector index creation");
    const db = client.db(DB_NAME);

    for (const cfg of allDesiredVectorIndexes) {
      await ensureVectorIndex(db, cfg);
    }

    console.log("[DB] Vector Search index ensure() complete ✅");
  } catch (err) {
    console.error("[DB] Error ensuring vectorSearch indexes:", err);
    process.exitCode = 1;
  } finally {
    await client.close();
    await mongoose.disconnect();
    console.log("[DB] MongoClient and Mongoose connections closed");
  }
}

void main();
