// src/services/Search/utils/fieldCursor.ts

export type FieldCursor = {
    sortVal: string;
    tie: string;
  };
  
  export function encodeFieldCursor(cursor: FieldCursor): string {
    return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
  }
  
  export function decodeFieldCursor(after?: string | null): FieldCursor | null {
    if (!after) return null;
    try {
      const raw = Buffer.from(after, "base64url").toString("utf8");
      const parsed = JSON.parse(raw) as Partial<FieldCursor>;
      if (typeof parsed.sortVal !== "string" || typeof parsed.tie !== "string") return null;
      return { sortVal: parsed.sortVal, tie: parsed.tie };
    } catch {
      return null;
    }
  }
  