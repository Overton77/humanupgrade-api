import {
  executeWrite,
  executeRead,
} from "../../db/neo4j/executor.js";
import { firstRecordOrNull } from "../../db/neo4j/utils.js";
import { logger } from "../../lib/logger.js";
import { validateInput } from "../../lib/validation.js";
import {
  UpsertResearchPlanRefInput,
  UpsertResearchPlanRefInputSchema,
} from "../../graphql/inputs/ResearchPlanRefInputs.js";
import {
  UpsertResearchRunRefInput,
  UpsertResearchRunRefInputSchema,
} from "../../graphql/inputs/ResearchRunRefInputs.js";
import {
  LinkResearchRunUsesPlanInput,
  LinkResearchRunUsesPlanInputSchema,
} from "../../graphql/inputs/ResearchRunRefInputs.js";
import { ResearchPlanRef } from "../../graphql/types/ResearchPlanRefModel.js";
import { ResearchRunRef } from "../../graphql/types/ResearchRunRefModel.js";
import {
  buildResearchPlanRefUpsertCypher,
  returnResearchPlanRefByMongoPlanIdCypher,
} from "./statements/researchPlanRefStatements.js";
import {
  buildResearchRunRefUpsertCypher,
  returnResearchRunRefByMongoRunIdCypher,
} from "./statements/researchRunRefStatements.js";
import {
  linkResearchRunUsesPlanCypher,
  returnResearchRunRefAfterLinkCypher,
} from "./statements/linkResearchRunUsesPlanStatements.js";
import { Errors } from "../../lib/errors.js";

// ============================================================================
// ResearchPlanRef Service
// ============================================================================

export async function upsertResearchPlanRef(
  input: UpsertResearchPlanRefInput
): Promise<ResearchPlanRef> {
  const validated = validateInput(
    UpsertResearchPlanRefInputSchema,
    input,
    "UpsertResearchPlanRefInput"
  );

  const params = {
    mongoPlanId: validated.mongoPlanId,
    label: validated.label ?? null,
    version: validated.version ?? null,
    validAt: validated.validAt ?? null,
    expiredAt: validated.expiredAt ?? null,
    invalidAt: validated.invalidAt ?? null,
    createdAt: validated.createdAt ?? null,
    updatedAt: validated.updatedAt ?? null,
  };

  const upsertCypher = buildResearchPlanRefUpsertCypher();

  try {
    const researchPlanRef = await executeWrite(async (tx) => {
      // 1) Upsert ResearchPlanRef
      const writeRes = await tx.run(upsertCypher, params);

      const upsertRecord = firstRecordOrNull(writeRes);
      if (!upsertRecord)
        throw new Error(
          "upsertResearchPlanRef: no record returned from upsert"
        );

      const node = upsertRecord.get("rpr");
      const resolvedResearchPlanRefId =
        node?.properties?.researchPlanRefId ?? node?.researchPlanRefId;

      if (!resolvedResearchPlanRefId)
        throw Errors.internalError(
          "Write did not produce ResearchPlanRefId. Error"
        );

      // 2) Return ResearchPlanRef
      const finalRes = await tx.run(
        returnResearchPlanRefByMongoPlanIdCypher,
        { mongoPlanId: validated.mongoPlanId }
      );
      const finalRecord = firstRecordOrNull(finalRes);
      if (!finalRecord)
        throw new Error(
          "upsertResearchPlanRef: researchPlanRef not found after write"
        );

      const researchPlanRefData = finalRecord.get("researchPlanRef");
      return researchPlanRefData;
    });

    return researchPlanRef as ResearchPlanRef;
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

// ============================================================================
// ResearchRunRef Service
// ============================================================================

export async function upsertResearchRunRef(
  input: UpsertResearchRunRefInput
): Promise<ResearchRunRef> {
  const validated = validateInput(
    UpsertResearchRunRefInputSchema,
    input,
    "UpsertResearchRunRefInput"
  );

  const params = {
    mongoRunId: validated.mongoRunId,
    label: validated.label ?? null,
    startedAt: validated.startedAt ?? null,
    endedAt: validated.endedAt ?? null,
    validAt: validated.validAt ?? null,
    expiredAt: validated.expiredAt ?? null,
    invalidAt: validated.invalidAt ?? null,
    createdAt: validated.createdAt ?? null,
    updatedAt: validated.updatedAt ?? null,
  };

  const upsertCypher = buildResearchRunRefUpsertCypher();

  try {
    const researchRunRef = await executeWrite(async (tx) => {
      // 1) Upsert ResearchRunRef
      const writeRes = await tx.run(upsertCypher, params);

      const upsertRecord = firstRecordOrNull(writeRes);
      if (!upsertRecord)
        throw new Error(
          "upsertResearchRunRef: no record returned from upsert"
        );

      const node = upsertRecord.get("rrr");
      const resolvedResearchRunRefId =
        node?.properties?.researchRunRefId ?? node?.researchRunRefId;

      if (!resolvedResearchRunRefId)
        throw Errors.internalError(
          "Write did not produce ResearchRunRefId. Error"
        );

      // 2) Return ResearchRunRef
      const finalRes = await tx.run(
        returnResearchRunRefByMongoRunIdCypher,
        { mongoRunId: validated.mongoRunId }
      );
      const finalRecord = firstRecordOrNull(finalRes);
      if (!finalRecord)
        throw new Error(
          "upsertResearchRunRef: researchRunRef not found after write"
        );

      const researchRunRefData = finalRecord.get("researchRunRef");
      return researchRunRefData;
    });

    return researchRunRef as ResearchRunRef;
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

// ============================================================================
// Link ResearchRunRef Uses Plan Service
// ============================================================================

export async function linkResearchRunUsesPlan(
  input: LinkResearchRunUsesPlanInput
): Promise<ResearchRunRef> {
  const validated = validateInput(
    LinkResearchRunUsesPlanInputSchema,
    input,
    "LinkResearchRunUsesPlanInput"
  );

  const params = {
    mongoRunId: validated.mongoRunId,
    mongoPlanId: validated.mongoPlanId,
    validAt: validated.validAt ?? null,
    expiredAt: validated.expiredAt ?? null,
    invalidAt: validated.invalidAt ?? null,
    createdAt: validated.createdAt ?? null,
    updatedAt: validated.updatedAt ?? null,
  };

  try {
    const researchRunRef = await executeWrite(async (tx) => {
      // 1) Link ResearchRunRef to ResearchPlanRef
      const linkRes = await tx.run(linkResearchRunUsesPlanCypher, params);

      const linkRecord = firstRecordOrNull(linkRes);
      if (!linkRecord)
        throw new Error(
          "linkResearchRunUsesPlan: no record returned from link"
        );

      // 2) Return ResearchRunRef
      const finalRes = await tx.run(
        returnResearchRunRefAfterLinkCypher,
        { mongoRunId: validated.mongoRunId }
      );
      const finalRecord = firstRecordOrNull(finalRes);
      if (!finalRecord)
        throw new Error(
          "linkResearchRunUsesPlan: researchRunRef not found after link"
        );

      const researchRunRefData = finalRecord.get("researchRunRef");
      return researchRunRefData;
    });

    return researchRunRef as ResearchRunRef;
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
