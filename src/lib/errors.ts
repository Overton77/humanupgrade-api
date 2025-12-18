import { GraphQLError } from "graphql";

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
  field?: string;
  entityId?: string;
  entityType?: string;
  originalError?: unknown;
  timestamp?: string;
  requestId?: string;
  [key: string]: unknown; // Index signature for GraphQL compatibility
}

/**
 * Custom application error class that extends GraphQLError
 */
export class AppError extends GraphQLError {
  public readonly code: ErrorCode;
  public readonly extensions: AppErrorExtensions;

  constructor(message: string, extensions: AppErrorExtensions) {
    super(message, {
      extensions: {
        ...extensions,
        timestamp: new Date().toISOString(),
      },
    });
    this.name = "AppError";
    this.code = extensions.code;
    this.extensions = {
      ...extensions,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Factory functions for common errors
 */
export const Errors = {
  notFound: (entityType: string, entityId?: string) =>
    new AppError(`${entityType} not found${entityId ? `: ${entityId}` : ""}`, {
      code: ErrorCode.ENTITY_NOT_FOUND,
      entityType,
      entityId,
    }),

  validation: (message: string, field?: string) =>
    new AppError(message, {
      code: ErrorCode.VALIDATION_ERROR,
      field,
    }),

  invalidInput: (message: string, field?: string) =>
    new AppError(message, {
      code: ErrorCode.INVALID_INPUT,
      field,
    }),

  duplicate: (entityType: string, identifier: string) =>
    new AppError(`${entityType} already exists: ${identifier}`, {
      code: ErrorCode.DUPLICATE_ENTITY,
      entityType,
    }),

  unauthenticated: (message: string = "Not authenticated") =>
    new AppError(message, {
      code: ErrorCode.UNAUTHENTICATED,
    }),

  forbidden: (message: string = "Forbidden") =>
    new AppError(message, {
      code: ErrorCode.FORBIDDEN,
    }),

  invalidCredentials: () =>
    new AppError("Invalid credentials", {
      code: ErrorCode.INVALID_CREDENTIALS,
    }),

  invalidToken: () =>
    new AppError("Invalid token", {
      code: ErrorCode.INVALID_TOKEN,
    }),

  databaseError: (message: string, originalError?: unknown) =>
    new AppError(message, {
      code: ErrorCode.DATABASE_ERROR,
      originalError,
    }),

  embeddingError: (message: string, originalError?: unknown) =>
    new AppError(message, {
      code: ErrorCode.EMBEDDING_ERROR,
      originalError,
    }),

  externalServiceError: (message: string, originalError?: unknown) =>
    new AppError(message, {
      code: ErrorCode.EXTERNAL_SERVICE_ERROR,
      originalError,
    }),

  invalidOperation: (message: string) =>
    new AppError(message, {
      code: ErrorCode.INVALID_OPERATION,
    }),

  relationshipError: (message: string) =>
    new AppError(message, {
      code: ErrorCode.RELATIONSHIP_ERROR,
    }),

  internalError: (
    message: string = "An internal error occurred",
    originalError?: unknown
  ) =>
    new AppError(message, {
      code: ErrorCode.INTERNAL_SERVER_ERROR,
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
 * Convert any error to an AppError
 */
export function toAppError(
  error: unknown,
  defaultMessage: string = "An error occurred"
): AppError {
  if (isAppError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return Errors.internalError(defaultMessage, error);
  }

  return Errors.internalError(defaultMessage, error);
}
