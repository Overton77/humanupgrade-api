import type { GraphQLFormattedError } from "graphql";
import { ErrorCode, toAppError } from "../lib/errors.js";
import { logError } from "../lib/logger.js";

export function buildFormatError() {
  return (formattedError: GraphQLFormattedError, rawError: unknown) => {
    const appErr = toAppError(rawError, formattedError.message);

    const requestId =
      (formattedError.extensions?.requestId as string | undefined) ??
      (appErr.extensions.requestId as string | undefined);

    const code = appErr.extensions.code ?? ErrorCode.INTERNAL_SERVER_ERROR;
    const httpStatus = appErr.extensions.httpStatus ?? 500;

    logError(rawError, {
      graphqlError: true,
      message: formattedError.message,
      code: formattedError.extensions?.code as string | undefined,
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

    const message =
      isProd && isInternal ? "An internal error occurred" : appErr.message;

    return {
      ...formattedError,
      message,
      extensions: {
        ...formattedError.extensions,
        ...appErr.extensions,
        code,
        httpStatus,
        requestId,
        originalError: undefined,
      },
    };
  };
}
