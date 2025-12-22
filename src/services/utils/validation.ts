import mongoose, { type ClientSession, type Model } from "mongoose";
import { Errors } from "../../lib/errors.js";

export async function validateEntitiesExist<T>(
  model: Model<T>,
  ids: string[],
  entityType: string,
  opts?: { session?: ClientSession }
): Promise<void> {
  if (!ids?.length) return;

  const objectIds = ids.map((id) => new mongoose.Types.ObjectId(id));

  const existing = await model
    .find({ _id: { $in: objectIds } })
    .select("_id")
    .lean()
    .session(opts?.session ?? null);

  const existingSet = new Set(existing.map((d: any) => String(d._id)));

  for (const id of ids) {
    if (!existingSet.has(id)) {
      throw Errors.notFound(entityType, id);
    }
  }
}
