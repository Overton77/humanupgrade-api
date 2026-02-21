import {
  executeWrite,
  executeRead,
} from "../../db/neo4j/executor.js";
import { firstRecordOrNull } from "../../db/neo4j/utils.js";
import { logger } from "../../lib/logger.js";
import { validateInput } from "../../lib/validation.js";
import {
  LabTestInputWithRelations,
  LabTestInputWithRelationsSchema,
  UpdateLabTestInputWithRelations,
  UpdateLabTestInputWithRelationsSchema,
} from "../../graphql/inputs/LabTestInputs.js";
import { LabTest } from "../../graphql/types/LabTestModel.js";
import { createLabTestStatements, buildLabTestUpsertCypher } from "./statements/createLabTestStatements.js";
import { findExistingLabTestIdCypher } from "./statements/findExistingLabTestCypher.js";
import { resolveLabTestIdentifier } from "./utils/resolveLabTestIdentity.js";
import { Errors } from "../../lib/errors.js";
import { buildLabTestUpdateCypher, updateLabTestStatements } from "./statements/updateLabTestStatements.js";

export async function createLabTestWithOptionalRelations(
  input: LabTestInputWithRelations
): Promise<LabTest> {
  const validated = validateInput(
    LabTestInputWithRelationsSchema,
    input,
    "LabTestInputWithRelations"
  );

  // IMPORTANT:
  // - For relationship arrays, prefer [] (not null) so UNWIND is predictable.
  // - For scalar/primitive arrays (synonyms), your existing null/merge behavior is fine.
  const params = {
    labTestId: validated.labTestId ?? null,
    name: validated.name,
    synonyms: validated.synonyms ?? null,
    loincCodes: validated.loincCodes ?? null,
    cptCodes: validated.cptCodes ?? null,
    whatItMeasures: validated.whatItMeasures ?? null,
    prepRequirements: validated.prepRequirements ?? null,
    validAt: validated.validAt ?? null,
    invalidAt: validated.invalidAt ?? null,
    expiredAt: validated.expiredAt ?? null,

    // Relationship arrays — ALWAYS arrays
    measures: validated.measures ?? [],
    usesMethod: validated.usesMethod ?? [],
    requiresSpecimen: validated.requiresSpecimen ?? [],
    usesPlatform: validated.usesPlatform ?? [],
  };

  const {
    labTestMeasuresBiomarkerCypher,
    labTestUsesMethodCypher,
    labTestRequiresSpecimenCypher,
    labTestUsesPlatformCypher,
    returnLabTestsCypher,
  } = createLabTestStatements;

  try {
    const labTest = await executeWrite(async (tx) => {
      const pre = await tx.run(findExistingLabTestIdCypher, params);
      const foundIds = Array.from(
        new Set(pre.records.map((r) => r.get("labTestId")).filter(Boolean))
      );

      // 1) Upsert labTest
      let writeRes;

      if (foundIds.length > 1) {
        throw Errors.duplicate("LabTest", foundIds.join(", "));
      }

      if (foundIds.length === 1) {
        const existingLabTestId = foundIds[0] as string;
        const updateCypher = buildLabTestUpdateCypher("labTestId");
        writeRes = await tx.run(updateCypher, { ...params, idValue: existingLabTestId });
      } else {
        const { key, value } = resolveLabTestIdentifier(params);
        const upsertCypher = buildLabTestUpsertCypher(key);
        writeRes = await tx.run(upsertCypher, { ...params, idValue: value });
      }

      const upsertRecord = firstRecordOrNull(writeRes);
      if (!upsertRecord)
        throw new Error("createLabTest: no record returned from upsert");

      const labTestNode = upsertRecord.get("lt");
      const resolvedLabTestId = labTestNode?.properties?.labTestId ?? labTestNode?.labTestId;

      if (!resolvedLabTestId) throw Errors.internalError("Write did not produce LabTestID. Error");

      // Update params with actual labTestId for relationship statements
      const nextParams = { ...params, labTestId: resolvedLabTestId };

      // 2) Relationship statements (each its own Cypher statement, still same TX)
      if (nextParams.measures.length) {
        await tx.run(labTestMeasuresBiomarkerCypher, nextParams);
      }
      if (nextParams.usesMethod.length) {
        await tx.run(labTestUsesMethodCypher, nextParams);
      }
      if (nextParams.requiresSpecimen.length) {
        await tx.run(labTestRequiresSpecimenCypher, nextParams);
      }
      if (nextParams.usesPlatform.length) {
        await tx.run(labTestUsesPlatformCypher, nextParams);
      }

      // 3) Return labTest at end
      const finalRes = await tx.run(returnLabTestsCypher, { labTestId: resolvedLabTestId });
      const finalRecord = firstRecordOrNull(finalRes);
      if (!finalRecord)
        throw new Error("createLabTest: labTest not found after writes");

      const node = finalRecord.get("lt");
      return node?.properties ?? node;
    });

    return labTest as LabTest;
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

export async function updateLabTestWithOptionalRelations(
  input: UpdateLabTestInputWithRelations
): Promise<LabTest> {
  const validated = validateInput(
    UpdateLabTestInputWithRelationsSchema,
    input,
    "UpdateLabTestInputWithRelations"
  );

  // Keep params as primitives/arrays; each tx.run block plucks what it needs.
  const params = {
    labTestId: validated.labTestId ?? null,
    name: validated.name ?? null,
    synonyms: validated.synonyms ?? null,
    loincCodes: validated.loincCodes ?? null,
    cptCodes: validated.cptCodes ?? null,
    whatItMeasures: validated.whatItMeasures ?? null,
    prepRequirements: validated.prepRequirements ?? null,
    validAt: validated.validAt ?? null,
    invalidAt: validated.invalidAt ?? null,
    expiredAt: validated.expiredAt ?? null,

    // Relationship arrays — ALWAYS arrays
    measures: validated.measures ?? [],
    usesMethod: validated.usesMethod ?? [],
    requiresSpecimen: validated.requiresSpecimen ?? [],
    usesPlatform: validated.usesPlatform ?? [],
  };

  // Resolve identifier for update
  const { key, value } = resolveLabTestIdentifier(params);
  const updateCypher = buildLabTestUpdateCypher(key);

  try {
    const labTest = await executeWrite(async (tx) => {
      // ------------------------------------------------------------
      // 0) Ensure labTest exists + update its scalar fields
      // ------------------------------------------------------------
      let labTestNode: LabTest | null;
      {
        const res = await tx.run(updateCypher, { ...params, idValue: value });

        const record = firstRecordOrNull(res);
        if (!record) throw new Error("updateLabTest: no record returned");

        const labTestRecord = record.get("lt");

        if (!labTestRecord) throw Errors.internalError("LabTest not found");

        labTestNode = labTestRecord;
      }

      const finalLabTestId: string | null =
        (labTestNode as any)?.properties?.labTestId ?? (labTestNode as any)?.labTestId;

      if (!finalLabTestId)
        throw Errors.internalError("LabTest ID is required");

      const nextParams = {
        ...params,
        labTestId: finalLabTestId,
      };

      // ------------------------------------------------------------
      // 1) MEASURES (create / connect / update)
      // ------------------------------------------------------------
      if (params.measures.length) {
        await tx.run(
          updateLabTestStatements.updateLabTestMeasuresBiomarkerCypher,
          nextParams
        );
      }

      // ------------------------------------------------------------
      // 2) USES_METHOD (create / connect / update)
      // ------------------------------------------------------------
      if (params.usesMethod.length) {
        await tx.run(
          updateLabTestStatements.updateLabTestUsesMethodCypher,
          nextParams
        );
      }

      // ------------------------------------------------------------
      // 3) REQUIRES_SPECIMEN (create / connect / update)
      // ------------------------------------------------------------
      if (params.requiresSpecimen.length) {
        await tx.run(
          updateLabTestStatements.updateLabTestRequiresSpecimenCypher,
          nextParams
        );
      }

      // ------------------------------------------------------------
      // 4) USES_PLATFORM (create / connect / update)
      // ------------------------------------------------------------
      if (params.usesPlatform.length) {
        await tx.run(
          updateLabTestStatements.updateLabTestUsesPlatformCypher,
          nextParams
        );
      }

      // ------------------------------------------------------------
      // 5) Return updated labTest
      // ------------------------------------------------------------
      const final = await tx.run(
        updateLabTestStatements.returnUpdatedLabTestCypher,
        { labTestId: finalLabTestId }
      );

      const record = firstRecordOrNull(final);
      if (!record) throw new Error("updateLabTest: labTest not found after writes");
      const node = record.get("lt");
      return node?.properties ?? node;
    });

    return labTest as LabTest;
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
