
import type { EagerResult } from "./types.js";
import type { Record as Neo4jRecord } from "neo4j-driver";
import neo4j from "neo4j-driver";

export function firstRecordOrNull(result: EagerResult): Neo4jRecord | null {
    return result.records.length > 0 ? result.records[0] : null;
  }
  
  export function firstValueOrNull<T = unknown>(
    result: EagerResult,
    key: string
  ): T | null {
    const rec = firstRecordOrNull(result);
    if (!rec) return null;
    return (rec.get(key) as T) ?? null;
  }
  
  /**
   * Neo4j Integer -> JS number
   */
  export function toNumber(value: unknown): number {
    if (neo4j.isInt(value)) return value.toNumber();
    if (typeof value === "number") return value;
    if (typeof value === "string") return Number(value);
    throw new Error(`Cannot convert value to number: ${String(value)}`);
  }
  
  
  export function neoInt(n: number): neo4j.Integer {
    if (!Number.isFinite(n)) throw new Error(`Invalid int: ${n}`);
    return neo4j.int(Math.trunc(n));
  }