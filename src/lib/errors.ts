import { GraphQLError } from "graphql";
import mongoose from "mongoose";

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
  USER_NOT_FOUND = "USER_NOT_FOUND",
  BUSINESS_NOT_FOUND = "BUSINESS_NOT_FOUND",
  PRODUCT_NOT_FOUND = "PRODUCT_NOT_FOUND",
  EPISODE_NOT_FOUND = "EPISODE_NOT_FOUND",
  PERSON_NOT_FOUND = "PERSON_NOT_FOUND",
  COMPOUND_NOT_FOUND = "COMPOUND_NOT_FOUND",
  PROTOCOL_NOT_FOUND = "PROTOCOL_NOT_FOUND",
  CASE_STUDY_NOT_FOUND = "CASE_STUDY_NOT_FOUND",
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
  return new AppError(message, {
    ...extensions,
    timestamp: extensions.timestamp ?? new Date().toISOString(),
  });
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

  // If you ever want per-entity codes later, keep this helper
  entityNotFound: (code: ErrorCode, entityType: string, entityId?: string) =>
    appError(`${entityType} not found${entityId ? `: ${entityId}` : ""}`, {
      code,
      httpStatus: 404,
      entityType,
      entityId,
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

  databaseError: (message: string, originalError?: unknown) =>
    appError(message, {
      code: ErrorCode.DATABASE_ERROR,
      httpStatus: 500,
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
 * Convert any error to an AppError
 */
export function toAppError(
  error: unknown,
  defaultMessage: string = "An error occurred"
): AppError {
  if (isAppError(error)) return error;

  // Handle duplicate key errors as DUPLICATE_ENTITY (common in unique indexes)
  if (isMongoDuplicateKeyError(error)) {
    return Errors.duplicate("Entity", "duplicate key");
  }

  // Classify mongoose/mongo errors as DATABASE_ERROR
  if (isMongoOrMongooseError(error)) {
    return Errors.databaseError(defaultMessage, error);
  }

  // Fallback
  if (error instanceof Error) {
    return Errors.internalError(defaultMessage, error);
  }

  return Errors.internalError(defaultMessage, error);
}
