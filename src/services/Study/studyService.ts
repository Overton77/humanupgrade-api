import { executeWrite } from "../../db/neo4j/executor.js";
import { firstRecordOrNull } from "../../db/neo4j/utils.js";
import { logger } from "../../lib/logger.js";
import { validateInput } from "../../lib/validation.js";
import { Errors } from "../../lib/errors.js";
import {
  UpsertCaseStudyInput,
  UpsertCaseStudyInputSchema,
} from "../../graphql/inputs/CaseStudyInputs.js";
import { Study } from "../../graphql/types/StudyModel.js";
import { resolveStudyIdentifier } from "./utils/resolveStudyIdentity.js";
import { findExistingStudyCypher } from "./statements/findExistingStudyCypher.js";
import {
  buildStudyUpsertCypher,
  buildStudyRegistryUpsertCypher,
  upsertStudyStatements,
} from "./statements/upsertStudyStatements.js";

// ============================================================================
// upsertCaseStudy
//
// Single bundle upsert for a Study node + all its edges.
// Key resolution order: id → (registrySource + registryId) → doi → internalStudyCode
//
// Edge semantics: create-or-connect ONLY (no edge updates).
// ============================================================================

export async function upsertCaseStudy(
  input: UpsertCaseStudyInput
): Promise<Study> {
  const validated = validateInput(
    UpsertCaseStudyInputSchema,
    input,
    "UpsertCaseStudyInput"
  );

  const { study } = validated;

  // Flatten all params so each Cypher statement gets what it needs.
  // Relationship arrays default to [] (not null) so UNWIND is predictable.
  const params = {
    // Study node identity keys
    id: study.id ?? null,
    registrySource: study.registrySource ?? null,
    registryId: study.registryId ?? null,
    doi: study.doi ?? null,
    internalStudyCode: study.internalStudyCode ?? null,

    // Study node scalars
    canonicalTitle: study.canonicalTitle ?? null,
    studyKind: study.studyKind ?? null,
    shortTitle: study.shortTitle ?? null,
    aliases: study.aliases ?? null,
    designKind: study.designKind ?? null,
    status: study.status ?? null,
    phase: study.phase ?? null,
    sampleSize: study.sampleSize ?? null,
    randomized: study.randomized ?? null,
    blinded: study.blinded ?? null,
    comparatorType: study.comparatorType ?? null,
    keywords: study.keywords ?? null,
    locations: study.locations ?? null,
    validAt: study.validAt ?? null,
    invalidAt: study.invalidAt ?? null,
    expiredAt: study.expiredAt ?? null,

    // Relationship arrays — always arrays for UNWIND safety
    evaluates: validated.evaluates ?? [],
    sponsoredBy: validated.sponsoredBy ?? [],
    runBy: validated.runBy ?? [],
    investigatedBy: validated.investigatedBy ?? [],
    studiesPopulations: validated.studiesPopulations ?? [],
    hasDatasets: validated.hasDatasets ?? [],
    investigatesConditions: validated.investigatesConditions ?? [],
    hasOutcomes: validated.hasOutcomes ?? [],
  };

  const {
    studyEvaluatesCypher,
    studySponsoredByCypher,
    studyRunByCypher,
    studyInvestigatedByCypher,
    studyStudiesPopulationCypher,
    studyHasDatasetCypher,
    studyInvestigatesConditionCypher,
    studyHasOutcomeCypher,
    returnStudyCypher,
  } = upsertStudyStatements;

  try {
    const study = await executeWrite(async (tx) => {
      // ------------------------------------------------------------------
      // 0) Find existing Study — multi-key lookup, duplicate guard
      // ------------------------------------------------------------------
      const preRes = await tx.run(findExistingStudyCypher, params);
      const foundIds = Array.from(
        new Set(
          preRes.records.map((r) => r.get("studyId")).filter(Boolean)
        )
      );

      if (foundIds.length > 1) {
        throw Errors.duplicate("Study", foundIds.join(", "));
      }

      // ------------------------------------------------------------------
      // 1) Upsert Study node
      // ------------------------------------------------------------------
      let writeRes;

      if (foundIds.length === 1) {
        // Study exists — update by known studyId
        const existingStudyId = foundIds[0] as string;
        const updateCypher = buildStudyUpsertCypher("studyId");
        writeRes = await tx.run(updateCypher, {
          ...params,
          idValue: existingStudyId,
        });
      } else {
        // Study does not exist — create via best available identifier
        const identifier = resolveStudyIdentifier(params);

        if (identifier.key === "registryComposite") {
          // MERGE on the (registrySource, registryId) pair — no idValue needed
          writeRes = await tx.run(buildStudyRegistryUpsertCypher(), params);
        } else {
          const upsertCypher = buildStudyUpsertCypher(identifier.key);
          writeRes = await tx.run(upsertCypher, {
            ...params,
            idValue: identifier.value,
          });
        }
      }

      const upsertRecord = firstRecordOrNull(writeRes);
      if (!upsertRecord) {
        throw new Error("upsertCaseStudy: no record returned from node upsert");
      }

      const studyNode = upsertRecord.get("s");
      const resolvedStudyId: string | null =
        studyNode?.properties?.studyId ?? studyNode?.studyId ?? null;

      if (!resolvedStudyId) {
        throw Errors.internalError(
          "upsertCaseStudy: write did not produce a studyId"
        );
      }

      // Attach resolved studyId to params so all edge Cyphers can MATCH on it
      const nextParams = { ...params, studyId: resolvedStudyId };

      // ------------------------------------------------------------------
      // 2) EVALUATES edges
      // ------------------------------------------------------------------
      if (nextParams.evaluates.length) {
        await tx.run(studyEvaluatesCypher, nextParams);
      }

      // ------------------------------------------------------------------
      // 3) SPONSORED_BY edges
      // ------------------------------------------------------------------
      if (nextParams.sponsoredBy.length) {
        await tx.run(studySponsoredByCypher, nextParams);
      }

      // ------------------------------------------------------------------
      // 4) RUN_BY edges
      // ------------------------------------------------------------------
      if (nextParams.runBy.length) {
        await tx.run(studyRunByCypher, nextParams);
      }

      // ------------------------------------------------------------------
      // 5) INVESTIGATED_BY edges
      // ------------------------------------------------------------------
      if (nextParams.investigatedBy.length) {
        await tx.run(studyInvestigatedByCypher, nextParams);
      }

      // ------------------------------------------------------------------
      // 6) STUDIES_POPULATION edges
      // ------------------------------------------------------------------
      if (nextParams.studiesPopulations.length) {
        await tx.run(studyStudiesPopulationCypher, nextParams);
      }

      // ------------------------------------------------------------------
      // 7) HAS_DATASET edges
      // ------------------------------------------------------------------
      if (nextParams.hasDatasets.length) {
        await tx.run(studyHasDatasetCypher, nextParams);
      }

      // ------------------------------------------------------------------
      // 8) INVESTIGATES_CONDITION edges
      // ------------------------------------------------------------------
      if (nextParams.investigatesConditions.length) {
        await tx.run(studyInvestigatesConditionCypher, nextParams);
      }

      // ------------------------------------------------------------------
      // 9) HAS_OUTCOME edges
      // ------------------------------------------------------------------
      if (nextParams.hasOutcomes.length) {
        await tx.run(studyHasOutcomeCypher, nextParams);
      }

      // ------------------------------------------------------------------
      // 10) Return final Study node
      // ------------------------------------------------------------------
      const finalRes = await tx.run(returnStudyCypher, {
        studyId: resolvedStudyId,
      });
      const finalRecord = firstRecordOrNull(finalRes);
      if (!finalRecord) {
        throw new Error(
          "upsertCaseStudy: Study not found after writes — possible race condition"
        );
      }

      const node = finalRecord.get("s");
      return node?.properties ?? node;
    });

    return study as Study;
  } catch (err: any) {
    logger.error("upsertCaseStudy Neo4j write failed", {
      message: err?.message,
      code: err?.code,
      name: err?.name,
      stack: err?.stack,
    });
    throw err;
  }
}
