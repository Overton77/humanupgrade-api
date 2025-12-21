import mongoose from "mongoose";
import { UserSaved, type IUserSaved } from "../models/UserSaved.js";
import { validateInput } from "../lib/validation.js";
import { Errors } from "../lib/errors.js";
import { toObjectIds } from "./utils/general.js";

import type {
  SaveEntityInput,
  UnsaveEntityInput,
  SavedEntitiesFilterInput,
  CursorPageInput,
} from "../graphql/inputs/userSavedInputs.js";

import {
  SaveEntityInputSchema,
  UnsaveEntityInputSchema,
  SavedEntitiesFilterInputSchema,
  CursorPageInputSchema,
} from "../graphql/inputs/schemas/userSavedSchemas.js";

function toObjectId(id: string): mongoose.Types.ObjectId {
  return toObjectIds([id])[0];
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function encodeCursor(
  createdAt: Date,
  id: mongoose.Types.ObjectId
): string {
  return `${createdAt.getTime()}_${id.toHexString()}`;
}

export function decodeCursor(cursor: string): {
  createdAt: Date;
  id: mongoose.Types.ObjectId;
} {
  const [ms, hex] = cursor.split("_");
  if (!ms || !hex) throw Errors.invalidInput("Invalid cursor");
  const createdAt = new Date(Number(ms));
  const id = new mongoose.Types.ObjectId(hex);
  return { createdAt, id };
}

export async function saveEntity(
  userId: mongoose.Types.ObjectId,
  input: SaveEntityInput
): Promise<IUserSaved> {
  const v = validateInput(SaveEntityInputSchema, input, "SaveEntityInput");

  const targetIdObj = toObjectId(v.targetId);

  const tags = (v.tags ?? []).map((t) => t.trim()).filter(Boolean);
  const note = v.note?.trim();
  const pinned = v.pinned ?? false;

  const updated = await UserSaved.findOneAndUpdate(
    {
      userId,
      "targetRef.type": v.targetType,
      "targetRef.id": targetIdObj,
    },
    {
      $setOnInsert: {
        userId,
        targetRef: { type: v.targetType, id: targetIdObj },
      },
      ...(v.source !== undefined ? { $set: { source: v.source } } : {}),
      ...(note !== undefined ? { $set: { note } } : {}),
      ...(v.pinned !== undefined ? { $set: { pinned } } : {}),
      ...(tags.length > 0 ? { $addToSet: { tags: { $each: tags } } } : {}),
    },
    {
      upsert: true,
      new: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    }
  );

  if (!updated)
    throw Errors.internalError(
      "Failed to save entity",
      new Error("saveEntity")
    );
  return updated;
}

export async function unsaveEntity(
  userId: mongoose.Types.ObjectId,
  input: UnsaveEntityInput
): Promise<boolean> {
  const v = validateInput(UnsaveEntityInputSchema, input, "UnsaveEntityInput");
  const targetIdObj = toObjectId(v.targetId);

  const result = await UserSaved.deleteOne({
    userId,
    "targetRef.type": v.targetType,
    "targetRef.id": targetIdObj,
  });

  return (result.deletedCount ?? 0) > 0;
}

export async function getSavedEntities(
  userId: mongoose.Types.ObjectId,
  filter?: SavedEntitiesFilterInput,
  page?: CursorPageInput
): Promise<{
  nodes: IUserSaved[];
  hasNextPage: boolean;
  endCursor: string | null;
}> {
  const f = filter
    ? validateInput(
        SavedEntitiesFilterInputSchema,
        filter,
        "SavedEntitiesFilterInput"
      )
    : undefined;

  const p = page
    ? validateInput(CursorPageInputSchema, page, "CursorPageInput")
    : { first: 20 };

  const first = p.first ?? 20;

  const query: any = { userId };

  if (f?.targetType) query["targetRef.type"] = f.targetType;
  if (f?.pinned !== undefined) query.pinned = f.pinned;
  if (f?.tags?.length) query.tags = { $all: f.tags };

  if (f?.search?.trim()) {
    const re = new RegExp(escapeRegex(f.search.trim()), "i");
    query.$or = [{ note: re }, { tags: re }];
  }

  if (p.after) {
    const { createdAt, id } = decodeCursor(p.after);

    query.$or = [
      { createdAt: { $lt: createdAt } },
      { createdAt, _id: { $lt: id } },
    ];
  }

  const docs = await UserSaved.find(query)
    .sort({ createdAt: -1, _id: -1 })
    .limit(first + 1);

  const hasNextPage = docs.length > first;
  const nodes = hasNextPage ? docs.slice(0, first) : docs;

  const endCursor =
    nodes.length > 0
      ? encodeCursor(
          nodes[nodes.length - 1].createdAt!,
          nodes[nodes.length - 1]._id
        )
      : null;

  return { nodes, hasNextPage, endCursor };
}
