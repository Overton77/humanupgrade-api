import { AppError, ErrorCode } from "./errors.js";
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
    const result = await fn();
    return result;
  } catch (error) {
    logError(error, {
      operation,
      serviceName,
      ...context,
    });

    // Re-throw AppErrors as-is
    if (error instanceof AppError) {
      throw error;
    }

    // Wrap unexpected errors
    if (error instanceof Error) {
      throw new AppError(
        `Unexpected error in ${serviceName}.${operation}: ${error.message}`,
        {
          code: ErrorCode.DATABASE_ERROR,
          originalError: error,
        }
      );
    }

    throw new AppError(`Unexpected error in ${serviceName}.${operation}`, {
      code: ErrorCode.DATABASE_ERROR,
      originalError: error,
    });
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
    const result = fn();
    return result;
  } catch (error) {
    logError(error, {
      operation,
      serviceName,
      ...context,
    });

    if (error instanceof AppError) {
      throw error;
    }

    if (error instanceof Error) {
      throw new AppError(
        `Unexpected error in ${serviceName}.${operation}: ${error.message}`,
        {
          code: ErrorCode.DATABASE_ERROR,
          originalError: error,
        }
      );
    }

    throw new AppError(`Unexpected error in ${serviceName}.${operation}`, {
      code: ErrorCode.DATABASE_ERROR,
      originalError: error,
    });
  }
}
