import {
  executeWrite,
  executeRead,
} from "../../db/neo4j/executor.js";
import { firstRecordOrNull } from "../../db/neo4j/utils.js";
import { logger } from "../../lib/logger.js";
import { validateInput } from "../../lib/validation.js";
import {
  PanelDefinitionInputWithRelations,
  PanelDefinitionInputWithRelationsSchema,
  UpdatePanelDefinitionInputWithRelations,
  UpdatePanelDefinitionInputWithRelationsSchema,
} from "../../graphql/inputs/PanelDefinitionInputs.js";
import { PanelDefinition } from "../../graphql/types/PanelDefinitionModel.js";
import { createPanelDefinitionStatements, buildPanelDefinitionUpsertCypher } from "./statements/createPanelDefinitionStatements.js";
import { findExistingPanelDefinitionIdCypher } from "./statements/findExistingPanelDefinitionCypher.js";
import { resolvePanelDefinitionIdentifier } from "./utils/resolvePanelDefinitionIdentity.js";
import { Errors } from "../../lib/errors.js";
import { buildPanelDefinitionUpdateCypher, updatePanelDefinitionStatements } from "./statements/updatePanelDefinitionStatements.js";

export async function createPanelDefinitionWithOptionalRelations(
  input: PanelDefinitionInputWithRelations
): Promise<PanelDefinition> {
  const validated = validateInput(
    PanelDefinitionInputWithRelationsSchema,
    input,
    "PanelDefinitionInputWithRelations"
  );

  // IMPORTANT:
  // - For relationship arrays, prefer [] (not null) so UNWIND is predictable.
  // - For scalar/primitive arrays (aliases), your existing null/merge behavior is fine.
  const params = {
    panelDefinitionId: validated.panelDefinitionId ?? null,
    canonicalName: validated.canonicalName,
    aliases: validated.aliases ?? null,
    description: validated.description ?? null,
    validAt: validated.validAt ?? null,
    invalidAt: validated.invalidAt ?? null,
    expiredAt: validated.expiredAt ?? null,

    // Relationship arrays — ALWAYS arrays
    includesLabTest: validated.includesLabTest ?? [],
    includesBiomarker: validated.includesBiomarker ?? [],
  };

  const {
    panelDefinitionIncludesLabTestCypher,
    panelDefinitionIncludesBiomarkerCypher,
    returnPanelDefinitionsCypher,
  } = createPanelDefinitionStatements;

  try {
    const panelDefinition = await executeWrite(async (tx) => {
      const pre = await tx.run(findExistingPanelDefinitionIdCypher, params);
      const foundIds = Array.from(
        new Set(pre.records.map((r) => r.get("panelDefinitionId")).filter(Boolean))
      );

      // 1) Upsert panelDefinition
      let writeRes;

      if (foundIds.length > 1) {
        throw Errors.duplicate("PanelDefinition", foundIds.join(", "));
      }

      if (foundIds.length === 1) {
        const existingPanelDefinitionId = foundIds[0] as string;
        const updateCypher = buildPanelDefinitionUpdateCypher("panelDefinitionId");
        writeRes = await tx.run(updateCypher, { ...params, idValue: existingPanelDefinitionId });
      } else {
        const { key, value } = resolvePanelDefinitionIdentifier(params);
        const upsertCypher = buildPanelDefinitionUpsertCypher(key);
        writeRes = await tx.run(upsertCypher, { ...params, idValue: value });
      }

      const upsertRecord = firstRecordOrNull(writeRes);
      if (!upsertRecord)
        throw new Error("createPanelDefinition: no record returned from upsert");

      const panelDefinitionNode = upsertRecord.get("pd");
      const resolvedPanelDefinitionId = panelDefinitionNode?.properties?.panelDefinitionId ?? panelDefinitionNode?.panelDefinitionId;

      if (!resolvedPanelDefinitionId) throw Errors.internalError("Write did not produce PanelDefinitionID. Error");

      // Update params with actual panelDefinitionId for relationship statements
      const nextParams = { ...params, panelDefinitionId: resolvedPanelDefinitionId };

      // 2) Relationship statements (each its own Cypher statement, still same TX)
      if (nextParams.includesLabTest.length) {
        await tx.run(panelDefinitionIncludesLabTestCypher, nextParams);
      }
      if (nextParams.includesBiomarker.length) {
        await tx.run(panelDefinitionIncludesBiomarkerCypher, nextParams);
      }

      // 3) Return panelDefinition at end
      const finalRes = await tx.run(returnPanelDefinitionsCypher, { panelDefinitionId: resolvedPanelDefinitionId });
      const finalRecord = firstRecordOrNull(finalRes);
      if (!finalRecord)
        throw new Error("createPanelDefinition: panelDefinition not found after writes");

      const node = finalRecord.get("pd");
      return node?.properties ?? node;
    });

    return panelDefinition as PanelDefinition;
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

export async function updatePanelDefinitionWithOptionalRelations(
  input: UpdatePanelDefinitionInputWithRelations
): Promise<PanelDefinition> {
  const validated = validateInput(
    UpdatePanelDefinitionInputWithRelationsSchema,
    input,
    "UpdatePanelDefinitionInputWithRelations"
  );

  // Keep params as primitives/arrays; each tx.run block plucks what it needs.
  const params = {
    panelDefinitionId: validated.panelDefinitionId ?? null,
    canonicalName: validated.canonicalName ?? null,
    aliases: validated.aliases ?? null,
    description: validated.description ?? null,
    validAt: validated.validAt ?? null,
    invalidAt: validated.invalidAt ?? null,
    expiredAt: validated.expiredAt ?? null,

    // Relationship arrays — ALWAYS arrays
    includesLabTest: validated.includesLabTest ?? [],
    includesBiomarker: validated.includesBiomarker ?? [],
  };

  // Resolve identifier for update
  const { key, value } = resolvePanelDefinitionIdentifier(params);
  const updateCypher = buildPanelDefinitionUpdateCypher(key);

  try {
    const panelDefinition = await executeWrite(async (tx) => {
      // ------------------------------------------------------------
      // 0) Ensure panelDefinition exists + update its scalar fields
      // ------------------------------------------------------------
      let panelDefinitionNode: PanelDefinition | null;
      {
        const res = await tx.run(updateCypher, { ...params, idValue: value });

        const record = firstRecordOrNull(res);
        if (!record) throw new Error("updatePanelDefinition: no record returned");

        const panelDefinitionRecord = record.get("pd");

        if (!panelDefinitionRecord) throw Errors.internalError("PanelDefinition not found");

        panelDefinitionNode = panelDefinitionRecord;
      }

      const finalPanelDefinitionId: string | null =
        (panelDefinitionNode as any)?.properties?.panelDefinitionId ?? (panelDefinitionNode as any)?.panelDefinitionId;

      if (!finalPanelDefinitionId)
        throw Errors.internalError("PanelDefinition ID is required");

      const nextParams = {
        ...params,
        panelDefinitionId: finalPanelDefinitionId,
      };

      // ------------------------------------------------------------
      // 1) INCLUDES_LABTEST (create / connect / update)
      // ------------------------------------------------------------
      if (params.includesLabTest.length) {
        await tx.run(
          updatePanelDefinitionStatements.updatePanelDefinitionIncludesLabTestCypher,
          nextParams
        );
      }

      // ------------------------------------------------------------
      // 2) INCLUDES_BIOMARKER (create / connect / update)
      // ------------------------------------------------------------
      if (params.includesBiomarker.length) {
        await tx.run(
          updatePanelDefinitionStatements.updatePanelDefinitionIncludesBiomarkerCypher,
          nextParams
        );
      }

      // ------------------------------------------------------------
      // 3) Return updated panelDefinition
      // ------------------------------------------------------------
      const final = await tx.run(
        updatePanelDefinitionStatements.returnUpdatedPanelDefinitionCypher,
        { panelDefinitionId: finalPanelDefinitionId }
      );

      const record = firstRecordOrNull(final);
      if (!record) throw new Error("updatePanelDefinition: panelDefinition not found after writes");
      const node = record.get("pd");
      return node?.properties ?? node;
    });

    return panelDefinition as PanelDefinition;
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
