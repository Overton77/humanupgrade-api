import mongoose from "mongoose";
import { TrendingSnapshot } from "../../models/TrendingSnapshot.js";
import { RecommendationCache } from "../../models/RecommendationCache.js";
import { UserActivity } from "../../models/UserActivity.js";
import { computeTrendingSnapshots } from "../trending/computeTrendingSnapshots.js";
import { computeRecommendationsForUser } from "../recommendations/computeRecommendations.js";

export type DashboardContinue =
  | {
      kind: "EPISODE";
      episodeId: string;
      timestamp?: number; // seconds
      lastActivityAt: string;
    }
  | {
      kind: "ENTITY";
      entityType: string;
      entityId: string;
      lastActivityAt: string;
    }
  | {
      kind: "NONE";
    };

export interface DashboardItem {
  entityType: string;
  entityId: string;
  score?: number;
  reasons?: string[];
}

export interface DashboardPayload {
  continue: DashboardContinue;
  trending: DashboardItem[];
  recommended: DashboardItem[];
}

const RECS_MAX_AGE_MS = 15 * 60 * 1000; // 15 min
const TRENDING_MAX_AGE_MS = 10 * 60 * 1000; // 10 min (snapshots updated by worker anyway)

function isFresh(date: Date | undefined | null, maxAgeMs: number): boolean {
  if (!date) return false;
  return Date.now() - date.getTime() <= maxAgeMs;
}

function asObjectId(id: string): mongoose.Types.ObjectId {
  return new mongoose.Types.ObjectId(id);
}

/**
 * Continue is intentionally computed on-read (fast and always correct).
 * It looks at the most recent activity for "resume episode" or "last entity viewed".
 */
export async function getContinueForUser(
  userId: string
): Promise<DashboardContinue> {
  const uid = asObjectId(userId);

  const recent = await UserActivity.find({ userId: uid })
    .select({
      eventType: 1,
      entityType: 1,
      entityId: 1,
      metadata: 1,
      createdAt: 1,
    })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean()
    .exec();

  // 1) Prefer episode resume
  for (const a of recent) {
    const createdAt = a.createdAt
      ? new Date(a.createdAt).toISOString()
      : new Date().toISOString();

    // We assume episode events store entityType/entityId = Episode
    if (a.entityType === "Episode" && a.entityId) {
      if (
        a.eventType === "PLAY_EPISODE" ||
        a.eventType === "SEEK_EPISODE" ||
        a.eventType === "OPEN_EPISODE"
      ) {
        const md = (a.metadata ?? {}) as Record<string, unknown>;
        const ts =
          typeof md.timestamp === "number"
            ? md.timestamp
            : typeof md.seconds === "number"
            ? md.seconds
            : undefined;

        return {
          kind: "EPISODE",
          episodeId: String(a.entityId),
          timestamp: ts,
          lastActivityAt: createdAt,
        };
      }
    }
  }

  // 2) Otherwise last entity view/open/click
  for (const a of recent) {
    if (!a.entityType || !a.entityId) continue;

    const createdAt = a.createdAt
      ? new Date(a.createdAt).toISOString()
      : new Date().toISOString();

    if (
      a.eventType === "VIEW_ENTITY" ||
      a.eventType === "CLICK_EVIDENCE" ||
      a.eventType === "APPLY_PROTOCOL"
    ) {
      return {
        kind: "ENTITY",
        entityType: a.entityType,
        entityId: String(a.entityId),
        lastActivityAt: createdAt,
      };
    }
  }

  return { kind: "NONE" };
}

export async function getTrending(
  window: "24h" | "7d" = "24h"
): Promise<DashboardItem[]> {
  let snap = await TrendingSnapshot.findOne({ window }).lean().exec();

  // If missing or stale, compute on-demand (safe fallback if worker isn’t running)
  if (!snap || !isFresh(snap.generatedAt, TRENDING_MAX_AGE_MS)) {
    await computeTrendingSnapshots();
    snap = await TrendingSnapshot.findOne({ window }).lean().exec();
  }

  if (!snap) return [];

  return (snap.items ?? []).map((x) => ({
    entityType: x.entityType,
    entityId: String(x.entityId),
    score: x.score,
    reasons: x.reasons ?? [],
  }));
}

export async function getRecommended(userId: string): Promise<DashboardItem[]> {
  const uid = asObjectId(userId);

  let cache = await RecommendationCache.findOne({
    userId: uid,
    goalType: undefined,
  })
    .lean()
    .exec();

  // On-demand recompute if missing or stale (works even composto w/out worker)
  if (!cache || !isFresh(cache.generatedAt, RECS_MAX_AGE_MS)) {
    await computeRecommendationsForUser(uid);
    cache = await RecommendationCache.findOne({
      userId: uid,
      goalType: undefined,
    })
      .lean()
      .exec();
  }

  if (!cache) return [];

  return (cache.items ?? []).map((x) => ({
    entityType: x.entityType,
    entityId: String(x.entityId),
    score: x.score,
    reasons: x.reasons ?? [],
  }));
}

export async function getDashboard(userId: string): Promise<DashboardPayload> {
  const [cont, trending, recs] = await Promise.all([
    getContinueForUser(userId),
    getTrending("24h"),
    getRecommended(userId),
  ]);

  return {
    continue: cont,
    trending,
    recommended: recs,
  };
}
