import { QdrantClient } from "@qdrant/qdrant-js";
import { env } from "../config/env";

/**
 * Payload stored alongside vectors in Qdrant.
 * This is your "Human Upgrade" metadata.
 */
export type HumanUpgradePayload = {
  kind: "episode" | "product" | "compound" | "case-study" | "blog";
  refId: string; // Mongo _id or slug

  // nice-to-have search attributes
  episodeNumber?: number;
  guestName?: string;
  productName?: string;
  intervention?: string;
  text: string; // original chunk text
};

let client: QdrantClient | null = null;

export function getQdrantClient(): QdrantClient {
  if (!client) {
    client = new QdrantClient({
      url: env.qdrantUrl,
      apiKey: env.qdrantApiKey || undefined,
    });
  }
  return client;
}

/**
 * Ensure the collection exists with correct vector size.
 * Idempotent: safe to call on startup.
 */
export async function ensureHumanUpgradeCollection(): Promise<void> {
  const client = getQdrantClient();
  const collectionName = env.qdrantCollectionName;

  const collections = await client.getCollections();
  const exists = collections.collections?.some(
    (c) => c.name === collectionName
  );

  if (exists) return;

  await client.createCollection(collectionName, {
    vectors: {
      size: env.qdrantVectorDimension,
      distance: "Cosine",
    },
  });

  console.log(
    `[Qdrant] Created collection "${collectionName}" with dim=${env.qdrantVectorDimension}`
  );
}

/**
 * Upsert multiple points (vectors + payload) into Qdrant.
 */
export async function upsertHumanUpgradePoints(
  points: Array<{
    id: string | number;
    vector: number[];
    payload: HumanUpgradePayload;
  }>
): Promise<void> {
  const client = getQdrantClient();
  const collectionName = env.qdrantCollectionName;

  await ensureHumanUpgradeCollection();

  await client.upsert(collectionName, {
    wait: true,
    points: points.map((p) => ({
      id: p.id,
      vector: p.vector,
      payload: p.payload,
    })),
  });
}

/**
 * Search Qdrant for nearest neighbors.
 */
export async function searchHumanUpgrade(
  queryVector: number[],
  options: {
    topK?: number;
    kindFilter?: HumanUpgradePayload["kind"] | HumanUpgradePayload["kind"][];
  } = {}
) {
  const client = getQdrantClient();
  const collectionName = env.qdrantCollectionName;

  const { topK = 10, kindFilter } = options;

  const filter =
    kindFilter != null
      ? {
          must: [
            {
              key: "kind",
              match: {
                value: Array.isArray(kindFilter) ? undefined : kindFilter,
                any: Array.isArray(kindFilter) ? kindFilter : undefined,
              },
            },
          ],
        }
      : undefined;

  const result = await client.search(collectionName, {
    vector: queryVector,
    limit: topK,
    filter,
    with_payload: true,
    with_vector: false,
  });

  const matches = result as unknown as {
    result: Array<{
      id: string | number;
      score: number;
      payload?: HumanUpgradePayload;
    }>;
  };

  return matches.result;
}

ensureHumanUpgradeCollection().then((result) => console.log(result));
