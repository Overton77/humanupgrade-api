import winston from "winston";
import { env } from "../config/env.js";

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
  // Handle exceptions and rejections
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
 * Log an error with context
 */
export function logError(error: Error | unknown, context?: LogContext): void {
  const errorObj =
    error instanceof Error
      ? {
          message: error.message,
          stack: error.stack,
          name: error.name,
        }
      : { message: String(error) };

  logger.error("Error occurred", {
    ...errorObj,
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
 * Log a database operation
 */
export function logDatabaseOperation(
  operation: string,
  collection: string,
  context?: LogContext
): void {
  logger.debug(`Database operation: ${collection}.${operation}`, {
    operation,
    collection,
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
