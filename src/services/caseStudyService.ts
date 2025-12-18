import {
  CaseStudy,
  type ICaseStudy,
  type CaseStudyDoc,
  type CaseStudyModel,
} from "../models/CaseStudy.js";
import { BaseService } from "./BaseService.js";
import { withTransaction } from "../lib/transactions.js";
import { validateInput } from "../lib/validation.js";
import { toObjectIds } from "./utils/general.js";
import { mergeAndDedupeIds } from "./utils/merging.js";

import type {
  CaseStudyCreateWithOptionalIdsInput,
  CaseStudyUpdateWithOptionalIdsInput,
} from "../graphql/inputs/caseStudyInputs.js";

import {
  CaseStudyCreateWithOptionalIdsInputSchema,
  CaseStudyUpdateWithOptionalIdsInputSchema,
} from "../graphql/inputs/schemas/caseStudySchemas.js";

class CaseStudyService extends BaseService<
  ICaseStudy,
  CaseStudyDoc,
  CaseStudyModel
> {
  constructor() {
    super(CaseStudy, "caseStudyService", "CaseStudy");
  }

  /**
   * One-way refs only. No mirror sync calls.
   */
  async createCaseStudyWithOptionalIds(
    input: CaseStudyCreateWithOptionalIdsInput
  ): Promise<ICaseStudy> {
    const validated = validateInput(
      CaseStudyCreateWithOptionalIdsInputSchema,
      input,
      "CaseStudyCreateWithOptionalIdsInput"
    );

    const { title, summary, url, sourceType, episodeIds, compoundIds } =
      validated;

    return withTransaction(
      async (session) => {
        const [caseStudy] = await CaseStudy.create(
          [
            {
              title,
              summary,
              url,
              sourceType, // schema default may also handle this; using validated value is fine
              episodeIds: episodeIds ? toObjectIds(episodeIds) : [],
              compoundIds: compoundIds ? toObjectIds(compoundIds) : [],
            },
          ],
          { session }
        );

        return caseStudy;
      },
      { operation: "createCaseStudyWithOptionalIds", caseStudyTitle: title }
    );
  }

  /**
   * Semantics: "add these" episodeIds/compoundIds (merge+dedupe; no removals).
   * Scalars overwrite if provided.
   */
  async updateCaseStudyWithOptionalIds(
    input: CaseStudyUpdateWithOptionalIdsInput
  ): Promise<ICaseStudy> {
    const validated = validateInput(
      CaseStudyUpdateWithOptionalIdsInputSchema,
      input,
      "CaseStudyUpdateWithOptionalIdsInput"
    );

    const { id, title, summary, url, sourceType, episodeIds, compoundIds } =
      validated;

    return withTransaction(
      async (session) => {
        const caseStudy = await this.findById(id, { session });

        if (title !== undefined) caseStudy.title = title;
        if (summary !== undefined) caseStudy.summary = summary;
        if (url !== undefined) caseStudy.url = url;
        if (sourceType !== undefined) caseStudy.sourceType = sourceType;

        if (episodeIds?.length) {
          caseStudy.episodeIds = mergeAndDedupeIds(
            caseStudy.episodeIds ?? [],
            episodeIds
          );
        }

        if (compoundIds?.length) {
          caseStudy.compoundIds = mergeAndDedupeIds(
            caseStudy.compoundIds ?? [],
            compoundIds
          );
        }

        await caseStudy.save({ session });
        return caseStudy;
      },
      { operation: "updateCaseStudyWithOptionalIds", caseStudyId: id }
    );
  }
}

export const caseStudyService = new CaseStudyService();

// Backward compatible function exports
export const createCaseStudyWithOptionalIds = (
  input: CaseStudyCreateWithOptionalIdsInput
) => caseStudyService.createCaseStudyWithOptionalIds(input);

export const updateCaseStudyWithOptionalIds = (
  input: CaseStudyUpdateWithOptionalIdsInput
) => caseStudyService.updateCaseStudyWithOptionalIds(input);
