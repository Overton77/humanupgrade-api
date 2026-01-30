export function normalizeString(s: string): string {
    return s.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  }
  