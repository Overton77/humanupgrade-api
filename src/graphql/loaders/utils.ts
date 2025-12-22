import mongoose, { HydratedDocument, Model } from "mongoose";

export type ObjectId = mongoose.Types.ObjectId;

export function idKey(id: mongoose.Types.ObjectId): string {
  return id.toHexString();
}

export async function batchByIds<TSchema>(
  model: Model<TSchema>,
  ids: readonly ObjectId[]
): Promise<(HydratedDocument<TSchema> | null)[]> {
  const docs = await model.find({ _id: { $in: ids } });
  const map = new Map<string, HydratedDocument<TSchema>>(
    docs.map((d) => [idKey(d._id as ObjectId), d as HydratedDocument<TSchema>])
  );

  return ids.map((id) => map.get(idKey(id)) ?? null);
}

export function asModel<TSchema>(m: unknown): Model<TSchema> {
  return m as Model<TSchema>;
}

export function groupByKey<TDoc, TKey extends string>(
  docs: readonly TDoc[],
  getKey: (doc: TDoc) => TKey
): Map<TKey, TDoc[]> {
  const map = new Map<TKey, TDoc[]>();
  for (const d of docs) {
    const k = getKey(d);
    const arr = map.get(k);
    if (arr) arr.push(d);
    else map.set(k, [d]);
  }
  return map;
}
