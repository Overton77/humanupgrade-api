import mongoose from "mongoose";
import { Errors } from "../../lib/errors.js";

export type CursorParts = {
  t: Date;
  id: mongoose.Types.ObjectId;
};

export function encodeCursor(t: Date, id: mongoose.Types.ObjectId): string {
  return `${t.getTime()}_${id.toHexString()}`;
}

export function decodeCursor(cursor: string): CursorParts {
  const [tStr, idStr] = cursor.split("_");
  if (!tStr || !idStr) throw Errors.invalidInput("Invalid cursor", "after");

  const ms = Number(tStr);
  if (!Number.isFinite(ms))
    throw Errors.invalidInput("Invalid cursor", "after");

  if (!mongoose.Types.ObjectId.isValid(idStr)) {
    throw Errors.invalidInput("Invalid cursor", "after");
  }

  return { t: new Date(ms), id: new mongoose.Types.ObjectId(idStr) };
}
