export const organizationSuppliesCompoundFormCypher = `
// ==================================================================
// SUPPLIES_COMPOUND_FORM (create OR connect) (CONNECT = HARD FAIL if missing)
// ==================================================================
MATCH (o:Organization {organizationId: $organizationId})

UNWIND coalesce($suppliesCompoundForm, []) AS scfRel
CALL {
  // ---- CREATE branch ----
  WITH o, scfRel
  WITH o, scfRel  
  WHERE scfRel.compoundForm.create IS NOT NULL

  MERGE (cf:CompoundForm { compoundFormId: coalesce(scfRel.compoundForm.create.compoundFormId, randomUUID()) })
  ON CREATE SET cf.createdAt = datetime()

  SET cf += {
    canonicalName: CASE WHEN scfRel.compoundForm.create.canonicalName IS NULL THEN cf.canonicalName ELSE scfRel.compoundForm.create.canonicalName END,
    formType: CASE WHEN scfRel.compoundForm.create.formType IS NULL THEN cf.formType ELSE scfRel.compoundForm.create.formType END,
    chemicalDifferences: CASE WHEN scfRel.compoundForm.create.chemicalDifferences IS NULL THEN cf.chemicalDifferences ELSE scfRel.compoundForm.create.chemicalDifferences END,
    stabilityProfile: CASE WHEN scfRel.compoundForm.create.stabilityProfile IS NULL THEN cf.stabilityProfile ELSE scfRel.compoundForm.create.stabilityProfile END,
    solubilityProfile: CASE WHEN scfRel.compoundForm.create.solubilityProfile IS NULL THEN cf.solubilityProfile ELSE scfRel.compoundForm.create.solubilityProfile END,
    bioavailabilityNotes: CASE WHEN scfRel.compoundForm.create.bioavailabilityNotes IS NULL THEN cf.bioavailabilityNotes ELSE scfRel.compoundForm.create.bioavailabilityNotes END,
    regulatoryStatusSummary: CASE WHEN scfRel.compoundForm.create.regulatoryStatusSummary IS NULL THEN cf.regulatoryStatusSummary ELSE scfRel.compoundForm.create.regulatoryStatusSummary END
  }

  MERGE (o)-[r:SUPPLIES_COMPOUND_FORM]->(cf)
  ON CREATE SET r.createdAt = datetime()

  SET r += {
    createdAt: CASE WHEN scfRel.createdAt IS NULL THEN r.createdAt ELSE scfRel.createdAt END,
    validAt: CASE WHEN scfRel.validAt IS NULL THEN r.validAt ELSE scfRel.validAt END,
    invalidAt: CASE WHEN scfRel.invalidAt IS NULL THEN r.invalidAt ELSE scfRel.invalidAt END,
    expiredAt: CASE WHEN scfRel.expiredAt IS NULL THEN r.expiredAt ELSE scfRel.expiredAt END
  }

  RETURN 1 AS ok

  UNION

  // ---- CONNECT branch (HARD FAIL if missing) ----
  WITH o, scfRel
  WITH o, scfRel  
  WHERE scfRel.compoundForm.connect IS NOT NULL

  OPTIONAL MATCH (cf:CompoundForm {compoundFormId: scfRel.compoundForm.connect.compoundFormId})
  WITH o, scfRel, cf

  CALL apoc.util.validate(
    cf IS NULL,
    'SUPPLIES_COMPOUND_FORM connect failed: CompoundForm not found for compoundFormId %s',
    [scfRel.compoundForm.connect.compoundFormId]
  )

  MERGE (o)-[r:SUPPLIES_COMPOUND_FORM]->(cf)
  ON CREATE SET r.createdAt = datetime()

  SET r += {
    createdAt: CASE WHEN scfRel.createdAt IS NULL THEN r.createdAt ELSE scfRel.createdAt END,
    validAt: CASE WHEN scfRel.validAt IS NULL THEN r.validAt ELSE scfRel.validAt END,
    invalidAt: CASE WHEN scfRel.invalidAt IS NULL THEN r.invalidAt ELSE scfRel.invalidAt END,
    expiredAt: CASE WHEN scfRel.expiredAt IS NULL THEN r.expiredAt ELSE scfRel.expiredAt END
  }

  RETURN 1 AS ok
}

RETURN 1 AS ok
`;

export const updateOrganizationSuppliesCompoundFormCypher = `
  MATCH (o:Organization {organizationId: $organizationId})
  UNWIND $suppliesCompoundForm AS rel
  CALL {
    // ---------------- CREATE ----------------
    WITH o, rel
    WITH o, rel WHERE rel.compoundForm.create IS NOT NULL
  
    MERGE (cf:CompoundForm {compoundFormId: coalesce(rel.compoundForm.create.compoundFormId, randomUUID())})
    ON CREATE SET cf.createdAt = datetime()
  
    SET cf += {
      canonicalName: CASE WHEN rel.compoundForm.create.canonicalName IS NULL THEN cf.canonicalName ELSE rel.compoundForm.create.canonicalName END,
      formType: CASE WHEN rel.compoundForm.create.formType IS NULL THEN cf.formType ELSE rel.compoundForm.create.formType END,
      chemicalDifferences: CASE WHEN rel.compoundForm.create.chemicalDifferences IS NULL THEN cf.chemicalDifferences ELSE rel.compoundForm.create.chemicalDifferences END,
      stabilityProfile: CASE WHEN rel.compoundForm.create.stabilityProfile IS NULL THEN cf.stabilityProfile ELSE rel.compoundForm.create.stabilityProfile END,
      solubilityProfile: CASE WHEN rel.compoundForm.create.solubilityProfile IS NULL THEN cf.solubilityProfile ELSE rel.compoundForm.create.solubilityProfile END,
      bioavailabilityNotes: CASE WHEN rel.compoundForm.create.bioavailabilityNotes IS NULL THEN cf.bioavailabilityNotes ELSE rel.compoundForm.create.bioavailabilityNotes END,
      regulatoryStatusSummary: CASE WHEN rel.compoundForm.create.regulatoryStatusSummary IS NULL THEN cf.regulatoryStatusSummary ELSE rel.compoundForm.create.regulatoryStatusSummary END
    }
  
    MERGE (o)-[r:SUPPLIES_COMPOUND_FORM]->(cf)
    ON CREATE SET r.createdAt = datetime()
  
    SET r += {
      createdAt: CASE WHEN rel.createdAt IS NULL THEN r.createdAt ELSE rel.createdAt END,
      validAt: CASE WHEN rel.validAt IS NULL THEN r.validAt ELSE rel.validAt END,
      invalidAt: CASE WHEN rel.invalidAt IS NULL THEN r.invalidAt ELSE rel.invalidAt END,
      expiredAt: CASE WHEN rel.expiredAt IS NULL THEN r.expiredAt ELSE rel.expiredAt END
    }
  
    RETURN 1 AS okSCF
  
    UNION
  
    // ---------------- CONNECT (strict) ----------------
    WITH o, rel
    WITH o, rel WHERE rel.compoundForm.connect IS NOT NULL
  
    OPTIONAL MATCH (cf2:CompoundForm {compoundFormId: rel.compoundForm.connect.compoundFormId})
    CALL apoc.util.validate(
      cf2 IS NULL,
      'SUPPLIES_COMPOUND_FORM connect failed: CompoundForm not found for compoundFormId %s',
      [rel.compoundForm.connect.compoundFormId]
    )
  
    MERGE (o)-[r2:SUPPLIES_COMPOUND_FORM]->(cf2)
    ON CREATE SET r2.createdAt = datetime()
  
    SET r2 += {
      createdAt: CASE WHEN rel.createdAt IS NULL THEN r2.createdAt ELSE rel.createdAt END,
      validAt: CASE WHEN rel.validAt IS NULL THEN r2.validAt ELSE rel.validAt END,
      invalidAt: CASE WHEN rel.invalidAt IS NULL THEN r2.invalidAt ELSE rel.invalidAt END,
      expiredAt: CASE WHEN rel.expiredAt IS NULL THEN r2.expiredAt ELSE rel.expiredAt END
    }
  
    RETURN 1 AS okSCF
  
    UNION
  
    // ---------------- UPDATE (strict) ----------------
    WITH o, rel
    WITH o, rel WHERE rel.compoundForm.update IS NOT NULL
  
    CALL apoc.util.validate(
      rel.compoundForm.update.compoundFormId IS NULL,
      'SUPPLIES_COMPOUND_FORM update failed: compoundForm.update.compoundFormId is required',
      []
    )
  
    OPTIONAL MATCH (cf3:CompoundForm {compoundFormId: rel.compoundForm.update.compoundFormId})
    OPTIONAL MATCH (o)-[r3:SUPPLIES_COMPOUND_FORM]->(cf3)
  
    CALL apoc.util.validate(
      cf3 IS NULL,
      'SUPPLIES_COMPOUND_FORM update failed: CompoundForm not found for compoundFormId %s',
      [rel.compoundForm.update.compoundFormId]
    )
    CALL apoc.util.validate(
      r3 IS NULL,
      'SUPPLIES_COMPOUND_FORM update failed: relationship not found for org %s -> compoundForm %s',
      [$organizationId, rel.compoundForm.update.compoundFormId]
    )
  
    SET cf3 += {
      canonicalName: CASE WHEN rel.compoundForm.update.canonicalName IS NULL THEN cf3.canonicalName ELSE rel.compoundForm.update.canonicalName END,
      formType: CASE WHEN rel.compoundForm.update.formType IS NULL THEN cf3.formType ELSE rel.compoundForm.update.formType END,
      chemicalDifferences: CASE WHEN rel.compoundForm.update.chemicalDifferences IS NULL THEN cf3.chemicalDifferences ELSE rel.compoundForm.update.chemicalDifferences END,
      stabilityProfile: CASE WHEN rel.compoundForm.update.stabilityProfile IS NULL THEN cf3.stabilityProfile ELSE rel.compoundForm.update.stabilityProfile END,
      solubilityProfile: CASE WHEN rel.compoundForm.update.solubilityProfile IS NULL THEN cf3.solubilityProfile ELSE rel.compoundForm.update.solubilityProfile END,
      bioavailabilityNotes: CASE WHEN rel.compoundForm.update.bioavailabilityNotes IS NULL THEN cf3.bioavailabilityNotes ELSE rel.compoundForm.update.bioavailabilityNotes END,
      regulatoryStatusSummary: CASE WHEN rel.compoundForm.update.regulatoryStatusSummary IS NULL THEN cf3.regulatoryStatusSummary ELSE rel.compoundForm.update.regulatoryStatusSummary END
    }
  
    SET r3 += {
      createdAt: CASE WHEN rel.createdAt IS NULL THEN r3.createdAt ELSE rel.createdAt END,
      validAt: CASE WHEN rel.validAt IS NULL THEN r3.validAt ELSE rel.validAt END,
      invalidAt: CASE WHEN rel.invalidAt IS NULL THEN r3.invalidAt ELSE rel.invalidAt END,
      expiredAt: CASE WHEN rel.expiredAt IS NULL THEN r3.expiredAt ELSE rel.expiredAt END
    }
  
    RETURN 1 AS okSCF
  }
  RETURN count(*) AS _suppliesCompoundFormProcessed
            `;
