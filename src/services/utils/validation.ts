import mongoose from "mongoose";

export async function validateEntitiesExist<T extends mongoose.Document>(
  model: mongoose.Model<T>,
  ids: string[],
  entityType: string
): Promise<void> {
  if (!ids || ids.length === 0) return;

  // Batch query for all IDs at once (more efficient than individual queries)
  const existingEntities = await model
    .find({ _id: { $in: ids } })
    .select("_id")
    .lean();

  const existingIds = new Set(existingEntities.map((e) => e._id.toString()));

  // Check if any IDs are missing
  for (const id of ids) {
    if (!existingIds.has(id)) {
      throw new Error(`${entityType} with id ${id} does not exist`);
    }
  }
}
