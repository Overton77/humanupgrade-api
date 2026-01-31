// src/search/cursor.ts

export type SearchCursor = {
    rankKey: number; // rounded score used for ordering
    tie: string; // organizationId (stable tiebreaker)
  };
  
  export function encodeCursor(cursor: SearchCursor): string {
    return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
  }
  
  export function decodeCursor(after?: string | null): SearchCursor | null {
    if (!after) return null;
    try {
      const raw = Buffer.from(after, "base64url").toString("utf8");
      const parsed = JSON.parse(raw) as Partial<SearchCursor>;
      if (
        typeof parsed.rankKey !== "number" ||
        typeof parsed.tie !== "string" ||
        !parsed.tie
      ) {
        return null;
      }
      return { rankKey: parsed.rankKey, tie: parsed.tie };
    } catch {
      return null;
    }
  }
  