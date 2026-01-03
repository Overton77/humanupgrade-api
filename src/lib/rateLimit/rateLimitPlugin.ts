import type { ApolloServerPlugin } from "@apollo/server";
import type { GraphQLContext } from "../../graphql/context.js";
import { COST_BY_OPERATION } from "../operationCosts.js";
import { takeTokensTokenBucket } from "../tokenBucketRedis.js";
import { computeOperationCost } from "../graphqlCost.js";
import { Errors } from "../errors.js";

export function graphqlRedisRateLimitPlugin(): ApolloServerPlugin<GraphQLContext> {
  return {
    async requestDidStart(requestContext) {
      const ctx = requestContext.contextValue;

      // Pick the operation the client is executing (if multiple exist in the document)
      const operationName = requestContext.request.operationName ?? null;

      // Cost across ALL root fields (including fragment spreads / inline fragments)
      const { rootFields, cost } = computeOperationCost({
        document: requestContext.document,
        query: requestContext.request.query ?? null,
        operationName,
        costByRootField: COST_BY_OPERATION,
        defaultCost: 2,
      });

      // keying strategy (example)
      const key = `rl:ip:${ctx.ip ?? "unknown"}`;

      // burst capacity + refill window
      const capacity = 60;
      const windowMs = 60_000;

      const res = await takeTokensTokenBucket({
        key,
        cost,
        capacity,
        windowMs,
      });

      if (!res.allowed) {
        throw Errors.rateLimitExceeded({
          retryAfterSeconds: Math.ceil(res.retryAfterMs / 1000),
          key,

          operation: rootFields.join(","),
        });
      }

      return {};
    },
  };
}
