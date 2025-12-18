import { ClientSession, Model, Types } from "mongoose";

export type SavedField =
  | "savedEpisodes"
  | "savedProducts"
  | "savedBusinesses"
  | "savedProtocols"
  | "savedCompounds"
  | "savedCaseStudies"
  | "savedPersons";

export async function pullFromUsersSaved(
  User: Model<any>,
  field: SavedField,
  id: Types.ObjectId,
  session?: ClientSession
) {
  await User.updateMany(
    { [field]: id },
    { $pull: { [field]: id } },
    session ? { session } : null
  );
}
