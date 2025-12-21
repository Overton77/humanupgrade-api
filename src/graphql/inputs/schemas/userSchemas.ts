import { z } from "zod";
import { MediaLinkSchema } from "./mediaLinkSchema.js";
import {
  ObjectIdSchema,
  ObjectIdArraySchema,
} from "../../../lib/validation.js";

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

/**
 * User mass save input
 */
export const UserMassSaveInputSchema = z.object({
  userId: ObjectIdSchema,
  episodeIds: ObjectIdArraySchema.optional(),
  productIds: ObjectIdArraySchema.optional(),
  businessIds: ObjectIdArraySchema.optional(),
  protocolIds: ObjectIdArraySchema.optional(),
  compoundIds: ObjectIdArraySchema.optional(),
  caseStudyIds: ObjectIdArraySchema.optional(),
  personIds: ObjectIdArraySchema.optional(),
});
