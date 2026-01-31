import { SearchMode } from "../../../graphql/enums/index.js";

export function normalizeFirst(first?: number | null): number {
    const f = first ?? 20;
    return Math.max(1, Math.min(50, f)); // keep it sane for ranked search
  }
  
export function normalizeSearchMode(mode?: string | null): SearchMode {
    const validModes: SearchMode[] = ["FIELD_ONLY", "FULLTEXT_ONLY", "VECTOR_ONLY", "HYBRID"];
    if (mode && validModes.includes(mode as SearchMode)) {
      return mode as SearchMode;
    }
    return "HYBRID";
  } 

/**
 * Convert a Neo4j node record.get('node') to a plain JS object.
 */
export function nodeToObject(node: any): any {
    // Neo4j driver Node has .properties
    if (node && typeof node === "object" && "properties" in node) return (node as any).properties;
    return node;
  }
  
export function numOrNull(v: unknown): number | null {
    if (v == null) return null;
    if (typeof v === "number") return v;
    // neo4j integers sometimes leak if returned as props; but we aren't returning ints from cypher other than numeric fields.
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }