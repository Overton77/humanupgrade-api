/**
 * Identifier keys for Study node lookup.
 * Priority order (highest → lowest):
 *   id → (registrySource + registryId) → doi → internalStudyCode
 */
export type StudyIdentifierKey =
  | "studyId"
  | "registryComposite" // (registrySource + registryId) pair — handled specially
  | "doi"
  | "internalStudyCode";

export type StudyIdentifier = { key: StudyIdentifierKey; value: string };
