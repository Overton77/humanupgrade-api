// workers/recommendationsWorker.ts
import mongoose from "mongoose";
import { connectToDatabase } from "../db/connection.js";
import { env } from "../config/env.js";
import {
  initRedisPubSub,
  publishJson,
  chUserRecommendationsReady,
  chUserDashboardInvalidate,
  redisSub,
  CH_GLOBAL_ACTIVITY,
} from "../lib/redisPubSub.js";
import {
  UserActivity,
  type ActivityEventType,
} from "../models/UserActivity.js";
import { computeRecommendationsForUser } from "../services/recommendations/computeRecommendations.js";

/**
 * This worker supports TWO modes:
 * 1) Interval batch recompute (safety net): every INTERVAL_MS recompute for users active in last ACTIVE_USER_WINDOW_MS
 * 2) Event-driven recompute (fast path): subscribe to global.activity and recompute immediately for "strong" events
 *
 * Keeping both makes the system robust:
 * - event-driven gives instant updates
 * - interval catches missed events / restarts / edge cases
 */

const INTERVAL_MS = 10 * 60 * 1000; // 10m
const ACTIVE_USER_WINDOW_MS = 6 * 60 * 60 * 1000; // 6h

// Debounce event-driven recomputes to avoid thrashing
const EVENT_RECOMPUTE_DEBOUNCE_MS = 1500;

// safety cap: avoid unbounded concurrency/CPU
const MAX_EVENT_RECOMPUTES_IN_FLIGHT = 3;

type ActivityEventPayload = {
  type: "ACTIVITY_EVENT";
  id: string;
  userId: string;
  eventType: ActivityEventType;
  entityType?: string;
  entityId?: string;
  surface?: string;
  createdAt?: string;
};

const STRONG_RECOMPUTE_EVENTS: ReadonlySet<ActivityEventType> = new Set([
  // profile/config changes affect goal priors + filtering immediately
  "UPSERT_USER_PROFILE",

  // preference signals should reflect quickly
  "SAVE_ENTITY",
  "UNSAVE_ENTITY",
  "LIKE_ENTITY",
  "HIDE_ENTITY",
  "BLOCK_ENTITY",

  // user content changes may affect continue/recommended views
  "CREATE_USER_PROTOCOL",
  "UPDATE_USER_PROTOCOL",

  // Optional: if you want to reflect "APPLY_PROTOCOL" quickly:
  "APPLY_PROTOCOL",
]);

// Simple concurrency limiter for event-driven recomputes
let inFlight = 0;
const queue: Array<() => Promise<void>> = [];

function enqueue(job: () => Promise<void>) {
  queue.push(job);
  void pump();
}

async function pump() {
  while (inFlight < MAX_EVENT_RECOMPUTES_IN_FLIGHT && queue.length > 0) {
    const job = queue.shift()!;
    inFlight += 1;
    void job()
      .catch((err) => console.error("event recompute job failed", err))
      .finally(() => {
        inFlight -= 1;
        void pump();
      });
  }
}

/**
 * Shared recompute + publish notifications.
 * Used by BOTH interval tick and event-driven triggers.
 */
async function recomputeAndNotify(
  userId: mongoose.Types.ObjectId,
  reason: string
) {
  await computeRecommendationsForUser(userId);

  const userIdStr = userId.toHexString();

  // Notify clients listening for "ready"
  await publishJson(chUserRecommendationsReady(userIdStr), {
    type: "RECOMMENDATIONS_READY",
    userId: userIdStr,
    reason,
    createdAt: new Date().toISOString(),
  });

  // Optional: dashboard refetch / invalidate
  await publishJson(chUserDashboardInvalidate(userIdStr), {
    type: "DASHBOARD_INVALIDATE",
    userId: userIdStr,
    reason,
    createdAt: new Date().toISOString(),
  });
}

/**
 * Interval-based fallback: recompute for all users with any activity in last ACTIVE_USER_WINDOW_MS.
 */
async function tick() {
  const since = new Date(Date.now() - ACTIVE_USER_WINDOW_MS);

  const rows = await UserActivity.aggregate<{ _id: mongoose.Types.ObjectId }>([
    { $match: { createdAt: { $gte: since } } },
    { $group: { _id: "$userId" } },
    { $limit: 2000 }, // safety cap
  ]);

  const userIds = rows.map((r) => r._id).filter(Boolean);

  console.log(`🔁 interval recompute for ${userIds.length} active users`);

  for (const userId of userIds) {
    try {
      await recomputeAndNotify(userId, "interval:active_users");
    } catch (err) {
      console.error("interval recompute failed for user", String(userId), err);
    }
  }
}

/**
 * Event-driven: subscribe to global.activity and recompute immediately for strong events.
 * This makes profile updates / saves feel instant.
 */
function startActivitySubscription() {
  // Debounce per user to avoid repeated recompute in a short burst
  const pending = new Map<string, NodeJS.Timeout>();

  const schedule = (userIdStr: string, reason: string) => {
    const existing = pending.get(userIdStr);
    if (existing) clearTimeout(existing);

    pending.set(
      userIdStr,
      setTimeout(() => {
        pending.delete(userIdStr);

        // Validate ObjectId string
        if (!mongoose.isValidObjectId(userIdStr)) {
          console.warn("Skipping recompute: invalid userId", userIdStr);
          return;
        }

        enqueue(async () => {
          try {
            await recomputeAndNotify(
              new mongoose.Types.ObjectId(userIdStr),
              reason
            );
          } catch (err) {
            console.error("event-driven recompute failed", userIdStr, err);
          }
        });
      }, EVENT_RECOMPUTE_DEBOUNCE_MS)
    );
  };

  // Subscribe using redisSub (already connected by initRedisPubSub)
  void redisSub.subscribe(CH_GLOBAL_ACTIVITY, (message) => {
    let evt: ActivityEventPayload | null = null;

    try {
      evt = JSON.parse(message) as ActivityEventPayload;
    } catch (err) {
      console.warn("Ignoring non-JSON activity message", err);
      return;
    }

    if (!evt || evt.type !== "ACTIVITY_EVENT") return;
    if (!evt.userId || !evt.eventType) return;

    if (!STRONG_RECOMPUTE_EVENTS.has(evt.eventType)) {
      // Not a strong trigger; interval tick will cover it.
      return;
    }

    schedule(evt.userId, `activity:${evt.eventType}`);
  });

  console.log(
    `👂 subscribed to ${CH_GLOBAL_ACTIVITY} (event-driven recompute enabled)`
  );
}

async function start() {
  await connectToDatabase(env.dbName);
  await initRedisPubSub();

  console.log("✅ recommendations worker started");

  // Fast path: react immediately to user changes (profile saves, etc.)
  startActivitySubscription();

  // Fallback: interval recompute
  await tick(); // run once at boot

  setInterval(() => {
    void tick().catch((err) =>
      console.error("recommendations worker tick failed", err)
    );
  }, INTERVAL_MS);
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
