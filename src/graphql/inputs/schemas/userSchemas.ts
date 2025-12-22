import { z } from "zod";
import { MediaLinkSchema } from "./mediaLinkSchema.js";

/**
 * User provider enum
 */
export const UserProviderSchema = z.enum([
  "local",
  "google",
  "github",
  "apple",
]);

/**
 * User role enum
 */
export const UserRoleSchema = z.enum(["admin", "user"]);

/**
 * User upsert input
 */
export const UserUpsertInputSchema = z.object({
  userId: z.string().optional(),
  email: z.email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .optional(),
  provider: UserProviderSchema.optional(),
  providerId: z.string().optional(),
  name: z.string().max(200).optional(),
  role: UserRoleSchema.optional(),
  mediaLinks: z.array(MediaLinkSchema).optional(),
});
