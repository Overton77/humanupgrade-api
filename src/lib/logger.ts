import winston from "winston";
import type { AppError } from "./errors.js";
import { isAppError } from "./errors.js";

/**
 * Log context type for additional metadata
 */
export type LogContext = Record<string, unknown>;

/**
 * Log levels
 */
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

/**
 * Log format for production (JSON)
 */
const productionFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.metadata({ fillExcept: ["message", "level", "timestamp"] })
);

/**
 * Log format for development (colored, readable)
 */
const developmentFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (stack) {
      msg += `\n${stack}`;
    }
    if (Object.keys(metadata).length > 0) {
      msg += `\n${JSON.stringify(metadata, null, 2)}`;
    }
    return msg;
  })
);

/**
 * Create Winston logger instance
 */
export const logger = winston.createLogger({
  levels: logLevels,
  level:
    process.env.LOG_LEVEL ||
    (process.env.NODE_ENV === "production" ? "info" : "debug"),
  format:
    process.env.NODE_ENV === "production"
      ? productionFormat
      : developmentFormat,
  defaultMeta: {
    service: "humanupgrade-api",
    environment: process.env.NODE_ENV || "development",
  },
  transports: [
    new winston.transports.Console({
      stderrLevels: ["error"],
    }),
  ],
  exceptionHandlers: [
    new winston.transports.Console({
      format: productionFormat,
    }),
  ],
  rejectionHandlers: [
    new winston.transports.Console({
      format: productionFormat,
    }),
  ],
});

/**
 * -------------------------
 * Error normalization helpers
 * -------------------------
 *
 * Goal: logs should always have:
 * - normalizedCode (your ErrorCode)
 * - dbProvider (mongo/neo4j/unknown)
 * - neo4j / mongo debug payload (when present)
 * - requestId
 *
 * And still include stack/message for the raw error if it’s a real Error.
 */
function normalizeErrorForLog(error: unknown): Record<string, unknown> {
  // Your AppError already contains rich structured extensions.
  if (isAppError(error)) {
    const appErr = error as AppError;
    return {
      isAppError: true,
      name: appErr.name,
      message: appErr.message,
      code: appErr.extensions.code,
      httpStatus: appErr.extensions.httpStatus,
      requestId: appErr.extensions.requestId,
      entityType: appErr.extensions.entityType,
      entityId: appErr.extensions.entityId,

      // Observability fields
      dbProvider: appErr.extensions.dbProvider,
      neo4j: appErr.extensions.neo4j,
      mongo: appErr.extensions.mongo,

      // do NOT include originalError here by default (may be huge)
      // originalError: appErr.extensions.originalError,
    };
  }

  // Generic error
  if (error instanceof Error) {
    return {
      isAppError: false,
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return {
    isAppError: false,
    message: String(error),
  };
}

/**
 * Log an error with context (AppError-aware)
 */
export function logError(error: unknown, context?: LogContext): void {
  const normalized = normalizeErrorForLog(error);

  // Use a stable log message for querying
  logger.error("error", {
    ...normalized,
    ...context,
  });
}

/**
 * Log a service call
 */
export function logServiceCall(
  serviceName: string,
  operation: string,
  context?: LogContext
): void {
  logger.info(`Service call: ${serviceName}.${operation}`, {
    serviceName,
    operation,
    ...context,
  });
}

/**
 * Log a database operation (make provider explicit!)
 */
export function logDatabaseOperation(
  provider: "mongo" | "neo4j",
  operation: string,
  target: string,
  context?: LogContext
): void {
  logger.debug(`Database operation: ${provider}.${target}.${operation}`, {
    provider,
    operation,
    target,
    ...context,
  });
}

/**
 * Log a GraphQL operation
 */
export function logGraphQLOperation(
  operation: string,
  operationName?: string,
  context?: LogContext
): void {
  logger.info(`GraphQL operation: ${operation}`, {
    operation,
    operationName,
    ...context,
  });
}

/**
 * Log an authentication event
 */
export function logAuthEvent(
  event: "login" | "logout" | "token_refresh" | "token_invalid",
  userId?: string,
  context?: LogContext
): void {
  logger.info(`Auth event: ${event}`, {
    event,
    userId,
    ...context,
  });
}

/**
 * Log a request
 */
export function logRequest(
  method: string,
  path: string,
  statusCode: number,
  duration?: number,
  context?: LogContext
): void {
  logger.http(`${method} ${path}`, {
    method,
    path,
    statusCode,
    duration,
    ...context,
  });
}

/**
 * Create a child logger with default context
 */
export function createChildLogger(defaultContext: LogContext) {
  return {
    error: (message: string, context?: LogContext) =>
      logger.error(message, { ...defaultContext, ...context }),
    warn: (message: string, context?: LogContext) =>
      logger.warn(message, { ...defaultContext, ...context }),
    info: (message: string, context?: LogContext) =>
      logger.info(message, { ...defaultContext, ...context }),
    debug: (message: string, context?: LogContext) =>
      logger.debug(message, { ...defaultContext, ...context }),
  };
}
