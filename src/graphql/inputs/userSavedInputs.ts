import type { SavedEntityType, SaveSource } from "../../models/UserSaved.js";

export interface SaveEntityInput {
  targetType: SavedEntityType;
  targetId: string;

  note?: string;
  tags?: string[];
  pinned?: boolean;
  source?: SaveSource;
}

export interface UnsaveEntityInput {
  targetType: SavedEntityType;
  targetId: string;
}

export interface SavedEntitiesFilterInput {
  targetType?: SavedEntityType;
  search?: string;
  tags?: string[];
  pinned?: boolean;
}

export interface CursorPageInput {
  first?: number;
  after?: string;
}
