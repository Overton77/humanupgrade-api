import { connectToDatabase } from "../db/connection.js";
import { env } from "../config/env.js";
import {
  initRedisPubSub,
  publishJson,
  CH_GLOBAL_TRENDING_INVALIDATE,
} from "../lib/redisPubSub.js";
import { computeTrendingSnapshots } from "../services/trending/computeTrendingSnapshots.js";

const INTERVAL_MS = 5 * 60 * 1000;

async function tick() {
  await computeTrendingSnapshots();
  await publishJson(CH_GLOBAL_TRENDING_INVALIDATE, {
    type: "TRENDING_INVALIDATE",
    reason: "snapshot_updated",
    createdAt: new Date().toISOString(),
  });
  console.log("✅ trending snapshots updated");
}

async function start() {
  await connectToDatabase(env.dbName);
  await initRedisPubSub();

  console.log("✅ trending worker started");
  await tick(); // run once at boot

  setInterval(() => {
    void tick().catch((err) =>
      console.error("trending worker tick failed", err)
    );
  }, INTERVAL_MS);
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
