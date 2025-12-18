import mongoose, {
  type ClientSession,
  type HydratedDocument,
  type Model,
} from "mongoose";

export type TxOpts = { session?: ClientSession };

export type CanonicalSyncLocals = {
  touched?: Record<string, boolean>;
  prev?: Record<string, mongoose.Types.ObjectId[]>;
};

export function getDocSession(doc: any): ClientSession | undefined {
  return doc?.$session?.() ?? undefined;
}

function asArray<T>(val: T | T[] | null | undefined): T[] {
  if (val == null) return [];
  return Array.isArray(val) ? val : [val];
}

function toObjectIdHexString(val: unknown): string | null {
  if (!val) return null;

  if (val instanceof mongoose.Types.ObjectId) return val.toHexString();

  if (typeof val === "string") {
    return mongoose.Types.ObjectId.isValid(val) ? val : null;
  }

  if (typeof val === "object" && (val as any)._id) {
    return toObjectIdHexString((val as any)._id);
  }

  return null;
}

function toObjectId(val: unknown): mongoose.Types.ObjectId | null {
  if (!val) return null;
  if (val instanceof mongoose.Types.ObjectId) return val;

  const hex = toObjectIdHexString(val);
  return hex ? new mongoose.Types.ObjectId(hex) : null;
}

export async function preloadPrevForPaths<
  TSchema,
  TDoc extends HydratedDocument<TSchema>
>(doc: TDoc, paths: string[]): Promise<void> {
  const self = doc as any as TDoc & { $locals: CanonicalSyncLocals };

  self.$locals ??= {};
  self.$locals.touched ??= {};
  self.$locals.prev ??= {};

  const changedPaths = paths.filter((p) => self.isModified(p));
  if (changedPaths.length === 0) return;

  for (const p of changedPaths) self.$locals.touched![p] = true;

  if (self.isNew) {
    for (const p of changedPaths) self.$locals.prev![p] = [];
    return;
  }

  const session = getDocSession(self);

  const prev = await (self.constructor as Model<any>)
    .findById(self._id)
    .select(changedPaths.join(" "))
    .session(session ?? null)
    .lean()
    .exec();

  for (const p of changedPaths) {
    const val = prev?.[p];

    self.$locals.prev![p] = asArray<any>(val) as mongoose.Types.ObjectId[];
  }
}

export function diffIdsFromLocals<
  TDoc extends { $locals?: CanonicalSyncLocals }
>(
  doc: TDoc,
  path: string
): {
  touched: boolean;
  oldIds: mongoose.Types.ObjectId[];
  newIds: mongoose.Types.ObjectId[];
  allIdStrings: Set<string>;
} {
  const touched = !!doc.$locals?.touched?.[path];

  const oldArr = asArray<any>(doc.$locals?.prev?.[path]);
  const rawNew =
    typeof (doc as any).get === "function"
      ? (doc as any).get(path)
      : (doc as any)[path];
  const newArr = asArray<any>(rawNew);

  const allIdStrings = new Set<string>();

  for (const v of oldArr) {
    const s = toObjectIdHexString(v);
    if (s) allIdStrings.add(s);
  }
  for (const v of newArr) {
    const s = toObjectIdHexString(v);
    if (s) allIdStrings.add(s);
  }

  const oldIds = oldArr
    .map(toObjectId)
    .filter(Boolean) as mongoose.Types.ObjectId[];
  const newIds = newArr
    .map(toObjectId)
    .filter(Boolean) as mongoose.Types.ObjectId[];

  return { touched, oldIds, newIds, allIdStrings };
}

export function cleanupSyncLocals(doc: unknown, paths: string[]) {
  const locals = (doc as any)?.$locals as CanonicalSyncLocals | undefined;
  if (!locals) return;

  for (const p of paths) {
    locals.touched && delete locals.touched[p];
    locals.prev && delete locals.prev[p];
  }
}
