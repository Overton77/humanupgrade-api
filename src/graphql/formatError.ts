import type { GraphQLFormattedError } from "graphql";
import { ErrorCode, toAppError } from "../lib/errors.js";
import { logError } from "../lib/logger.js";

export function buildFormatError() {
  return (formattedError: GraphQLFormattedError, rawError: unknown) => {
    // Normalize
    const appErr = toAppError(rawError, formattedError.message);

    const requestId =
      (formattedError.extensions?.requestId as string | undefined) ??
      (appErr.extensions.requestId as string | undefined);

    const code = appErr.extensions.code ?? ErrorCode.INTERNAL_SERVER_ERROR;
    const httpStatus = appErr.extensions.httpStatus ?? 500;

    // ✅ LOG THE APP ERROR (not the raw error)
    // This ensures dbProvider / neo4j / mongo payloads are included.
    logError(appErr, {
      graphqlError: true,
      graphQLMessage: formattedError.message,
      normalizedCode: code,
      httpStatus,
      path: formattedError.path ? formattedError.path.join(".") : undefined,
      requestId,
    });

    const isProd = process.env.NODE_ENV === "production";
    const isInternal =
      code === ErrorCode.INTERNAL_SERVER_ERROR ||
      code === ErrorCode.DATABASE_ERROR ||
      code === ErrorCode.EXTERNAL_SERVICE_ERROR ||
      code === ErrorCode.EMBEDDING_ERROR;

    // In prod, never leak internal details
    const message =
      isProd && isInternal ? "An internal error occurred" : appErr.message;

    /**
     * Decide what to return to the client.
     * - In prod, strip neo4j/mongo debug, strip originalError
     * - In dev, include dbProvider + neo4j/mongo payload to accelerate debugging
     */
    const baseExtensions = {
      ...formattedError.extensions,
      ...appErr.extensions,
      code,
      httpStatus,
      requestId,
      originalError: undefined,
    };

    const safeExtensions = isProd
      ? {
          ...baseExtensions,
          // Don’t leak DB payloads in prod
          dbProvider: undefined,
          neo4j: undefined,
          mongo: undefined,
        }
      : baseExtensions;

    return {
      ...formattedError,
      message,
      extensions: safeExtensions,
    };
  };
}
