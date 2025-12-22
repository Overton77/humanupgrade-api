import {
  AppError,
  Errors,
  ErrorCode,
  toAppError,
  isAppError,
} from "./errors.js";
import { logError, logServiceCall } from "./logger.js";
import type { LogContext } from "./logger.js";

/**
 * Wrap a service function with error handling and logging
 */
export async function withErrorHandling<T>(
  operation: string,
  serviceName: string,
  fn: () => Promise<T>,
  context?: LogContext
): Promise<T> {
  try {
    logServiceCall(serviceName, operation, context);
    return await fn();
  } catch (error) {
    logError(error, {
      operation,
      serviceName,
      ...context,
    });

    if (isAppError(error)) {
      throw error;
    }

    // Normalize everything else
    throw toAppError(error, `Unexpected error in ${serviceName}.${operation}`);
  }
}

/**
 * Wrap a synchronous service function with error handling
 */
export function withErrorHandlingSync<T>(
  operation: string,
  serviceName: string,
  fn: () => T,
  context?: LogContext
): T {
  try {
    logServiceCall(serviceName, operation, context);
    return fn();
  } catch (error) {
    logError(error, {
      operation,
      serviceName,
      ...context,
    });

    if (error instanceof AppError) {
      throw error;
    }

    throw toAppError(error, `Unexpected error in ${serviceName}.${operation}`);
  }
}
