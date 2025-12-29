import { RedisAsyncIterator } from "../subscriptions/redisAsyncIterator.js";
import {
  chUserActivity,
  chUserDashboardInvalidate,
  CH_GLOBAL_TRENDING_INVALIDATE,
  chUserRecommendationsReady,
} from "../../lib/redisPubSub.js";
import { type GraphQLContext } from "../context.js";
import { requireAuth } from "../../services/auth.js";

export const Subscriptions = {
  myActivity: {
    subscribe: async (parent: unknown, args: unknown, ctx: GraphQLContext) => {
      requireAuth(ctx);

      return new RedisAsyncIterator([chUserActivity(ctx.userId!)]);
    },
    resolve: (payload: unknown) => payload,
  },

  dashboardInvalidated: {
    subscribe: async (parent: unknown, args: unknown, ctx: GraphQLContext) => {
      requireAuth(ctx);

      return new RedisAsyncIterator([chUserDashboardInvalidate(ctx.userId!)]);
    },
    resolve: () => true,
  },
  trendingInvalidated: {
    subscribe: () => {
      return new RedisAsyncIterator([CH_GLOBAL_TRENDING_INVALIDATE]);
    },
    resolve: () => true,
  },
  recommendationsReady: {
    subscribe: (parent: unknown, args: unknown, ctx: GraphQLContext) => {
      requireAuth(ctx);
      return new RedisAsyncIterator([chUserRecommendationsReady(ctx.userId!)]);
    },
    resolve: () => true,
  },
};
