import {
  executeWrite,
  executeRead,
} from "../../db/neo4j/executor.js";
import { firstRecordOrNull } from "../../db/neo4j/utils.js";
import { logger } from "../../lib/logger.js";
import { validateInput } from "../../lib/validation.js";
import {
  BiomarkerInput,
  BiomarkerInputSchema,
  BiomarkerUpdateInput,
  BiomarkerUpdateInputSchema,
} from "../../graphql/inputs/BiomarkerInputs.js";
import { Biomarker } from "../../graphql/types/BiomarkerModel.js";
import { createBiomarkerStatements, buildBiomarkerUpsertCypher } from "./statements/createBiomarkerStatements.js";
import { findExistingBiomarkerIdCypher } from "./statements/findExistingBiomarkerCypher.js";
import { resolveBiomarkerIdentifier } from "./utils/resolveBiomarkerIdentity.js";
import { Errors } from "../../lib/errors.js";
import { buildBiomarkerUpdateCypher, updateBiomarkerStatements } from "./statements/updateBiomarkerStatements.js";

export async function createBiomarker(
  input: BiomarkerInput
): Promise<Biomarker> {
  const validated = validateInput(
    BiomarkerInputSchema,
    input,
    "BiomarkerInput"
  );

  const params = {
    biomarkerId: validated.biomarkerId ?? null,
    name: validated.name,
    synonyms: validated.synonyms ?? null,
    description: validated.description ?? null,
    clinicalDomains: validated.clinicalDomains ?? null,
    unitsCommon: validated.unitsCommon ?? null,
    interpretationNotes: validated.interpretationNotes ?? null,
    validAt: validated.validAt ?? null,
    invalidAt: validated.invalidAt ?? null,
    expiredAt: validated.expiredAt ?? null,
  };

  const { returnBiomarkersCypher } = createBiomarkerStatements;

  try {
    const biomarker = await executeWrite(async (tx) => {
      const pre = await tx.run(findExistingBiomarkerIdCypher, params);
      const foundIds = Array.from(
        new Set(pre.records.map((r) => r.get("biomarkerId")).filter(Boolean))
      );

      // 1) Upsert biomarker
      let writeRes;

      if (foundIds.length > 1) {
        throw Errors.duplicate("Biomarker", foundIds.join(", "));
      }

      if (foundIds.length === 1) {
        const existingBiomarkerId = foundIds[0] as string;
        const updateCypher = buildBiomarkerUpdateCypher("biomarkerId");
        writeRes = await tx.run(updateCypher, { ...params, idValue: existingBiomarkerId });
      } else {
        const { key, value } = resolveBiomarkerIdentifier(params);
        const upsertCypher = buildBiomarkerUpsertCypher(key);
        writeRes = await tx.run(upsertCypher, { ...params, idValue: value });
      }

      const upsertRecord = firstRecordOrNull(writeRes);
      if (!upsertRecord)
        throw new Error("createBiomarker: no record returned from upsert");

      const biomarkerNode = upsertRecord.get("bm");
      const resolvedBiomarkerId = biomarkerNode?.properties?.biomarkerId ?? biomarkerNode?.biomarkerId;

      if (!resolvedBiomarkerId) throw Errors.internalError("Write did not produce BiomarkerID. Error");

      // 2) Return biomarker at end
      const finalRes = await tx.run(returnBiomarkersCypher, { biomarkerId: resolvedBiomarkerId });
      const finalRecord = firstRecordOrNull(finalRes);
      if (!finalRecord)
        throw new Error("createBiomarker: biomarker not found after writes");

      const node = finalRecord.get("bm");
      return node?.properties ?? node;
    });

    return biomarker as Biomarker;
  } catch (err: any) {
    logger.error("Neo4j write failed", {
      message: err?.message,
      code: err?.code,
      name: err?.name,
      stack: err?.stack,
    });
    throw err;
  }
}

export async function updateBiomarker(
  input: BiomarkerUpdateInput
): Promise<Biomarker> {
  const validated = validateInput(
    BiomarkerUpdateInputSchema,
    input,
    "BiomarkerUpdateInput"
  );

  // Keep params as primitives
  const params = {
    biomarkerId: validated.biomarkerId ?? null,
    name: validated.name ?? null,
    synonyms: validated.synonyms ?? null,
    description: validated.description ?? null,
    clinicalDomains: validated.clinicalDomains ?? null,
    unitsCommon: validated.unitsCommon ?? null,
    interpretationNotes: validated.interpretationNotes ?? null,
    validAt: validated.validAt ?? null,
    invalidAt: validated.invalidAt ?? null,
    expiredAt: validated.expiredAt ?? null,
  };

  // Resolve identifier for update
  const { key, value } = resolveBiomarkerIdentifier(params);
  const updateCypher = buildBiomarkerUpdateCypher(key);

  try {
    const biomarker = await executeWrite(async (tx) => {
      // ------------------------------------------------------------
      // 0) Ensure biomarker exists + update its scalar fields
      // ------------------------------------------------------------
      let biomarkerNode: Biomarker | null;
      {
        const res = await tx.run(updateCypher, { ...params, idValue: value });

        const record = firstRecordOrNull(res);
        if (!record) throw new Error("updateBiomarker: no record returned");

        const biomarkerRecord = record.get("bm");

        if (!biomarkerRecord) throw Errors.internalError("Biomarker not found");

        biomarkerNode = biomarkerRecord;
      }

      const finalBiomarkerId: string | null =
        (biomarkerNode as any)?.properties?.biomarkerId ?? (biomarkerNode as any)?.biomarkerId;

      if (!finalBiomarkerId)
        throw Errors.internalError("Biomarker ID is required");

      // ------------------------------------------------------------
      // 1) Return updated biomarker
      // ------------------------------------------------------------
      const final = await tx.run(
        updateBiomarkerStatements.returnUpdatedBiomarkerCypher,
        { biomarkerId: finalBiomarkerId }
      );

      const record = firstRecordOrNull(final);
      if (!record) throw new Error("updateBiomarker: biomarker not found after writes");
      const node = record.get("bm");
      return node?.properties ?? node;
    });

    return biomarker as Biomarker;
  } catch (err: any) {
    logger.error("Neo4j write failed", {
      message: err?.message,
      code: err?.code,
      name: err?.name,
      stack: err?.stack,
    });
    throw err;
  }
}
