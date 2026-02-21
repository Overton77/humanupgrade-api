import { BiomarkerIdentifier, BiomarkerIdentifierKey } from "../types.js";

export function resolveBiomarkerIdentifier(params: {
  biomarkerId?: string | null;
  name?: string | null;
}): { key: BiomarkerIdentifierKey; value: string } {
  if (params.biomarkerId) {
    return { key: "biomarkerId", value: params.biomarkerId };
  }
  if (params.name) {
    return { key: "name", value: params.name };
  }
  throw new Error("Biomarker identifier required: biomarkerId or name");
}
