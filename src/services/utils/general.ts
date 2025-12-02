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
    // remove
    arr.splice(idx, 1);
  } else {
    // add
    arr.push(targetId);
  }
  return arr;
}
