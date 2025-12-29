import mongoose from "mongoose";
import {
  UserActivity,
  type ActivityEventType,
  type ActivityEntityType,
  type ActivityContextSurface,
} from "../../models/UserActivity.js";
import {
  publishJson,
  chUserActivity,
  chUserDashboardInvalidate,
  CH_GLOBAL_ACTIVITY,
} from "../../lib/redisPubSub.js";
import type { GraphQLContext } from "../../graphql/context.js";

export interface LogActivityInput {
  eventType: ActivityEventType;

  entityType?: ActivityEntityType;
  entityId?: mongoose.Types.ObjectId;

  surface?: ActivityContextSurface;

  metadata?: Record<string, unknown>;
}

/**
 * One entry-point for activity logging.
 *
 * Writes to Mongo (truth), then publishes to Redis (realtime signal).
 * If Redis is down, you still keep the event log (don’t fail the user action).
 */
export async function logActivity(
  ctx: GraphQLContext,
  input: LogActivityInput
): Promise<void> {
  if (!ctx.userId) return;

  const doc = await UserActivity.create({
    userId: new mongoose.Types.ObjectId(ctx.userId),
    eventType: input.eventType,
    entityType: input.entityType,
    entityId: input.entityId,
    surface: input.surface ?? "other",
    metadata: input.metadata,
  });

  // Publish lightweight payloads (strings, not ObjectIds)
  const payload = {
    type: "ACTIVITY_EVENT" as const,
    id: doc._id.toHexString(),
    userId: ctx.userId,
    eventType: input.eventType,
    entityType: input.entityType,
    entityId: input.entityId?.toHexString(),
    surface: input.surface ?? "other",
    createdAt: doc.createdAt?.toISOString() ?? new Date().toISOString(),
  };

  // Don’t let Redis failure break mutations
  try {
    await publishJson(chUserActivity(ctx.userId), payload);
    await publishJson(chUserDashboardInvalidate(ctx.userId), {
      type: "DASHBOARD_INVALIDATE",
      userId: ctx.userId,
      reason: "activity",
      createdAt: payload.createdAt,
    });

    // Optional: global stream for admin/metrics workers
    await publishJson(CH_GLOBAL_ACTIVITY, payload);
  } catch (err) {
    // log but swallow
    // (use your logger if you want)
    // eslint-disable-next-line no-console
    console.error("logActivity redis publish failed", err);
  }
}
