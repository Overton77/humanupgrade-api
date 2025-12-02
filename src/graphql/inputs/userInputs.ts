import { MediaLink } from "../../models/MediaLink.js";

export interface MediaLinkInput extends MediaLink {}

export interface UserUpsertInput {
  email: string;
  password?: string; // if provided, (re)hash and set
  provider?: "local" | "google" | "github" | "apple";
  providerId?: string;
  name?: string;
  role?: "admin" | "user";
  mediaLinks?: MediaLinkInput[];
}

/**
 * For bulk saving/removing saved items
 */
export interface UserMassSaveInput {
  userId: string;
  episodeIds?: string[];
  productIds?: string[];
  businessIds?: string[];
}
