import { Schema } from "mongoose";

export interface MediaLink {
  description: string;
  url: string;
  posterUrl?: string;
}

export const MediaLinkSchema = new Schema<MediaLink>(
  {
    description: String,
    url: String,
    posterUrl: String,
  },
  { _id: false }
);
