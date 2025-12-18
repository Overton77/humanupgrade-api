import { z } from "zod";

/**
 * MediaLink schema
 * Note: url is required in the model, but we allow optional for flexibility
 * The service layer should handle empty strings or undefined appropriately
 */
export const MediaLinkSchema = z.object({
  description: z.string().min(1, "Description is required").max(500),
  url: z.url(),
  posterUrl: z.string().optional(),
});

export type MediaLinkInput = z.infer<typeof MediaLinkSchema>;
