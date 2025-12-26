import type { ApolloServerPlugin } from "@apollo/server";
import type { GraphQLContext } from "../../graphql/context.js";
import {
  parse,
  Kind,
  type DocumentNode,
  type OperationDefinitionNode,
} from "graphql";
import { COST_BY_OPERATION } from "../operationCosts.js";
import { takeTokens } from "./graphqlRateLimit.js";
import { Errors } from "../errors.js";

function getOperationDefinition(
  doc: DocumentNode,
  operationName?: string | null
): OperationDefinitionNode | undefined {
  const ops = doc.definitions.filter(
    (d): d is OperationDefinitionNode => d.kind === Kind.OPERATION_DEFINITION
  );

  if (ops.length === 0) return undefined;

  if (!operationName) return ops[0];

  return ops.find((op) => op.name?.value === operationName) ?? ops[0];
}

function getRootFieldName(params: {
  document?: DocumentNode | null;
  query?: string | null;
  operationName?: string | null;
}): string {
  const { document, query, operationName } = params;

  let doc = document ?? undefined;
  if (!doc && query) {
    try {
      doc = parse(query);
    } catch {
      return "anonymous";
    }
  }
  if (!doc) return "anonymous";

  const opDef = getOperationDefinition(doc, operationName);
  if (!opDef) return "anonymous";

  const firstSelection = opDef.selectionSet.selections[0];
  if (!firstSelection || firstSelection.kind !== Kind.FIELD) return "anonymous";

  return firstSelection.name.value || "anonymous";
}

export function graphqlRateLimitPlugin(): ApolloServerPlugin<GraphQLContext> {
  return {
    async requestDidStart(requestContext) {
      const ctx = requestContext.contextValue;

      const operationName = requestContext.request.operationName ?? null;

      const rootField = getRootFieldName({
        document: requestContext.document,
        query: requestContext.request.query ?? null,
        operationName,
      });

      const isAdmin = ctx.role === "admin";

      const key = ctx.userId ? `user:${ctx.userId}` : `ip:${ctx.ip}`;

      const cost = COST_BY_OPERATION[rootField] ?? 2;

      const capacity = isAdmin ? 25_000 : ctx.userId ? 200 : 60;
      const windowMs = 60_000;

      const res = takeTokens({ key, cost, capacity, windowMs });

      if (!res.allowed) {
        throw Errors.rateLimitExceeded({
          retryAfterSeconds: Math.ceil((res.retryAfterMs ?? windowMs) / 1000),
          key,
          operation: rootField,
        });
      }

      return {};
    },
  };
}
