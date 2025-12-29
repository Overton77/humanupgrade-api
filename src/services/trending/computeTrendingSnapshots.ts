import { UserActivity } from "../../models/UserActivity.js";
import {
  TrendingSnapshot,
  type TrendingWindow,
} from "../../models/TrendingSnapshot.js";
import { EVENT_WEIGHTS } from "./eventWeights.js";

// how many items to keep total (across all types)
const TOP_N = 50;

function windowToMs(window: TrendingWindow): number {
  if (window === "24h") return 24 * 60 * 60 * 1000;
  return 7 * 24 * 60 * 60 * 1000;
}

export async function computeTrendingSnapshot(
  window: TrendingWindow
): Promise<void> {
  const now = new Date();
  const since = new Date(now.getTime() - windowToMs(window));

  // Aggregate activity into weighted scores per (entityType, entityId)
  const results = await UserActivity.aggregate<{
    _id: { entityType: string; entityId: any };
    score: number;
    countsByType: Record<string, number>;
  }>([
    {
      $match: {
        createdAt: { $gte: since },
        entityType: { $exists: true, $ne: null },
        entityId: { $exists: true, $ne: null },
        eventType: { $in: Object.keys(EVENT_WEIGHTS) },
      },
    },
    {
      $group: {
        _id: { entityType: "$entityType", entityId: "$entityId" },
        counts: { $push: "$eventType" },
      },
    },
    {
      $addFields: {
        countsByType: {
          $arrayToObject: {
            $map: {
              input: Object.keys(EVENT_WEIGHTS),
              as: "t",
              in: [
                "$$t",
                {
                  $size: {
                    $filter: {
                      input: "$counts",
                      as: "x",
                      cond: { $eq: ["$$x", "$$t"] },
                    },
                  },
                },
              ],
            },
          },
        },
      },
    },
    {
      $addFields: {
        score: {
          $sum: Object.entries(EVENT_WEIGHTS).map(([eventType, w]) => ({
            $multiply: [
              { $getField: { field: eventType, input: "$countsByType" } },
              w,
            ],
          })),
        },
      },
    },
    { $sort: { score: -1 } },
    { $limit: TOP_N },
  ]);

  const items = results.map((r) => {
    const reasons: string[] = [];
    for (const [k, v] of Object.entries(r.countsByType ?? {})) {
      if (v > 0) reasons.push(`${k}:${v}`);
    }

    return {
      entityType: r._id.entityType,
      entityId: r._id.entityId,
      score: r.score,
      reasons,
    };
  });

  await TrendingSnapshot.findOneAndUpdate(
    { window },
    { $set: { window, generatedAt: now, items } },
    { upsert: true, new: true }
  ).exec();
}

export async function computeTrendingSnapshots(): Promise<void> {
  await computeTrendingSnapshot("24h");
  await computeTrendingSnapshot("7d");
}
