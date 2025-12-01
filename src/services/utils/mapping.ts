import { IBusinessExecutive } from "../../models/Business";
import { BusinessExecutiveRelationInput } from "../../graphql/inputs/businessInputs";
import mongoose from "mongoose";

export function mapExecutivesInput(
  executives: BusinessExecutiveRelationInput[] | undefined
): IBusinessExecutive[] {
  if (!executives) return [];
  const seen = new Set<string>();
  const result: IBusinessExecutive[] = [];

  for (const exec of executives) {
    const key = exec.personId;
    if (seen.has(key)) continue;
    seen.add(key);

    result.push({
      personId: new mongoose.Types.ObjectId(exec.personId),
      title: exec.title,
      role: exec.role,
    });
  }

  return result;
}
