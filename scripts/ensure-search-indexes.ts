import { ensureSearchIndexes } from "../src/db/neo4j/ensureSearchIndexes.js";

async function main() {
  await ensureSearchIndexes({
    vectorDimensions: Number(process.env.NEO4J_VECTOR_DIM ?? "1536"),
    vectorSimilarityFunction: "cosine",
    includeSearchTextInFulltext: true,
    includeIsActivePropertyIndexes: true,

    tolerateVectorIndexErrors: false,
    awaitOnline: true,
  });

  // eslint-disable-next-line no-console
  console.log("✅ Search indexes ensured.");
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
