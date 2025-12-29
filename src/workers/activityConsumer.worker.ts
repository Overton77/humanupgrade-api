import { connectToDatabase } from "../db/connection.js";
import { env } from "../config/env.js";
import {
  initRedisPubSub,
  redisSub,
  publishJson,
  CH_GLOBAL_ACTIVITY,
  CH_GLOBAL_TRENDING_INVALIDATE,
  chUserDashboardInvalidate,
  chUserActivity,
} from "../lib/redisPubSub.js";

/**
 * For now: just proves the pipeline works.
 * Later: call computeTrendingSnapshots() and computeRecommendationsForUser().
 */

async function start() {
  await connectToDatabase(env.dbName);
  await initRedisPubSub();

  console.log("✅ activity consumer worker started");
  await redisSub.subscribe(CH_GLOBAL_ACTIVITY, async (message) => {
    let payload: any;
    try {
      payload = JSON.parse(message);
    } catch {
      payload = { raw: message };
    }

    // 1) Debug visibility
    console.log(
      "global.activity event:",
      payload?.eventType,
      payload?.entityType,
      payload?.entityId
    );

    // 2) Warm-up: if it's a meaningful event, invalidate dashboard for that user
    // (client will refetch continue/recs)
    if (payload?.userId) {
      await publishJson(chUserDashboardInvalidate(payload.userId), {
        type: "DASHBOARD_INVALIDATE",
        userId: payload.userId,
        reason: "worker_observed_activity",
        createdAt: new Date().toISOString(),
      });
    }

    // 3) Warm-up: periodically trigger trending invalidation (placeholder)
    // In real version, compute trending snapshots first, then invalidate.
    if (
      payload?.eventType === "SAVE_ENTITY" ||
      payload?.eventType === "VIEW_ENTITY"
    ) {
      await publishJson(CH_GLOBAL_TRENDING_INVALIDATE, {
        type: "TRENDING_INVALIDATE",
        reason: "activity_signal",
        createdAt: new Date().toISOString(),
      });
    }
  });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
