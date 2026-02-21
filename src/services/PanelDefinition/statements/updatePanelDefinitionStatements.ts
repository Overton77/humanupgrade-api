import { PanelDefinitionIdentifierKey } from "../types.js";

export function buildPanelDefinitionUpdateCypher(identifierKey: PanelDefinitionIdentifierKey) {
  return `
    OPTIONAL MATCH (pd:PanelDefinition { ${identifierKey}: $idValue })
    CALL apoc.util.validate(
      pd IS NULL,
      'updatePanelDefinition failed: PanelDefinition not found for ${identifierKey} %s',
      [$idValue]
    )

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
// INCLUDES_LABTEST (create / connect / update)
// ==================================================================
export const updatePanelDefinitionIncludesLabTestCypher = `
MATCH (pd:PanelDefinition {panelDefinitionId: $panelDefinitionId})
UNWIND $includesLabTest AS rel
CALL {
  // ---------------- CREATE ----------------
  WITH pd, rel
  WITH pd, rel WHERE rel.labTest.create IS NOT NULL

  MERGE (lt:LabTest { labTestId: coalesce(rel.labTest.create.labTestId, randomUUID()) })
  ON CREATE SET lt.createdAt = datetime()

  SET lt += {
    name: CASE WHEN rel.labTest.create.name IS NULL THEN lt.name ELSE rel.labTest.create.name END,
    synonyms: CASE
      WHEN rel.labTest.create.synonyms IS NULL THEN lt.synonyms
      ELSE apoc.coll.toSet(coalesce(lt.synonyms, []) + coalesce(rel.labTest.create.synonyms, []))
    END,
    loincCodes: CASE
      WHEN rel.labTest.create.loincCodes IS NULL THEN lt.loincCodes
      ELSE apoc.coll.toSet(coalesce(lt.loincCodes, []) + coalesce(rel.labTest.create.loincCodes, []))
    END,
    cptCodes: CASE
      WHEN rel.labTest.create.cptCodes IS NULL THEN lt.cptCodes
      ELSE apoc.coll.toSet(coalesce(lt.cptCodes, []) + coalesce(rel.labTest.create.cptCodes, []))
    END,
    whatItMeasures: CASE WHEN rel.labTest.create.whatItMeasures IS NULL THEN lt.whatItMeasures ELSE rel.labTest.create.whatItMeasures END,
    prepRequirements: CASE WHEN rel.labTest.create.prepRequirements IS NULL THEN lt.prepRequirements ELSE rel.labTest.create.prepRequirements END,
    validAt: CASE WHEN rel.labTest.create.validAt IS NULL THEN lt.validAt ELSE rel.labTest.create.validAt END,
    invalidAt: CASE WHEN rel.labTest.create.invalidAt IS NULL THEN lt.invalidAt ELSE rel.labTest.create.invalidAt END,
    expiredAt: CASE WHEN rel.labTest.create.expiredAt IS NULL THEN lt.expiredAt ELSE rel.labTest.create.expiredAt END
  }

  MERGE (pd)-[r:INCLUDES_LABTEST]->(lt)
  ON CREATE SET r.createdAt = datetime()

  SET r += {
    required: CASE WHEN rel.required IS NULL THEN r.required ELSE rel.required END,
    quantity: CASE WHEN rel.quantity IS NULL THEN r.quantity ELSE rel.quantity END,
    notes: CASE WHEN rel.notes IS NULL THEN r.notes ELSE rel.notes END,
    claimIds: CASE
      WHEN rel.claimIds IS NULL THEN r.claimIds
      ELSE apoc.coll.toSet(coalesce(r.claimIds, []) + coalesce(rel.claimIds, []))
    END,
    createdAt: CASE WHEN rel.createdAt IS NULL THEN r.createdAt ELSE rel.createdAt END,
    validAt: CASE WHEN rel.validAt IS NULL THEN r.validAt ELSE rel.validAt END,
    invalidAt: CASE WHEN rel.invalidAt IS NULL THEN r.invalidAt ELSE rel.invalidAt END,
    expiredAt: CASE WHEN rel.expiredAt IS NULL THEN r.expiredAt ELSE rel.expiredAt END
  }

  RETURN 1 AS okILT

  UNION

  // ---------------- CONNECT (strict: target must exist) ----------------
  WITH pd, rel
  WITH pd, rel WHERE rel.labTest.connect IS NOT NULL

  OPTIONAL MATCH (lt2:LabTest {labTestId: rel.labTest.connect.labTestId})
  CALL apoc.util.validate(
    lt2 IS NULL,
    'INCLUDES_LABTEST connect failed: LabTest not found for labTestId %s',
    [rel.labTest.connect.labTestId]
  )

  MERGE (pd)-[r2:INCLUDES_LABTEST]->(lt2)
  ON CREATE SET r2.createdAt = datetime()

  SET r2 += {
    required: CASE WHEN rel.required IS NULL THEN r2.required ELSE rel.required END,
    quantity: CASE WHEN rel.quantity IS NULL THEN r2.quantity ELSE rel.quantity END,
    notes: CASE WHEN rel.notes IS NULL THEN r2.notes ELSE rel.notes END,
    claimIds: CASE
      WHEN rel.claimIds IS NULL THEN r2.claimIds
      ELSE apoc.coll.toSet(coalesce(r2.claimIds, []) + coalesce(rel.claimIds, []))
    END,
    createdAt: CASE WHEN rel.createdAt IS NULL THEN r2.createdAt ELSE rel.createdAt END,
    validAt: CASE WHEN rel.validAt IS NULL THEN r2.validAt ELSE rel.validAt END,
    invalidAt: CASE WHEN rel.invalidAt IS NULL THEN r2.invalidAt ELSE rel.invalidAt END,
    expiredAt: CASE WHEN rel.expiredAt IS NULL THEN r2.expiredAt ELSE rel.expiredAt END
  }

  RETURN 1 AS okILT

  UNION

  // ---------------- UPDATE (strict: node + relationship must exist) ----------------
  WITH pd, rel
  WITH pd, rel WHERE rel.labTest.update IS NOT NULL

  CALL apoc.util.validate(
    rel.labTest.update.labTestId IS NULL,
    'INCLUDES_LABTEST update failed: labTest.update.labTestId is required',
    []
  )

  OPTIONAL MATCH (lt3:LabTest {labTestId: rel.labTest.update.labTestId})
  OPTIONAL MATCH (pd)-[r3:INCLUDES_LABTEST]->(lt3)

  CALL apoc.util.validate(
    lt3 IS NULL,
    'INCLUDES_LABTEST update failed: LabTest not found for labTestId %s',
    [rel.labTest.update.labTestId]
  )
  CALL apoc.util.validate(
    r3 IS NULL,
    'INCLUDES_LABTEST update failed: INCLUDES_LABTEST relationship not found for panelDefinition %s -> labTest %s',
    [$panelDefinitionId, rel.labTest.update.labTestId]
  )

  SET lt3 += {
    name: CASE WHEN rel.labTest.update.name IS NULL THEN lt3.name ELSE rel.labTest.update.name END,
    synonyms: CASE
      WHEN rel.labTest.update.synonyms IS NULL THEN lt3.synonyms
      ELSE apoc.coll.toSet(coalesce(lt3.synonyms, []) + coalesce(rel.labTest.update.synonyms, []))
    END,
    loincCodes: CASE
      WHEN rel.labTest.update.loincCodes IS NULL THEN lt3.loincCodes
      ELSE apoc.coll.toSet(coalesce(lt3.loincCodes, []) + coalesce(rel.labTest.update.loincCodes, []))
    END,
    cptCodes: CASE
      WHEN rel.labTest.update.cptCodes IS NULL THEN lt3.cptCodes
      ELSE apoc.coll.toSet(coalesce(lt3.cptCodes, []) + coalesce(rel.labTest.update.cptCodes, []))
    END,
    whatItMeasures: CASE WHEN rel.labTest.update.whatItMeasures IS NULL THEN lt3.whatItMeasures ELSE rel.labTest.update.whatItMeasures END,
    prepRequirements: CASE WHEN rel.labTest.update.prepRequirements IS NULL THEN lt3.prepRequirements ELSE rel.labTest.update.prepRequirements END,
    validAt: CASE WHEN rel.labTest.update.validAt IS NULL THEN lt3.validAt ELSE rel.labTest.update.validAt END,
    invalidAt: CASE WHEN rel.labTest.update.invalidAt IS NULL THEN lt3.invalidAt ELSE rel.labTest.update.invalidAt END,
    expiredAt: CASE WHEN rel.labTest.update.expiredAt IS NULL THEN lt3.expiredAt ELSE rel.labTest.update.expiredAt END
  }

  SET r3 += {
    required: CASE WHEN rel.required IS NULL THEN r3.required ELSE rel.required END,
    quantity: CASE WHEN rel.quantity IS NULL THEN r3.quantity ELSE rel.quantity END,
    notes: CASE WHEN rel.notes IS NULL THEN r3.notes ELSE rel.notes END,
    claimIds: CASE
      WHEN rel.claimIds IS NULL THEN r3.claimIds
      ELSE apoc.coll.toSet(coalesce(r3.claimIds, []) + coalesce(rel.claimIds, []))
    END,
    createdAt: CASE WHEN rel.createdAt IS NULL THEN r3.createdAt ELSE rel.createdAt END,
    validAt: CASE WHEN rel.validAt IS NULL THEN r3.validAt ELSE rel.validAt END,
    invalidAt: CASE WHEN rel.invalidAt IS NULL THEN r3.invalidAt ELSE rel.invalidAt END,
    expiredAt: CASE WHEN rel.expiredAt IS NULL THEN r3.expiredAt ELSE rel.expiredAt END
  }

  RETURN 1 AS okILT
}
RETURN count(*) AS _includesLabTestProcessed
`;

// ==================================================================
// INCLUDES_BIOMARKER (create / connect / update)
// ==================================================================
export const updatePanelDefinitionIncludesBiomarkerCypher = `
MATCH (pd:PanelDefinition {panelDefinitionId: $panelDefinitionId})
UNWIND $includesBiomarker AS rel
CALL {
  // ---------------- CREATE ----------------
  WITH pd, rel
  WITH pd, rel WHERE rel.biomarker.create IS NOT NULL

  MERGE (bm:Biomarker { biomarkerId: coalesce(rel.biomarker.create.biomarkerId, randomUUID()) })
  ON CREATE SET bm.createdAt = datetime()

  SET bm += {
    name: CASE WHEN rel.biomarker.create.name IS NULL THEN bm.name ELSE rel.biomarker.create.name END,
    synonyms: CASE
      WHEN rel.biomarker.create.synonyms IS NULL THEN bm.synonyms
      ELSE apoc.coll.toSet(coalesce(bm.synonyms, []) + coalesce(rel.biomarker.create.synonyms, []))
    END,
    description: CASE WHEN rel.biomarker.create.description IS NULL THEN bm.description ELSE rel.biomarker.create.description END,
    clinicalDomains: CASE
      WHEN rel.biomarker.create.clinicalDomains IS NULL THEN bm.clinicalDomains
      ELSE apoc.coll.toSet(coalesce(bm.clinicalDomains, []) + coalesce(rel.biomarker.create.clinicalDomains, []))
    END,
    unitsCommon: CASE
      WHEN rel.biomarker.create.unitsCommon IS NULL THEN bm.unitsCommon
      ELSE apoc.coll.toSet(coalesce(bm.unitsCommon, []) + coalesce(rel.biomarker.create.unitsCommon, []))
    END,
    interpretationNotes: CASE WHEN rel.biomarker.create.interpretationNotes IS NULL THEN bm.interpretationNotes ELSE rel.biomarker.create.interpretationNotes END,
    validAt: CASE WHEN rel.biomarker.create.validAt IS NULL THEN bm.validAt ELSE rel.biomarker.create.validAt END,
    invalidAt: CASE WHEN rel.biomarker.create.invalidAt IS NULL THEN bm.invalidAt ELSE rel.biomarker.create.invalidAt END,
    expiredAt: CASE WHEN rel.biomarker.create.expiredAt IS NULL THEN bm.expiredAt ELSE rel.biomarker.create.expiredAt END
  }

  MERGE (pd)-[r:INCLUDES_BIOMARKER]->(bm)
  ON CREATE SET r.createdAt = datetime()

  SET r += {
    claimIds: CASE
      WHEN rel.claimIds IS NULL THEN r.claimIds
      ELSE apoc.coll.toSet(coalesce(r.claimIds, []) + coalesce(rel.claimIds, []))
    END,
    createdAt: CASE WHEN rel.createdAt IS NULL THEN r.createdAt ELSE rel.createdAt END,
    validAt: CASE WHEN rel.validAt IS NULL THEN r.validAt ELSE rel.validAt END,
    invalidAt: CASE WHEN rel.invalidAt IS NULL THEN r.invalidAt ELSE rel.invalidAt END,
    expiredAt: CASE WHEN rel.expiredAt IS NULL THEN r.expiredAt ELSE rel.expiredAt END
  }

  RETURN 1 AS okIB

  UNION

  // ---------------- CONNECT (strict: target must exist) ----------------
  WITH pd, rel
  WITH pd, rel WHERE rel.biomarker.connect IS NOT NULL

  OPTIONAL MATCH (bm2:Biomarker {biomarkerId: rel.biomarker.connect.biomarkerId})
  CALL apoc.util.validate(
    bm2 IS NULL,
    'INCLUDES_BIOMARKER connect failed: Biomarker not found for biomarkerId %s',
    [rel.biomarker.connect.biomarkerId]
  )

  MERGE (pd)-[r2:INCLUDES_BIOMARKER]->(bm2)
  ON CREATE SET r2.createdAt = datetime()

  SET r2 += {
    claimIds: CASE
      WHEN rel.claimIds IS NULL THEN r2.claimIds
      ELSE apoc.coll.toSet(coalesce(r2.claimIds, []) + coalesce(rel.claimIds, []))
    END,
    createdAt: CASE WHEN rel.createdAt IS NULL THEN r2.createdAt ELSE rel.createdAt END,
    validAt: CASE WHEN rel.validAt IS NULL THEN r2.validAt ELSE rel.validAt END,
    invalidAt: CASE WHEN rel.invalidAt IS NULL THEN r2.invalidAt ELSE rel.invalidAt END,
    expiredAt: CASE WHEN rel.expiredAt IS NULL THEN r2.expiredAt ELSE rel.expiredAt END
  }

  RETURN 1 AS okIB

  UNION

  // ---------------- UPDATE (strict: node + relationship must exist) ----------------
  WITH pd, rel
  WITH pd, rel WHERE rel.biomarker.update IS NOT NULL

  CALL apoc.util.validate(
    rel.biomarker.update.biomarkerId IS NULL,
    'INCLUDES_BIOMARKER update failed: biomarker.update.biomarkerId is required',
    []
  )

  OPTIONAL MATCH (bm3:Biomarker {biomarkerId: rel.biomarker.update.biomarkerId})
  OPTIONAL MATCH (pd)-[r3:INCLUDES_BIOMARKER]->(bm3)

  CALL apoc.util.validate(
    bm3 IS NULL,
    'INCLUDES_BIOMARKER update failed: Biomarker not found for biomarkerId %s',
    [rel.biomarker.update.biomarkerId]
  )
  CALL apoc.util.validate(
    r3 IS NULL,
    'INCLUDES_BIOMARKER update failed: INCLUDES_BIOMARKER relationship not found for panelDefinition %s -> biomarker %s',
    [$panelDefinitionId, rel.biomarker.update.biomarkerId]
  )

  SET bm3 += {
    name: CASE WHEN rel.biomarker.update.name IS NULL THEN bm3.name ELSE rel.biomarker.update.name END,
    synonyms: CASE
      WHEN rel.biomarker.update.synonyms IS NULL THEN bm3.synonyms
      ELSE apoc.coll.toSet(coalesce(bm3.synonyms, []) + coalesce(rel.biomarker.update.synonyms, []))
    END,
    description: CASE WHEN rel.biomarker.update.description IS NULL THEN bm3.description ELSE rel.biomarker.update.description END,
    clinicalDomains: CASE
      WHEN rel.biomarker.update.clinicalDomains IS NULL THEN bm3.clinicalDomains
      ELSE apoc.coll.toSet(coalesce(bm3.clinicalDomains, []) + coalesce(rel.biomarker.update.clinicalDomains, []))
    END,
    unitsCommon: CASE
      WHEN rel.biomarker.update.unitsCommon IS NULL THEN bm3.unitsCommon
      ELSE apoc.coll.toSet(coalesce(bm3.unitsCommon, []) + coalesce(rel.biomarker.update.unitsCommon, []))
    END,
    interpretationNotes: CASE WHEN rel.biomarker.update.interpretationNotes IS NULL THEN bm3.interpretationNotes ELSE rel.biomarker.update.interpretationNotes END,
    validAt: CASE WHEN rel.biomarker.update.validAt IS NULL THEN bm3.validAt ELSE rel.biomarker.update.validAt END,
    invalidAt: CASE WHEN rel.biomarker.update.invalidAt IS NULL THEN bm3.invalidAt ELSE rel.biomarker.update.invalidAt END,
    expiredAt: CASE WHEN rel.biomarker.update.expiredAt IS NULL THEN bm3.expiredAt ELSE rel.biomarker.update.expiredAt END
  }

  SET r3 += {
    claimIds: CASE
      WHEN rel.claimIds IS NULL THEN r3.claimIds
      ELSE apoc.coll.toSet(coalesce(r3.claimIds, []) + coalesce(rel.claimIds, []))
    END,
    createdAt: CASE WHEN rel.createdAt IS NULL THEN r3.createdAt ELSE rel.createdAt END,
    validAt: CASE WHEN rel.validAt IS NULL THEN r3.validAt ELSE rel.validAt END,
    invalidAt: CASE WHEN rel.invalidAt IS NULL THEN r3.invalidAt ELSE rel.invalidAt END,
    expiredAt: CASE WHEN rel.expiredAt IS NULL THEN r3.expiredAt ELSE rel.expiredAt END
  }

  RETURN 1 AS okIB
}
RETURN count(*) AS _includesBiomarkerProcessed
`;

export const returnUpdatedPanelDefinitionCypher = `
MATCH (pd:PanelDefinition {panelDefinitionId: $panelDefinitionId})
RETURN pd
`;

export const updatePanelDefinitionStatements = {
  updatePanelDefinitionIncludesLabTestCypher,
  updatePanelDefinitionIncludesBiomarkerCypher,
  returnUpdatedPanelDefinitionCypher,
};
