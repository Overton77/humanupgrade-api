import { PanelDefinitionIdentifierKey } from "../types.js";

export function buildPanelDefinitionUpsertCypher(identifierKey: PanelDefinitionIdentifierKey) {
  return `
    MERGE (pd:PanelDefinition { ${identifierKey}: $idValue })
    ON CREATE SET pd.createdAt = datetime()

    // canonical id must always exist
    SET pd.panelDefinitionId = coalesce(pd.panelDefinitionId, randomUUID())

    SET pd += {
      canonicalName: CASE WHEN $canonicalName IS NULL THEN pd.canonicalName ELSE $canonicalName END,

      aliases: CASE
        WHEN $aliases IS NULL THEN pd.aliases
        ELSE apoc.coll.toSet(coalesce(pd.aliases, []) + coalesce($aliases, []))
      END,

      description: CASE WHEN $description IS NULL THEN pd.description ELSE $description END,

      validAt: CASE WHEN $validAt IS NULL THEN pd.validAt ELSE $validAt END,
      invalidAt: CASE WHEN $invalidAt IS NULL THEN pd.invalidAt ELSE $invalidAt END,
      expiredAt: CASE WHEN $expiredAt IS NULL THEN pd.expiredAt ELSE $expiredAt END
    }

    RETURN pd
  `;
}

// ==================================================================
// INCLUDES_LABTEST (create OR connect) (CONNECT = HARD FAIL if missing)
// ==================================================================
export const panelDefinitionIncludesLabTestCypher = `
MATCH (pd:PanelDefinition {panelDefinitionId: $panelDefinitionId})

UNWIND coalesce($includesLabTest, []) AS iltRel
CALL {
  // ---- CREATE branch ----
  WITH pd, iltRel 
  WITH pd, iltRel 
  WHERE iltRel.labTest.create IS NOT NULL

  MERGE (lt:LabTest {
    labTestId: coalesce(iltRel.labTest.create.labTestId, randomUUID())
  })
  ON CREATE SET lt.createdAt = datetime()

  SET lt += {
    name: CASE WHEN iltRel.labTest.create.name IS NULL THEN lt.name ELSE iltRel.labTest.create.name END,
    synonyms: CASE
      WHEN iltRel.labTest.create.synonyms IS NULL THEN lt.synonyms
      ELSE apoc.coll.toSet(coalesce(lt.synonyms, []) + coalesce(iltRel.labTest.create.synonyms, []))
    END,
    loincCodes: CASE
      WHEN iltRel.labTest.create.loincCodes IS NULL THEN lt.loincCodes
      ELSE apoc.coll.toSet(coalesce(lt.loincCodes, []) + coalesce(iltRel.labTest.create.loincCodes, []))
    END,
    cptCodes: CASE
      WHEN iltRel.labTest.create.cptCodes IS NULL THEN lt.cptCodes
      ELSE apoc.coll.toSet(coalesce(lt.cptCodes, []) + coalesce(iltRel.labTest.create.cptCodes, []))
    END,
    whatItMeasures: CASE WHEN iltRel.labTest.create.whatItMeasures IS NULL THEN lt.whatItMeasures ELSE iltRel.labTest.create.whatItMeasures END,
    prepRequirements: CASE WHEN iltRel.labTest.create.prepRequirements IS NULL THEN lt.prepRequirements ELSE iltRel.labTest.create.prepRequirements END,
    validAt: CASE WHEN iltRel.labTest.create.validAt IS NULL THEN lt.validAt ELSE iltRel.labTest.create.validAt END,
    invalidAt: CASE WHEN iltRel.labTest.create.invalidAt IS NULL THEN lt.invalidAt ELSE iltRel.labTest.create.invalidAt END,
    expiredAt: CASE WHEN iltRel.labTest.create.expiredAt IS NULL THEN lt.expiredAt ELSE iltRel.labTest.create.expiredAt END
  }

  MERGE (pd)-[r:INCLUDES_LABTEST]->(lt)
  ON CREATE SET r.createdAt = datetime()

  SET r += {
    required: CASE WHEN iltRel.required IS NULL THEN r.required ELSE iltRel.required END,
    quantity: CASE WHEN iltRel.quantity IS NULL THEN r.quantity ELSE iltRel.quantity END,
    notes: CASE WHEN iltRel.notes IS NULL THEN r.notes ELSE iltRel.notes END,
    claimIds: CASE
      WHEN iltRel.claimIds IS NULL THEN r.claimIds
      ELSE apoc.coll.toSet(coalesce(r.claimIds, []) + coalesce(iltRel.claimIds, []))
    END,
    createdAt: CASE WHEN iltRel.createdAt IS NULL THEN r.createdAt ELSE iltRel.createdAt END,
    validAt: CASE WHEN iltRel.validAt IS NULL THEN r.validAt ELSE iltRel.validAt END,
    invalidAt: CASE WHEN iltRel.invalidAt IS NULL THEN r.invalidAt ELSE iltRel.invalidAt END,
    expiredAt: CASE WHEN iltRel.expiredAt IS NULL THEN r.expiredAt ELSE iltRel.expiredAt END
  }

  RETURN 1 AS ok

  UNION

  // ---- CONNECT branch (HARD FAIL if missing) ----
  WITH pd, iltRel 
  WITH pd, iltRel
  WHERE iltRel.labTest.connect IS NOT NULL

  OPTIONAL MATCH (lt:LabTest {labTestId: iltRel.labTest.connect.labTestId})
  WITH pd, iltRel, lt

  CALL apoc.util.validate(
    lt IS NULL,
    'INCLUDES_LABTEST connect failed: LabTest not found for labTestId %s',
    [iltRel.labTest.connect.labTestId]
  )

  MERGE (pd)-[r:INCLUDES_LABTEST]->(lt)
  ON CREATE SET r.createdAt = datetime()

  SET r += {
    required: CASE WHEN iltRel.required IS NULL THEN r.required ELSE iltRel.required END,
    quantity: CASE WHEN iltRel.quantity IS NULL THEN r.quantity ELSE iltRel.quantity END,
    notes: CASE WHEN iltRel.notes IS NULL THEN r.notes ELSE iltRel.notes END,
    claimIds: CASE
      WHEN iltRel.claimIds IS NULL THEN r.claimIds
      ELSE apoc.coll.toSet(coalesce(r.claimIds, []) + coalesce(iltRel.claimIds, []))
    END,
    createdAt: CASE WHEN iltRel.createdAt IS NULL THEN r.createdAt ELSE iltRel.createdAt END,
    validAt: CASE WHEN iltRel.validAt IS NULL THEN r.validAt ELSE iltRel.validAt END,
    invalidAt: CASE WHEN iltRel.invalidAt IS NULL THEN r.invalidAt ELSE iltRel.invalidAt END,
    expiredAt: CASE WHEN iltRel.expiredAt IS NULL THEN r.expiredAt ELSE iltRel.expiredAt END
  }

  RETURN 1 AS ok
}

RETURN 1 AS ok
`;

// ==================================================================
// INCLUDES_BIOMARKER (create OR connect) (CONNECT = HARD FAIL if missing)
// ==================================================================
export const panelDefinitionIncludesBiomarkerCypher = `
MATCH (pd:PanelDefinition {panelDefinitionId: $panelDefinitionId})

UNWIND coalesce($includesBiomarker, []) AS ibRel
CALL {
  // ---- CREATE branch ----
  WITH pd, ibRel 
  WITH pd, ibRel 
  WHERE ibRel.biomarker.create IS NOT NULL

  MERGE (bm:Biomarker {
    biomarkerId: coalesce(ibRel.biomarker.create.biomarkerId, randomUUID())
  })
  ON CREATE SET bm.createdAt = datetime()

  SET bm += {
    name: CASE WHEN ibRel.biomarker.create.name IS NULL THEN bm.name ELSE ibRel.biomarker.create.name END,
    synonyms: CASE
      WHEN ibRel.biomarker.create.synonyms IS NULL THEN bm.synonyms
      ELSE apoc.coll.toSet(coalesce(bm.synonyms, []) + coalesce(ibRel.biomarker.create.synonyms, []))
    END,
    description: CASE WHEN ibRel.biomarker.create.description IS NULL THEN bm.description ELSE ibRel.biomarker.create.description END,
    clinicalDomains: CASE
      WHEN ibRel.biomarker.create.clinicalDomains IS NULL THEN bm.clinicalDomains
      ELSE apoc.coll.toSet(coalesce(bm.clinicalDomains, []) + coalesce(ibRel.biomarker.create.clinicalDomains, []))
    END,
    unitsCommon: CASE
      WHEN ibRel.biomarker.create.unitsCommon IS NULL THEN bm.unitsCommon
      ELSE apoc.coll.toSet(coalesce(bm.unitsCommon, []) + coalesce(ibRel.biomarker.create.unitsCommon, []))
    END,
    interpretationNotes: CASE WHEN ibRel.biomarker.create.interpretationNotes IS NULL THEN bm.interpretationNotes ELSE ibRel.biomarker.create.interpretationNotes END,
    validAt: CASE WHEN ibRel.biomarker.create.validAt IS NULL THEN bm.validAt ELSE ibRel.biomarker.create.validAt END,
    invalidAt: CASE WHEN ibRel.biomarker.create.invalidAt IS NULL THEN bm.invalidAt ELSE ibRel.biomarker.create.invalidAt END,
    expiredAt: CASE WHEN ibRel.biomarker.create.expiredAt IS NULL THEN bm.expiredAt ELSE ibRel.biomarker.create.expiredAt END
  }

  MERGE (pd)-[r:INCLUDES_BIOMARKER]->(bm)
  ON CREATE SET r.createdAt = datetime()

  SET r += {
    claimIds: CASE
      WHEN ibRel.claimIds IS NULL THEN r.claimIds
      ELSE apoc.coll.toSet(coalesce(r.claimIds, []) + coalesce(ibRel.claimIds, []))
    END,
    createdAt: CASE WHEN ibRel.createdAt IS NULL THEN r.createdAt ELSE ibRel.createdAt END,
    validAt: CASE WHEN ibRel.validAt IS NULL THEN r.validAt ELSE ibRel.validAt END,
    invalidAt: CASE WHEN ibRel.invalidAt IS NULL THEN r.invalidAt ELSE ibRel.invalidAt END,
    expiredAt: CASE WHEN ibRel.expiredAt IS NULL THEN r.expiredAt ELSE ibRel.expiredAt END
  }

  RETURN 1 AS ok

  UNION

  // ---- CONNECT branch (HARD FAIL if missing) ----
  WITH pd, ibRel 
  WITH pd, ibRel
  WHERE ibRel.biomarker.connect IS NOT NULL

  OPTIONAL MATCH (bm:Biomarker {biomarkerId: ibRel.biomarker.connect.biomarkerId})
  WITH pd, ibRel, bm

  CALL apoc.util.validate(
    bm IS NULL,
    'INCLUDES_BIOMARKER connect failed: Biomarker not found for biomarkerId %s',
    [ibRel.biomarker.connect.biomarkerId]
  )

  MERGE (pd)-[r:INCLUDES_BIOMARKER]->(bm)
  ON CREATE SET r.createdAt = datetime()

  SET r += {
    claimIds: CASE
      WHEN ibRel.claimIds IS NULL THEN r.claimIds
      ELSE apoc.coll.toSet(coalesce(r.claimIds, []) + coalesce(ibRel.claimIds, []))
    END,
    createdAt: CASE WHEN ibRel.createdAt IS NULL THEN r.createdAt ELSE ibRel.createdAt END,
    validAt: CASE WHEN ibRel.validAt IS NULL THEN r.validAt ELSE ibRel.validAt END,
    invalidAt: CASE WHEN ibRel.invalidAt IS NULL THEN r.invalidAt ELSE ibRel.invalidAt END,
    expiredAt: CASE WHEN ibRel.expiredAt IS NULL THEN r.expiredAt ELSE ibRel.expiredAt END
  }

  RETURN 1 AS ok
}

RETURN 1 AS ok
`;

export const returnPanelDefinitionsCypher = `
MATCH (pd:PanelDefinition {panelDefinitionId: $panelDefinitionId})
RETURN pd
`;

export const createPanelDefinitionStatements = {
  panelDefinitionIncludesLabTestCypher,
  panelDefinitionIncludesBiomarkerCypher,
  returnPanelDefinitionsCypher,
};
