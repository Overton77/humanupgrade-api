import { StudyIdentifier } from "../types.js";

/**
 * Resolves the best available identifier for a Study node.
 *
 * Priority order:
 *   1. studyId (direct ID)
 *   2. (registrySource + registryId) composite — callers must handle composite separately
 *   3. doi
 *   4. internalStudyCode
 *
 * For the composite registry case this returns key="registryComposite" with
 * value set to `${registrySource}::${registryId}` so the Cypher layer can
 * split it back apart (or callers can detect the "registryComposite" key and
 * pass both params directly to the query).
 */
export function resolveStudyIdentifier(params: {
  id?: string | null;
  registrySource?: string | null;
  registryId?: string | null;
  doi?: string | null;
  internalStudyCode?: string | null;
}): StudyIdentifier {
  if (params.id) {
    return { key: "studyId", value: params.id };
  }
  if (params.registrySource && params.registryId) {
    return {
      key: "registryComposite",
      value: `${params.registrySource}::${params.registryId}`,
    };
  }
  if (params.doi) {
    return { key: "doi", value: params.doi };
  }
  if (params.internalStudyCode) {
    return { key: "internalStudyCode", value: params.internalStudyCode };
  }
  throw new Error(
    "Study identifier required: provide id, (registrySource + registryId), doi, or internalStudyCode"
  );
}
