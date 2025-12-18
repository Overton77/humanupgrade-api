import { z } from "zod";
import { AppError, Errors } from "./errors.js";
import { logError } from "./logger.js";

/**
 * Validate input against a Zod schema
 * Throws AppError with validation details if validation fails
 */
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  input: unknown,
  fieldName: string
): T {
  const result = schema.safeParse(input);

  if (result.success) {
    return result.data;
  }

  const messages = result.error.issues.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join(".") : fieldName;
    return `${path}: ${issue.message}`;
  });

  logError(result.error, {
    fieldName,
    validationErrors: result.error.issues,
    input: typeof input === "object" ? JSON.stringify(input) : String(input),
  });

  throw Errors.validation(
    `Invalid ${fieldName}: ${messages.join("; ")}`,
    fieldName
  );
}

/**
 * Validate input and return a result type (doesn't throw)
 */
export function validateInputSafe<T>(
  schema: z.ZodSchema<T>,
  input: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(input);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return { success: false, errors: result.error };
}

/**
 * Validate an array of inputs
 */
export function validateInputArray<T>(
  schema: z.ZodSchema<T>,
  inputs: unknown[],
  fieldName: string
): T[] {
  return inputs.map((input, index) =>
    validateInput(schema, input, `${fieldName}[${index}]`)
  );
}

/**
 * Validate MongoDB ObjectId string
 */
export const ObjectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId format");

/**
 * Validate array of ObjectIds
 */
export const ObjectIdArraySchema = z.array(ObjectIdSchema);

/**
 * Validate optional ObjectId
 */
export const OptionalObjectIdSchema = ObjectIdSchema.optional();

/**
 * Validate URL string
 */
export const UrlSchema = z
  .string()
  .or(z.literal(""))
  .or(z.url("Must be a valid url"));

/**
 * Validate optional URL
 */
export const OptionalUrlSchema = UrlSchema.optional();
