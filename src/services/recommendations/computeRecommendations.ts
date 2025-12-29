import mongoose from "mongoose";
import { RecommendationCache } from "../../models/RecommendationCache.js";
import { TrendingSnapshot } from "../../models/TrendingSnapshot.js";
import { UserActivity } from "../../models/UserActivity.js";
import { UserProfile } from "../../models/UserProfile.js";
import { UserSaved } from "../../models/UserSaved.js";
import { Protocol } from "../../models/Protocol.js";
import type { GoalType } from "../../models/goalTypes.js";
import {
  activityWeights,
  BASE_SAVED_WEIGHT,
  GOAL_PRIOR_PER_PRIORITY_POINT,
  GOAL_MATCH_BONUS,
  MAX_PROTOCOL_GOAL_SEED,
  MAX_ITEMS,
  TRENDING_PRIOR_CAP,
} from "./activityWeights.js";

type CandidateKey = string;

function key(
  entityType: string,
  entityId: mongoose.Types.ObjectId
): CandidateKey {
  return `${entityType}:${entityId.toHexString()}`;
}

/**
 * Compute Recommendations:
 * 1) Seed candidates with goal-aligned SYSTEM Protocols (personalized prior from profile goals)
 * 2) Add personalization signals (Saved, Recent Activity, Trending) for ALL entity types
 * 3) Expand from candidates -> related entities using MIRROR fields (canonical owners),
 *    relying on your "Canonical + Mirror Sync Plan"
 * 4) Rank, filter blocked/hidden, write RecommendationCache
 */
export async function computeRecommendationsForUser(
  userId: mongoose.Types.ObjectId
): Promise<void> {
  // 1) Load profile + trending snapshot in parallel
  const [profile, trending24h] = await Promise.all([
    UserProfile.findOne({ userId }).lean().exec(),
    TrendingSnapshot.findOne({ window: "24h" }).lean().exec(),
  ]);

  // 2) Fast lookup sets for blocked/hidden
  const blocked = new Set<string>(
    (profile?.entityPreferences?.blockedEntityIds ?? []).map((x) =>
      (x as mongoose.Types.ObjectId).toHexString()
    )
  );
  const hidden = new Set<string>(
    (profile?.entityPreferences?.hiddenEntityIds ?? []).map((x) =>
      (x as mongoose.Types.ObjectId).toHexString()
    )
  );

  function isHiddenOrBlocked(entityId: mongoose.Types.ObjectId): boolean {
    const idStr = entityId.toHexString();
    return blocked.has(idStr) || hidden.has(idStr);
  }

  // 3) goalType -> priority map
  const userGoalPriority = new Map<GoalType, number>();
  for (const g of profile?.goals ?? []) {
    if (!g?.goalType) continue;
    userGoalPriority.set(g.goalType, Number(g.priority ?? 0));
  }
  const userGoalTypes: GoalType[] = Array.from(userGoalPriority.keys());

  // 4) Candidate map + upsert helper
  const candidates = new Map<
    CandidateKey,
    {
      entityType: string;
      entityId: mongoose.Types.ObjectId;
      score: number;
      reasons: string[];
    }
  >();

  function upsertCandidate(params: {
    entityType: string;
    entityId: mongoose.Types.ObjectId;
    deltaScore: number;
    reason: string;
  }) {
    if (isHiddenOrBlocked(params.entityId)) return;

    const k = key(params.entityType, params.entityId);
    const existing = candidates.get(k);

    if (existing) {
      existing.score += params.deltaScore;
      existing.reasons.push(params.reason);
      return;
    }

    candidates.set(k, {
      entityType: params.entityType,
      entityId: params.entityId,
      score: params.deltaScore,
      reasons: [params.reason],
    });
  }

  // -----------------------------
  // 1) Seed: goal-aligned SYSTEM Protocols (prior)
  // -----------------------------
  if (userGoalTypes.length > 0) {
    const goalProtocols = await Protocol.find({
      categories: { $in: userGoalTypes },
    })
      .select({ categories: 1 })
      .lean()
      .limit(MAX_PROTOCOL_GOAL_SEED)
      .exec();

    for (const p of goalProtocols) {
      const categories = (p as any).categories ?? [];

      let prioritySum = 0;
      let matchCount = 0;

      for (const cat of categories) {
        const pr = userGoalPriority.get(cat as GoalType);
        if (pr && pr > 0) {
          prioritySum += pr;
          matchCount += 1;
        }
      }

      if (prioritySum <= 0) continue;

      const goalPrior =
        prioritySum * GOAL_PRIOR_PER_PRIORITY_POINT +
        matchCount * GOAL_MATCH_BONUS;

      upsertCandidate({
        entityType: "Protocol",
        entityId: p._id as unknown as mongoose.Types.ObjectId,
        deltaScore: goalPrior,
        reason: `goalPrior:+${goalPrior}`,
      });

      // A little explainability (cap it)
      const matchedCats = categories
        .filter((c: string) => userGoalPriority.has(c as GoalType))
        .slice(0, 4);

      const ck = key("Protocol", p._id as unknown as mongoose.Types.ObjectId);
      const bucket = candidates.get(ck);
      if (bucket) {
        for (const c of matchedCats) {
          const pr = userGoalPriority.get(c as GoalType) ?? 0;
          bucket.reasons.push(`goal:${c}(p=${pr})`);
        }
      }
    }
  }

  // -----------------------------
  // 2) Saved entities (strong signal)
  // -----------------------------
  const saved = await UserSaved.find({ userId })
    .select({ "targetRef.type": 1, "targetRef.id": 1 })
    .lean()
    .exec();

  for (const s of saved ?? []) {
    const entityType = s?.targetRef?.type;
    const entityId = s?.targetRef?.id;
    if (!entityType || !entityId) continue;

    upsertCandidate({
      entityType,
      entityId,
      deltaScore: BASE_SAVED_WEIGHT,
      reason: "saved",
    });
  }

  // -----------------------------
  // 3) Recent activity (implicit signal)
  // -----------------------------
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recent = await UserActivity.find({
    userId,
    createdAt: { $gte: since },
    entityType: { $exists: true, $ne: null },
    entityId: { $exists: true, $ne: null },
    eventType: {
      $in: [
        "VIEW_ENTITY",
        "CLICK_EVIDENCE",
        "OPEN_EPISODE",
        "PLAY_EPISODE",
        "APPLY_PROTOCOL",
      ],
    },
  })
    .select({ entityType: 1, entityId: 1, eventType: 1 })
    .sort({ createdAt: -1 })
    .limit(200)
    .lean()
    .exec();

  for (const a of recent ?? []) {
    if (!a.entityType || !a.entityId) continue;

    upsertCandidate({
      entityType: a.entityType,
      entityId: a.entityId,
      deltaScore: activityWeights[a.eventType] ?? 1,
      reason: `activity:${a.eventType}`,
    });
  }

  // -----------------------------
  // 4) Trending prior (global)
  // -----------------------------
  for (const item of trending24h?.items ?? []) {
    if (!item?.entityType || !item?.entityId) continue;

    const delta = Math.min(TRENDING_PRIOR_CAP, item.score / 10);

    upsertCandidate({
      entityType: item.entityType,
      entityId: item.entityId as unknown as mongoose.Types.ObjectId,
      deltaScore: delta,
      reason: "trending24h",
    });
  }

  // 5) Expansion: use MIRROR fields owned by the mirror side (your sync plan)

  const seed = {
    Product: [] as mongoose.Types.ObjectId[],
    Compound: [] as mongoose.Types.ObjectId[],
    Protocol: [] as mongoose.Types.ObjectId[],
    Episode: [] as mongoose.Types.ObjectId[],
    Business: [] as mongoose.Types.ObjectId[],
    Person: [] as mongoose.Types.ObjectId[],
  };

  for (const c of candidates.values()) {
    if (c.entityType === "Product") seed.Product.push(c.entityId);
    else if (c.entityType === "Compound") seed.Compound.push(c.entityId);
    else if (c.entityType === "Protocol") seed.Protocol.push(c.entityId);
    else if (c.entityType === "Episode") seed.Episode.push(c.entityId);
    else if (c.entityType === "Business") seed.Business.push(c.entityId);
    else if (c.entityType === "Person") seed.Person.push(c.entityId);
  }

  // Load mirror-side documents in parallel (each query is independent).
  // NOTE: doing dynamic imports so this file doesn't create circular deps.
  const [
    productMirrorRows,
    compoundMirrorRows,
    protocolRows,
    businessRows,
    personRows,
  ] = await Promise.all([
    seed.Product.length > 0
      ? (async () => {
          const { Product } = await import("../../models/Product.js");
          return Product.find({ _id: { $in: seed.Product } })
            .select({ compoundIds: 1, businessId: 1, protocolIds: 1 })
            .lean()
            .exec();
        })()
      : Promise.resolve([]),

    seed.Compound.length > 0
      ? (async () => {
          const { Compound } = await import("../../models/Compound.js");
          return Compound.find({ _id: { $in: seed.Compound } })
            .select({ protocolIds: 1, productIds: 1 })
            .lean()
            .exec();
        })()
      : Promise.resolve([]),

    seed.Protocol.length > 0
      ? Protocol.find({ _id: { $in: seed.Protocol } })
          .select({ productIds: 1, compoundIds: 1 })
          .lean()
          .exec()
      : Promise.resolve([]),

    seed.Business.length > 0
      ? (async () => {
          const { Business } = await import("../../models/Business.js");
          return Business.find({ _id: { $in: seed.Business } })
            .select({
              productIds: 1,
              sponsorEpisodeIds: 1,
              ownerIds: 1,
              "executives.personId": 1,
            })
            .lean()
            .exec();
        })()
      : Promise.resolve([]),

    // Person mirror: episodeIds + businessIds (mirrors owned by Person)
    seed.Person.length > 0
      ? (async () => {
          const { Person } = await import("../../models/Person.js");
          return Person.find({ _id: { $in: seed.Person } })
            .select({
              episodeIds: 1, // mirror: episodes for person
              businessIds: 1, // mirror: businesses for person
            })
            .lean()
            .exec();
        })()
      : Promise.resolve([]),
  ]);

  // Apply expansions (cheap in-memory loops)
  // Product seeds -> Business, Compound, Protocol (mirror)
  for (const r of productMirrorRows as any[]) {
    if (r.businessId) {
      upsertCandidate({
        entityType: "Business",
        entityId: r.businessId,
        deltaScore: 4,
        reason: "expand:Product->Business",
      });
    }

    for (const cid of r.compoundIds ?? []) {
      upsertCandidate({
        entityType: "Compound",
        entityId: cid,
        deltaScore: 4,
        reason: "expand:Product->Compound",
      });
    }

    for (const pid of r.protocolIds ?? []) {
      upsertCandidate({
        entityType: "Protocol",
        entityId: pid,
        deltaScore: 3,
        reason: "expand:Product->Protocol(mirror)",
      });
    }
  }

  // Compound seeds -> Protocol (mirror) + Product (mirror)
  for (const r of compoundMirrorRows as any[]) {
    for (const pid of r.protocolIds ?? []) {
      upsertCandidate({
        entityType: "Protocol",
        entityId: pid,
        deltaScore: 3,
        reason: "expand:Compound->Protocol(mirror)",
      });
    }

    for (const prodId of r.productIds ?? []) {
      upsertCandidate({
        entityType: "Product",
        entityId: prodId,
        deltaScore: 2,
        reason: "expand:Compound->Product(mirror)",
      });
    }
  }

  for (const r of protocolRows as any[]) {
    for (const pid of r.productIds ?? []) {
      upsertCandidate({
        entityType: "Product",
        entityId: pid,
        deltaScore: 2,
        reason: "expand:Protocol->Product(canonical)",
      });
    }
    for (const cid of r.compoundIds ?? []) {
      upsertCandidate({
        entityType: "Compound",
        entityId: cid,
        deltaScore: 2,
        reason: "expand:Protocol->Compound(canonical)",
      });
    }
  }

  for (const r of businessRows as any[]) {
    for (const pid of r.productIds ?? []) {
      upsertCandidate({
        entityType: "Product",
        entityId: pid,
        deltaScore: 2,
        reason: "expand:Business->Product(mirror)",
      });
    }

    for (const eid of r.sponsorEpisodeIds ?? []) {
      upsertCandidate({
        entityType: "Episode",
        entityId: eid,
        deltaScore: 2,
        reason: "expand:Business->SponsorEpisode(mirror)",
      });
    }

    for (const oid of r.ownerIds ?? []) {
      upsertCandidate({
        entityType: "Person",
        entityId: oid,
        deltaScore: 2,
        reason: "expand:Business->Owner(canonical)",
      });
    }
    for (const e of r.executives ?? []) {
      if (!e?.personId) continue;
      upsertCandidate({
        entityType: "Person",
        entityId: e.personId,
        deltaScore: 2,
        reason: "expand:Business->Executive(canonical)",
      });
    }
  }

  for (const r of personRows as any[]) {
    for (const eid of r.episodeIds ?? []) {
      upsertCandidate({
        entityType: "Episode",
        entityId: eid,
        deltaScore: 2,
        reason: "expand:Person->Episode(mirror)",
      });
    }
    for (const bid of r.businessIds ?? []) {
      upsertCandidate({
        entityType: "Business",
        entityId: bid,
        deltaScore: 2,
        reason: "expand:Person->Business(mirror)",
      });
    }
  }

  // -----------------------------
  // 6) Final rank + write cache
  // -----------------------------
  const items = Array.from(candidates.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_ITEMS)
    .map((x) => ({
      entityType: x.entityType,
      entityId: x.entityId,
      score: x.score,
      reasons: Array.from(new Set(x.reasons)).slice(0, 10),
    }));

  await RecommendationCache.findOneAndUpdate(
    { userId, goalType: undefined },
    { $set: { userId, goalType: undefined, generatedAt: new Date(), items } },
    { upsert: true, new: true }
  ).exec();
}
