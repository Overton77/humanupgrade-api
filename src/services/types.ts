import { AppError } from "../lib/errors.js";

export type ServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: AppError };

export type ServiceReturn<T> = T | null;

export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export function success<T>(data: T): ServiceResult<T> {
  return { success: true, data };
}

export function failure(error: AppError): ServiceResult<never> {
  return { success: false, error };
}

export function unwrap<T>(result: ServiceResult<T>): T {
  if (result.success) {
    return result.data;
  }
  throw result.error;
}

export function unwrapOrNull<T>(result: ServiceResult<T>): T | null {
  if (result.success) {
    return result.data;
  }
  return null;
}
