import mongoose from "mongoose";
import { toObjectIds } from "./general.js";

export function mergeAndDedupeIds(
  existingIds: mongoose.Types.ObjectId[],
  newIds: string[]
): mongoose.Types.ObjectId[] {
  const merged = new Set<string>(existingIds.map((id) => id.toString()));
  newIds.forEach((id) => merged.add(id));
  return toObjectIds(Array.from(merged));
}

export function mergeUniqueStrings(
  existing: string[] = [],
  incoming: string[] = []
): string[] {
  return Array.from(new Set([...existing, ...incoming]));
}

export function mergeUniqueBy<T, K>(
  existing: T[] = [],
  incoming: T[] = [],
  keyFn: (item: T) => K
): T[] {
  const map = new Map<K, T>();

  for (const item of existing) {
    map.set(keyFn(item), item);
  }
  for (const item of incoming) {
    map.set(keyFn(item), item);
  }

  return Array.from(map.values());
}
