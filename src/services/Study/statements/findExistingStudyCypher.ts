/**
 * Multi-key existence check for Study node.
 *
 * Tries all supplied identifiers in a single query and returns the studyId
 * of any matching Study. The caller checks for duplicates (multiple IDs
 * returned) and routes to create vs update accordingly.
 *
 * Parameters:
 *   $id              — direct studyId (or null)
 *   $registrySource  — e.g. "clinicaltrials.gov" (or null)
 *   $registryId      — e.g. "NCT01234567" (or null)
 *   $doi             — DOI string (or null)
 *   $internalStudyCode — internal code (or null)
 */
export const findExistingStudyCypher = `
OPTIONAL MATCH (s1:Study { studyId: $id })
  WHERE $id IS NOT NULL

OPTIONAL MATCH (s2:Study { registrySource: $registrySource, registryId: $registryId })
  WHERE $registrySource IS NOT NULL AND $registryId IS NOT NULL

OPTIONAL MATCH (s3:Study { doi: $doi })
  WHERE $doi IS NOT NULL

OPTIONAL MATCH (s4:Study { internalStudyCode: $internalStudyCode })
  WHERE $internalStudyCode IS NOT NULL

WITH
  coalesce(s1.studyId, s2.studyId, s3.studyId, s4.studyId) AS studyId
WHERE studyId IS NOT NULL
RETURN studyId
`;
