import { CaseStudy, ICaseStudy } from "../models/CaseStudy";
import { toObjectIds } from "./utils/general";
import { mergeAndDedupeIds } from "./utils/merging";
import {
  CaseStudyCreateWithOptionalIdsInput,
  CaseStudyUpdateWithOptionalIdsInput,
} from "../graphql/inputs/caseStudyInputs";
export async function createCaseStudyWithOptionalIds(
  input: CaseStudyCreateWithOptionalIdsInput
): Promise<ICaseStudy> {
  const {
    title,
    summary,
    url,
    sourceType = "other",
    episodeIds,
    compoundIds,
  } = input;

  const episodeObjectIds = episodeIds ? toObjectIds(episodeIds) : [];
  const compoundObjectIds = compoundIds ? toObjectIds(compoundIds) : [];

  const caseStudy = await CaseStudy.create({
    title,
    summary,
    url,
    sourceType,
    episodeIds: episodeObjectIds,
    compoundIds: compoundObjectIds,
  });

  return caseStudy;
}

export async function updateCaseStudyWithOptionalIds(
  input: CaseStudyUpdateWithOptionalIdsInput
): Promise<ICaseStudy> {
  const { id, title, summary, url, sourceType, episodeIds, compoundIds } =
    input;

  const caseStudy = await CaseStudy.findById(id);
  if (!caseStudy) {
    throw new Error("CaseStudy not found");
  }

  if (typeof title === "string") {
    caseStudy.title = title;
  }

  if (typeof summary === "string") {
    caseStudy.summary = summary;
  }

  if (typeof url === "string") {
    caseStudy.url = url;
  }

  if (typeof sourceType === "string") {
    caseStudy.sourceType = sourceType;
  }

  // Merge + dedupe episodeIds if provided
  if (episodeIds && episodeIds.length > 0) {
    caseStudy.episodeIds = mergeAndDedupeIds(caseStudy.episodeIds, episodeIds);
  }

  // Merge + dedupe compoundIds if provided
  if (compoundIds && compoundIds.length > 0) {
    caseStudy.compoundIds = mergeAndDedupeIds(
      caseStudy.compoundIds,
      compoundIds
    );
  }

  await caseStudy.save();
  return caseStudy;
}
