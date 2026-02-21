import { LabTestIdentifier, LabTestIdentifierKey } from "../types.js";

export function resolveLabTestIdentifier(params: {
  labTestId?: string | null;
  name?: string | null;
}): { key: LabTestIdentifierKey; value: string } {
  if (params.labTestId) {
    return { key: "labTestId", value: params.labTestId };
  }
  if (params.name) {
    return { key: "name", value: params.name };
  }
  throw new Error("LabTest identifier required: labTestId or name");
}
