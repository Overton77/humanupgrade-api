import { BiomarkerIdentifierKey } from "../types.js";

export function buildBiomarkerUpsertCypher(identifierKey: BiomarkerIdentifierKey) {
  return `
    MERGE (bm:Biomarker { ${identifierKey}: $idValue })
    ON CREATE SET bm.createdAt = datetime()

    // canonical id must always exist
    SET bm.biomarkerId = coalesce(bm.biomarkerId, randomUUID())

    SET bm += {
      name: CASE WHEN $name IS NULL THEN bm.name ELSE $name END,

      synonyms: CASE
        WHEN $synonyms IS NULL THEN bm.synonyms
        ELSE apoc.coll.toSet(coalesce(bm.synonyms, []) + coalesce($synonyms, []))
      END,

      description: CASE WHEN $description IS NULL THEN bm.description ELSE $description END,

      clinicalDomains: CASE
        WHEN $clinicalDomains IS NULL THEN bm.clinicalDomains
        ELSE apoc.coll.toSet(coalesce(bm.clinicalDomains, []) + coalesce($clinicalDomains, []))
      END,

      unitsCommon: CASE
        WHEN $unitsCommon IS NULL THEN bm.unitsCommon
        ELSE apoc.coll.toSet(coalesce(bm.unitsCommon, []) + coalesce($unitsCommon, []))
      END,

      interpretationNotes: CASE WHEN $interpretationNotes IS NULL THEN bm.interpretationNotes ELSE $interpretationNotes END,

      validAt: CASE WHEN $validAt IS NULL THEN bm.validAt ELSE $validAt END,
      invalidAt: CASE WHEN $invalidAt IS NULL THEN bm.invalidAt ELSE $invalidAt END,
      expiredAt: CASE WHEN $expiredAt IS NULL THEN bm.expiredAt ELSE $expiredAt END
    }

    RETURN bm
  `;
}

export const returnBiomarkersCypher = `
MATCH (bm:Biomarker {biomarkerId: $biomarkerId})
RETURN bm
`;

export const createBiomarkerStatements = {
  returnBiomarkersCypher,
};
