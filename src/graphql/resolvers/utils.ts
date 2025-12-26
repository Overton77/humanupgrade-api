import { HydratedDocument, ToObjectOptions } from "mongoose";

export type HasTypename = { __typename: string };

export function withTypename<TName extends string>(
  doc: HydratedDocument<unknown> | null,
  typename: TName,
  options: ToObjectOptions = { virtuals: true }
): ({ __typename: TName } & Record<string, unknown>) | null {
  if (!doc) return null;
  return {
    ...(doc.toObject(options) as Record<string, unknown>),
    __typename: typename,
  };
}
