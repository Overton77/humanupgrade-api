import mongoose from "mongoose";

export function toObjectIds(ids: string[]): mongoose.Types.ObjectId[] {
  return ids.map((id) => new mongoose.Types.ObjectId(id));
}

export function removeIds(
  existing: mongoose.Types.ObjectId[],
  idsToRemove: string[]
): mongoose.Types.ObjectId[] {
  const removeSet = new Set(idsToRemove.map((id) => id.toString()));
  return existing.filter((id) => !removeSet.has(id.toString()));
}

export function toggleObjectIdInArray(
  arr: mongoose.Types.ObjectId[],
  targetId: mongoose.Types.ObjectId
): mongoose.Types.ObjectId[] {
  const targetStr = targetId.toString();
  const idx = arr.findIndex((id) => id.toString() === targetStr);

  if (idx >= 0) {
    arr.splice(idx, 1);
  } else {
    arr.push(targetId);
  }
  return arr;
}

export function norm(v?: string) {
  return (v ?? "").trim().toLowerCase();
}

export function executiveKey(e: {
  personId: mongoose.Types.ObjectId;
  title?: string;
  role?: string;
}) {
  return `${e.personId.toString()}|${norm(e.title)}|${norm(e.role)}`;
}

export function asObjectId(id: string): mongoose.Types.ObjectId {
  return new mongoose.Types.ObjectId(id);
}
