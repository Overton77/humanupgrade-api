import { GraphQLError } from "graphql";
import mongoose from "mongoose";
import type { Neo4jError } from "neo4j-driver";

/**
 * Error codes for the application
 */
export enum ErrorCode {
  // Authentication & Authorization
  UNAUTHENTICATED = "UNAUTHENTICATED",
  FORBIDDEN = "FORBIDDEN",
  INVALID_TOKEN = "INVALID_TOKEN",
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",

  // Not Found
  ENTITY_NOT_FOUND = "ENTITY_NOT_FOUND",

  // Validation
  VALIDATION_ERROR = "VALIDATION_ERROR",
  INVALID_INPUT = "INVALID_INPUT",
  DUPLICATE_ENTITY = "DUPLICATE_ENTITY",
  MISSING_REQUIRED_FIELD = "MISSING_REQUIRED_FIELD",

  // Business Logic
  INVALID_OPERATION = "INVALID_OPERATION",
  RELATIONSHIP_ERROR = "RELATIONSHIP_ERROR",
  OPERATION_NOT_ALLOWED = "OPERATION_NOT_ALLOWED",

  // External Services
  EMBEDDING_ERROR = "EMBEDDING_ERROR",
  DATABASE_ERROR = "DATABASE_ERROR",
  EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR",

  // Server Errors
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",

  // Rate Limit
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
}

/**
 * Extensions for GraphQL errors
 */
export interface AppErrorExtensions {
  code: ErrorCode;

  /** REST-like meaning, for client + debugging. GraphQL HTTP response often remains 200. */
  httpStatus?: number;

  field?: string;
  entityId?: string;
  entityType?: string;

  /**
   * Helps observability and tracing:
   * - distinguish Mongo vs Neo4j issues in dashboards/logs
   */
  dbProvider?: "mongo" | "neo4j" | "unknown";

  /**
   * Safe DB-specific debug payloads.
   * Keep structured so you can aggregate/filter in logs.
   */
  mongo?: Record<string, unknown>;
  neo4j?: Record<string, unknown>;

  /** Never return this to clients in formatError. */
  originalError?: unknown;

  timestamp?: string;
  requestId?: string;

  [key: string]: unknown;
}

/**
 * Custom application error class that extends GraphQLError
 */
export class AppError extends GraphQLError {
  public readonly code: ErrorCode;
  public readonly extensions: AppErrorExtensions;

  constructor(message: string, extensions: AppErrorExtensions) {
    const timestamp = new Date().toISOString();
    super(message, {
      extensions: {
        ...extensions,
        timestamp,
      },
    });

    this.name = "AppError";
    this.code = extensions.code;
    this.extensions = {
      ...extensions,
      timestamp,
    };
  }
}

/**
 * Helper: create AppError with default httpStatus if missing
 */
function appError(
  message: string,
  extensions: Omit<AppErrorExtensions, "timestamp"> & { timestamp?: string }
): AppError {
  const timestamp = extensions.timestamp ?? new Date().toISOString();
  return new AppError(message, {
    ...extensions,
    timestamp,
  } as AppErrorExtensions);
}

/**
 * ---------------------------------------
 * Neo4j Error Typing + Narrowers + Debug
 * ---------------------------------------
 */
export type Neo4jErrorLike = Partial<Neo4jError> & {
  name?: string;
  message?: string;
  code?: string;
  gqlStatus?: string;
  gqlStatusDescription?: string;
  classification?: string;
  retryable?: boolean;
  retriable?: boolean; // legacy spelling
  diagnosticRecord?: unknown;
  cause?: unknown;
};

export function isNeo4jError(error: unknown): error is Neo4jErrorLike {
  if (!error || typeof error !== "object") return false;

  const err = error as { name?: unknown; code?: unknown; gqlStatus?: unknown };

  const hasNeo4jName =
    typeof err.name === "string" &&
    (err.name === "Neo4jError" || err.name === "GQLError");

  const hasNeo4jCode =
    typeof err.code === "string" && err.code.startsWith("Neo.");

  const hasGqlStatus = typeof err.gqlStatus === "string";

  return hasNeo4jName || hasNeo4jCode || hasGqlStatus;
}

export function isNeo4jRetryable(error: unknown): boolean {
  if (!isNeo4jError(error)) return false;

  const e = error as Neo4jErrorLike;

  if (typeof e.retryable === "boolean") return e.retryable;
  if (typeof e.retriable === "boolean") return e.retriable;

  const code = e.code ?? "";
  return code.startsWith("Neo.TransientError");
}

export function isNeo4jConstraintError(error: unknown): boolean {
  if (!isNeo4jError(error)) return false;
  const code = (error as Neo4jErrorLike).code ?? "";

  return (
    code === "Neo.ClientError.Schema.ConstraintValidationFailed" ||
    code === "Neo.ClientError.Schema.ConstraintViolation"
  );
}

export function isNeo4jAuthError(error: unknown): boolean {
  if (!isNeo4jError(error)) return false;
  const code = (error as Neo4jErrorLike).code ?? "";

  return (
    code === "Neo.ClientError.Security.Unauthorized" ||
    code === "Neo.ClientError.Security.Forbidden"
  );
}

export function isNeo4jSyntaxError(error: unknown): boolean {
  if (!isNeo4jError(error)) return false;
  const code = (error as Neo4jErrorLike).code ?? "";
  return code === "Neo.ClientError.Statement.SyntaxError";
}

/**
 * Neo4j: safe debug payload for logs/tracing.
 * - Keep structured
 * - Avoid raw error objects
 */
export function neo4jErrorDebug(
  error: unknown,
  opts?: { includeDiagnosticRecord?: boolean }
): Record<string, unknown> | null {
  if (!isNeo4jError(error)) return null;

  const e = error as Neo4jErrorLike;

  return {
    neo4jCode: e.code,
    gqlStatus: e.gqlStatus,
    gqlStatusDescription: e.gqlStatusDescription,
    classification: e.classification,
    retryable: e.retryable ?? e.retriable,
    message: e.message,
    ...(opts?.includeDiagnosticRecord
      ? { diagnosticRecord: e.diagnosticRecord }
      : {}),
  };
}

/**
 * Mongo debug payload (safe-ish; avoid raw documents)
 */
export function mongoErrorDebug(
  error: unknown
): Record<string, unknown> | null {
  if (!isMongoOrMongooseError(error)) return null;

  const err = error as any;

  return {
    name: err?.name,
    code: err?.code,
    message: err?.message,
  };
}

/**
 * Toggle whether to include extra db debug fields in the GraphQL response extensions.
 * (You will still want to strip originalError in formatError.)
 */
export function includeDbDebugInResponse(): boolean {
  return process.env.NODE_ENV !== "production";
}

/**
 * Factory functions for common errors
 */
export const Errors = {
  notFound: (entityType: string, entityId?: string) =>
    appError(`${entityType} not found${entityId ? `: ${entityId}` : ""}`, {
      code: ErrorCode.ENTITY_NOT_FOUND,
      httpStatus: 404,
      entityType,
      entityId,
    }),

  rateLimitExceeded: (details?: {
    retryAfterSeconds?: number;
    key?: string;
    operation?: string;
  }) =>
    appError("Rate limit exceeded", {
      code: ErrorCode.RATE_LIMIT_EXCEEDED,
      httpStatus: 429,
      retryAfter: details?.retryAfterSeconds,
      key: details?.key,
      operation: details?.operation,
    }),

  validation: (message: string, field?: string) =>
    appError(message, {
      code: ErrorCode.VALIDATION_ERROR,
      httpStatus: 400,
      field,
    }),

  invalidInput: (message: string, field?: string) =>
    appError(message, {
      code: ErrorCode.INVALID_INPUT,
      httpStatus: 400,
      field,
    }),

  duplicate: (entityType: string, identifier: string) =>
    appError(`${entityType} already exists: ${identifier}`, {
      code: ErrorCode.DUPLICATE_ENTITY,
      httpStatus: 409,
      entityType,
    }),

  unauthenticated: (message: string = "Not authenticated") =>
    appError(message, {
      code: ErrorCode.UNAUTHENTICATED,
      httpStatus: 401,
    }),

  forbidden: (message: string = "Forbidden") =>
    appError(message, {
      code: ErrorCode.FORBIDDEN,
      httpStatus: 403,
    }),

  invalidCredentials: () =>
    appError("Invalid credentials", {
      code: ErrorCode.INVALID_CREDENTIALS,
      httpStatus: 401,
    }),

  invalidToken: () =>
    appError("Invalid token", {
      code: ErrorCode.INVALID_TOKEN,
      httpStatus: 401,
    }),

  /**
   * Database error with provider discrimination.
   *
   * Use:
   *  Errors.databaseError("Neo4j database error", err, "neo4j", neo4jErrorDebug(err))
   *  Errors.databaseError("Mongo database error", err, "mongo", mongoErrorDebug(err))
   */
  databaseError: (
    message: string,
    originalError?: unknown,
    provider: AppErrorExtensions["dbProvider"] = "unknown",
    providerDebug?: Record<string, unknown>
  ) =>
    appError(message, {
      code: ErrorCode.DATABASE_ERROR,
      httpStatus: 500,
      dbProvider: provider,
      ...(provider === "neo4j" ? { neo4j: providerDebug } : {}),
      ...(provider === "mongo" ? { mongo: providerDebug } : {}),
      originalError,
    }),

  embeddingError: (message: string, originalError?: unknown) =>
    appError(message, {
      code: ErrorCode.EMBEDDING_ERROR,
      httpStatus: 502,
      originalError,
    }),

  externalServiceError: (message: string, originalError?: unknown) =>
    appError(message, {
      code: ErrorCode.EXTERNAL_SERVICE_ERROR,
      httpStatus: 502,
      originalError,
    }),

  invalidOperation: (message: string) =>
    appError(message, {
      code: ErrorCode.INVALID_OPERATION,
      httpStatus: 400,
    }),

  relationshipError: (message: string) =>
    appError(message, {
      code: ErrorCode.RELATIONSHIP_ERROR,
      httpStatus: 400,
    }),

  operationNotAllowed: (message: string = "Operation not allowed") =>
    appError(message, {
      code: ErrorCode.OPERATION_NOT_ALLOWED,
      httpStatus: 403,
    }),

  internalError: (
    message: string = "An internal error occurred",
    originalError?: unknown
  ) =>
    appError(message, {
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      httpStatus: 500,
      originalError,
    }),
};

/**
 * Check if an error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Narrow: Mongo duplicate key
 */
function isMongoDuplicateKeyError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const err = error as { code?: unknown };
  return err.code === 11000;
}

/**
 * Narrow: Mongoose/Mongo error
 */
function isMongoOrMongooseError(error: unknown): boolean {
  if (error instanceof mongoose.Error) return true;
  if (!error || typeof error !== "object") return false;

  const err = error as { name?: unknown };
  return (
    typeof err.name === "string" &&
    (err.name.includes("Mongo") || err.name.includes("Mongoose"))
  );
}

/**
 * Convert arbitrary thrown errors into AppError with observability-friendly extensions.
 */
export function toAppError(
  error: unknown,
  defaultMessage: string = "An error occurred"
): AppError {
  if (isAppError(error)) return error;

  // Mongo duplicate key -> DUPLICATE_ENTITY
  if (isMongoDuplicateKeyError(error)) {
    return Errors.duplicate("Entity", "duplicate key");
  }

  // Mongo/Mongoose -> DATABASE_ERROR with provider + debug
  if (isMongoOrMongooseError(error)) {
    const debug = mongoErrorDebug(error) ?? undefined;
    return Errors.databaseError(defaultMessage, error, "mongo", debug);
  }

  // Neo4j -> map common cases + include structured Neo4j debug payload
  if (isNeo4jError(error)) {
    const debug =
      neo4jErrorDebug(error, {
        includeDiagnosticRecord: includeDbDebugInResponse(),
      }) ?? undefined;

    // Constraint violations -> DUPLICATE_ENTITY (with neo4j debug info)
    if (isNeo4jConstraintError(error)) {
      return appError("Constraint violation", {
        code: ErrorCode.DUPLICATE_ENTITY,
        httpStatus: 409,
        dbProvider: "neo4j",
        neo4j: debug,
        originalError: error,
      });
    }

    // Auth errors -> UNAUTHENTICATED / FORBIDDEN
    if (isNeo4jAuthError(error)) {
      const neoCode = (error as Neo4jErrorLike).code ?? "";
      if (neoCode === "Neo.ClientError.Security.Forbidden") {
        return appError("Neo4j forbidden", {
          code: ErrorCode.FORBIDDEN,
          httpStatus: 403,
          dbProvider: "neo4j",
          neo4j: debug,
          originalError: error,
        });
      }
      return appError("Neo4j unauthorized", {
        code: ErrorCode.UNAUTHENTICATED,
        httpStatus: 401,
        dbProvider: "neo4j",
        neo4j: debug,
        originalError: error,
      });
    }

    // Syntax / invalid cypher -> INVALID_INPUT
    if (isNeo4jSyntaxError(error)) {
      return appError("Cypher syntax error", {
        code: ErrorCode.INVALID_INPUT,
        httpStatus: 400,
        dbProvider: "neo4j",
        neo4j: debug,
        originalError: error,
      });
    }

    // Retryable / transient -> DATABASE_ERROR but keep neo4j metadata
    if (isNeo4jRetryable(error)) {
      return Errors.databaseError(
        "Neo4j transient error",
        error,
        "neo4j",
        debug
      );
    }

    // General Neo4j DB error
    return Errors.databaseError("Neo4j database error", error, "neo4j", debug);
  }

  // Fallback
  if (error instanceof Error) {
    return Errors.internalError(defaultMessage, error);
  }

  return Errors.internalError(defaultMessage, error);
}
