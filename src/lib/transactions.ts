import mongoose, { ClientSession } from "mongoose";
import { AppError, ErrorCode, Errors } from "./errors.js";
import { logger, logError, LogContext } from "./logger.js";

export type TxOpts = { session?: ClientSession };
export type TxContext = LogContext & { operation?: string };

export type TxFn<T> = (session: ClientSession) => Promise<T>;

/**
 * Execute a function within a MongoDB transaction.
 *
 * ✅ Transaction-safe: caller must await all ops inside fn.
 * ✅ Uses session.withTransaction (recommended).
 * ✅ Backward compatible signature.
 */
export async function withTransaction<T>(
  fn: TxFn<T>,
  context?: TxContext
): Promise<T> {
  const session = await mongoose.startSession();
  const operation = context?.operation ?? "transaction";
  const requestId = context?.requestId as string | undefined;

  try {
    logger.info(`Starting transaction: ${operation}`, {
      operation,
      requestId,
      ...context,
    });

    const result = await session.withTransaction(async () => fn(session), {
      readConcern: { level: "snapshot" },
      writeConcern: { w: "majority" },
    });

    logger.info(`Transaction committed: ${operation}`, {
      operation,
      requestId,
      ...context,
    });

    return result as T;
  } catch (error) {
    logError(error, {
      operation,
      requestId,
      transactionAborted: true,
      ...context,
    });

    if (error instanceof AppError) throw error;

    const msg = error instanceof Error ? error.message : String(error);
    throw Errors.databaseError(
      `Transaction failed: ${operation} - ${msg}`,
      error
    );
  } finally {
    await session.endSession();
  }
}

/**
 * Execute operations sequentially within a transaction.
 * ✅ SAFE inside transactions.
 */
export async function withTransactionSequential<T>(
  operations: Array<TxFn<T>>,
  context?: TxContext
): Promise<T[]> {
  return withTransaction(
    async (session) => {
      const results: T[] = [];
      for (const op of operations) {
        results.push(await op(session));
      }
      return results;
    },
    { ...context, operation: context?.operation ?? "sequential_transaction" }
  );
}

/**
 * "Parallel" inside a transaction is undefined behavior (MongoDB/Mongoose warning).
 * To stay safe + backward compatible, this runs SEQUENTIALLY.
 *
 * If you *truly* want parallelism, do it OUTSIDE a transaction.
 */
export async function withTransactionParallel<T>(
  operations: Array<TxFn<T>>,
  context?: TxContext
): Promise<T[]> {
  // Keep the function name for existing callers, but be correct.
  return withTransactionSequential(operations, {
    ...context,
    operation: context?.operation ?? "parallel_transaction",
  });
}

/**
 * Retry a transaction operation with exponential backoff.
 * ✅ Retries transient failures.
 * ✅ Avoids retry for non-retryable AppErrors.
 */
export async function withTransactionRetry<T>(
  fn: TxFn<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    context?: TxContext;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 100,
    maxDelay = 1000,
    context,
  } = options;

  let lastError: unknown;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await withTransaction(fn, {
        ...context,
        attempt: attempt + 1,
        maxRetries,
      } as any);
    } catch (error) {
      lastError = error;

      if (error instanceof AppError) {
        const nonRetryableCodes = [
          ErrorCode.VALIDATION_ERROR,
          ErrorCode.INVALID_INPUT,
          ErrorCode.UNAUTHENTICATED,
          ErrorCode.FORBIDDEN,
        ];
        if (nonRetryableCodes.includes(error.code)) throw error;
      }

      if (attempt < maxRetries) {
        logger.warn(`Transaction retry attempt ${attempt + 1}/${maxRetries}`, {
          ...context,
          attempt: attempt + 1,
          delay,
          error: error instanceof Error ? error.message : String(error),
        });
        await new Promise((r) => setTimeout(r, delay));
        delay = Math.min(delay * 2, maxDelay);
      }
    }
  }

  throw Errors.databaseError(
    `Transaction failed after ${maxRetries + 1} attempts`,
    lastError
  );
}
