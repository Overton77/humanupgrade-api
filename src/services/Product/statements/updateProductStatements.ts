import { ProductIdentifierKey } from "../types.js"; 
// TODO: Add Upsert and Update identifiers logic to  
// TODO: to Relationship statements 

export function buildProductUpdateCypher(identifierKey: ProductIdentifierKey) {
  return `
    OPTIONAL MATCH (p:Product { ${identifierKey}: $idValue })
    CALL apoc.util.validate(
      p IS NULL,
      'updateProduct failed: Product not found for ${identifierKey} %s',
      [$idValue]
    )

    // canonical id must always exist
    SET p.productId = coalesce(p.productId, randomUUID())

    SET p += {
      name: CASE WHEN $name IS NULL THEN p.name ELSE $name END,

      synonyms: CASE
        WHEN $synonyms IS NULL THEN p.synonyms
        ELSE apoc.coll.toSet(coalesce(p.synonyms, []) + coalesce($synonyms, []))
      END,

      productDomain: CASE WHEN $productDomain IS NULL THEN p.productDomain ELSE $productDomain END,
      productType: CASE WHEN $productType IS NULL THEN p.productType ELSE $productType END,
      productFingerprint: CASE WHEN $productFingerprint IS NULL THEN p.productFingerprint ELSE $productFingerprint END,
      intendedUse: CASE WHEN $intendedUse IS NULL THEN p.intendedUse ELSE $intendedUse END,
      description: CASE WHEN $description IS NULL THEN p.description ELSE $description END,
      brandName: CASE WHEN $brandName IS NULL THEN p.brandName ELSE $brandName END,
      modelNumber: CASE WHEN $modelNumber IS NULL THEN p.modelNumber ELSE $modelNumber END,

      gtin: CASE WHEN $gtin IS NULL THEN p.gtin ELSE $gtin END,
      upc: CASE WHEN $upc IS NULL THEN p.upc ELSE $upc END,
      ndcCode: CASE WHEN $ndcCode IS NULL THEN p.ndcCode ELSE $ndcCode END,

      riskClass: CASE WHEN $riskClass IS NULL THEN p.riskClass ELSE $riskClass END,
      currency: CASE WHEN $currency IS NULL THEN p.currency ELSE $currency END,
      priceAmount: CASE WHEN $priceAmount IS NULL THEN p.priceAmount ELSE $priceAmount END,

      validAt: CASE WHEN $validAt IS NULL THEN p.validAt ELSE $validAt END,
      invalidAt: CASE WHEN $invalidAt IS NULL THEN p.invalidAt ELSE $invalidAt END,
      expiredAt: CASE WHEN $expiredAt IS NULL THEN p.expiredAt ELSE $expiredAt END
    }

    RETURN p
  `;
}

// ==================================================================
// DELIVERS_LAB_TEST (create / connect / update)
// ==================================================================
export const updateProductDeliversLabTestCypher = `
MATCH (p:Product {productId: $productId})
UNWIND $deliversLabTest AS rel
CALL {
  // ---------------- CREATE ----------------
  WITH p, rel
  WITH p, rel WHERE rel.labTest.create IS NOT NULL

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

  MERGE (p)-[r:DELIVERS_LAB_TEST]->(lt)
  ON CREATE SET r.createdAt = datetime()

  SET r += {
    role: CASE WHEN rel.role IS NULL THEN r.role ELSE rel.role END,
    quantity: CASE WHEN rel.quantity IS NULL THEN r.quantity ELSE rel.quantity END,
    componentName: CASE WHEN rel.componentName IS NULL THEN r.componentName ELSE rel.componentName END,
    claimIds: CASE
      WHEN rel.claimIds IS NULL THEN r.claimIds
      ELSE apoc.coll.toSet(coalesce(r.claimIds, []) + coalesce(rel.claimIds, []))
    END,
    createdAt: CASE WHEN rel.createdAt IS NULL THEN r.createdAt ELSE rel.createdAt END,
    validAt: CASE WHEN rel.validAt IS NULL THEN r.validAt ELSE rel.validAt END,
    invalidAt: CASE WHEN rel.invalidAt IS NULL THEN r.invalidAt ELSE rel.invalidAt END,
    expiredAt: CASE WHEN rel.expiredAt IS NULL THEN r.expiredAt ELSE rel.expiredAt END
  }

  RETURN 1 AS okDLT

  UNION

  // ---------------- CONNECT (strict: target must exist) ----------------
  WITH p, rel
  WITH p, rel WHERE rel.labTest.connect IS NOT NULL

  OPTIONAL MATCH (lt2:LabTest {labTestId: rel.labTest.connect.labTestId})
  CALL apoc.util.validate(
    lt2 IS NULL,
    'DELIVERS_LAB_TEST connect failed: LabTest not found for labTestId %s',
    [rel.labTest.connect.labTestId]
  )

  MERGE (p)-[r2:DELIVERS_LAB_TEST]->(lt2)
  ON CREATE SET r2.createdAt = datetime()

  SET r2 += {
    role: CASE WHEN rel.role IS NULL THEN r2.role ELSE rel.role END,
    quantity: CASE WHEN rel.quantity IS NULL THEN r2.quantity ELSE rel.quantity END,
    componentName: CASE WHEN rel.componentName IS NULL THEN r2.componentName ELSE rel.componentName END,
    claimIds: CASE
      WHEN rel.claimIds IS NULL THEN r2.claimIds
      ELSE apoc.coll.toSet(coalesce(r2.claimIds, []) + coalesce(rel.claimIds, []))
    END,
    createdAt: CASE WHEN rel.createdAt IS NULL THEN r2.createdAt ELSE rel.createdAt END,
    validAt: CASE WHEN rel.validAt IS NULL THEN r2.validAt ELSE rel.validAt END,
    invalidAt: CASE WHEN rel.invalidAt IS NULL THEN r2.invalidAt ELSE rel.invalidAt END,
    expiredAt: CASE WHEN rel.expiredAt IS NULL THEN r2.expiredAt ELSE rel.expiredAt END
  }

  RETURN 1 AS okDLT

  UNION

  // ---------------- UPDATE (strict: node + relationship must exist) ----------------
  WITH p, rel
  WITH p, rel WHERE rel.labTest.update IS NOT NULL

  CALL apoc.util.validate(
    rel.labTest.update.labTestId IS NULL,
    'DELIVERS_LAB_TEST update failed: labTest.update.labTestId is required',
    []
  )

  OPTIONAL MATCH (lt3:LabTest {labTestId: rel.labTest.update.labTestId})
  OPTIONAL MATCH (p)-[r3:DELIVERS_LAB_TEST]->(lt3)

  CALL apoc.util.validate(
    lt3 IS NULL,
    'DELIVERS_LAB_TEST update failed: LabTest not found for labTestId %s',
    [rel.labTest.update.labTestId]
  )
  CALL apoc.util.validate(
    r3 IS NULL,
    'DELIVERS_LAB_TEST update failed: DELIVERS_LAB_TEST relationship not found for product %s -> labTest %s',
    [$productId, rel.labTest.update.labTestId]
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
    role: CASE WHEN rel.role IS NULL THEN r3.role ELSE rel.role END,
    quantity: CASE WHEN rel.quantity IS NULL THEN r3.quantity ELSE rel.quantity END,
    componentName: CASE WHEN rel.componentName IS NULL THEN r3.componentName ELSE rel.componentName END,
    claimIds: CASE
      WHEN rel.claimIds IS NULL THEN r3.claimIds
      ELSE apoc.coll.toSet(coalesce(r3.claimIds, []) + coalesce(rel.claimIds, []))
    END,
    createdAt: CASE WHEN rel.createdAt IS NULL THEN r3.createdAt ELSE rel.createdAt END,
    validAt: CASE WHEN rel.validAt IS NULL THEN r3.validAt ELSE rel.validAt END,
    invalidAt: CASE WHEN rel.invalidAt IS NULL THEN r3.invalidAt ELSE rel.invalidAt END,
    expiredAt: CASE WHEN rel.expiredAt IS NULL THEN r3.expiredAt ELSE rel.expiredAt END
  }

  RETURN 1 AS okDLT
}
RETURN count(*) AS _deliversLabTestProcessed
`;

// ==================================================================
// IMPLEMENTS_PANEL (create / connect / update)
// ==================================================================
export const updateProductImplementsPanelCypher = `
MATCH (p:Product {productId: $productId})
UNWIND $implementsPanel AS rel
CALL {
  // ---------------- CREATE ----------------
  WITH p, rel
  WITH p, rel WHERE rel.panelDefinition.create IS NOT NULL

  MERGE (pd:PanelDefinition { panelDefinitionId: coalesce(rel.panelDefinition.create.panelDefinitionId, randomUUID()) })
  ON CREATE SET pd.createdAt = datetime()

  SET pd += {
    canonicalName: CASE WHEN rel.panelDefinition.create.canonicalName IS NULL THEN pd.canonicalName ELSE rel.panelDefinition.create.canonicalName END,
    aliases: CASE
      WHEN rel.panelDefinition.create.aliases IS NULL THEN pd.aliases
      ELSE apoc.coll.toSet(coalesce(pd.aliases, []) + coalesce(rel.panelDefinition.create.aliases, []))
    END,
    description: CASE WHEN rel.panelDefinition.create.description IS NULL THEN pd.description ELSE rel.panelDefinition.create.description END,
    validAt: CASE WHEN rel.panelDefinition.create.validAt IS NULL THEN pd.validAt ELSE rel.panelDefinition.create.validAt END,
    invalidAt: CASE WHEN rel.panelDefinition.create.invalidAt IS NULL THEN pd.invalidAt ELSE rel.panelDefinition.create.invalidAt END,
    expiredAt: CASE WHEN rel.panelDefinition.create.expiredAt IS NULL THEN pd.expiredAt ELSE rel.panelDefinition.create.expiredAt END
  }

  MERGE (p)-[r:IMPLEMENTS_PANEL]->(pd)
  ON CREATE SET r.createdAt = datetime()

  SET r += {
    panelRole: CASE WHEN rel.panelRole IS NULL THEN r.panelRole ELSE rel.panelRole END,
    versionLabel: CASE WHEN rel.versionLabel IS NULL THEN r.versionLabel ELSE rel.versionLabel END,
    claimIds: CASE
      WHEN rel.claimIds IS NULL THEN r.claimIds
      ELSE apoc.coll.toSet(coalesce(r.claimIds, []) + coalesce(rel.claimIds, []))
    END,
    createdAt: CASE WHEN rel.createdAt IS NULL THEN r.createdAt ELSE rel.createdAt END,
    validAt: CASE WHEN rel.validAt IS NULL THEN r.validAt ELSE rel.validAt END,
    invalidAt: CASE WHEN rel.invalidAt IS NULL THEN r.invalidAt ELSE rel.invalidAt END,
    expiredAt: CASE WHEN rel.expiredAt IS NULL THEN r.expiredAt ELSE rel.expiredAt END
  }

  RETURN 1 AS okIP

  UNION

  // ---------------- CONNECT (strict: target must exist) ----------------
  WITH p, rel
  WITH p, rel WHERE rel.panelDefinition.connect IS NOT NULL

  OPTIONAL MATCH (pd2:PanelDefinition {panelDefinitionId: rel.panelDefinition.connect.panelDefinitionId})
  CALL apoc.util.validate(
    pd2 IS NULL,
    'IMPLEMENTS_PANEL connect failed: PanelDefinition not found for panelDefinitionId %s',
    [rel.panelDefinition.connect.panelDefinitionId]
  )

  MERGE (p)-[r2:IMPLEMENTS_PANEL]->(pd2)
  ON CREATE SET r2.createdAt = datetime()

  SET r2 += {
    panelRole: CASE WHEN rel.panelRole IS NULL THEN r2.panelRole ELSE rel.panelRole END,
    versionLabel: CASE WHEN rel.versionLabel IS NULL THEN r2.versionLabel ELSE rel.versionLabel END,
    claimIds: CASE
      WHEN rel.claimIds IS NULL THEN r2.claimIds
      ELSE apoc.coll.toSet(coalesce(r2.claimIds, []) + coalesce(rel.claimIds, []))
    END,
    createdAt: CASE WHEN rel.createdAt IS NULL THEN r2.createdAt ELSE rel.createdAt END,
    validAt: CASE WHEN rel.validAt IS NULL THEN r2.validAt ELSE rel.validAt END,
    invalidAt: CASE WHEN rel.invalidAt IS NULL THEN r2.invalidAt ELSE rel.invalidAt END,
    expiredAt: CASE WHEN rel.expiredAt IS NULL THEN r2.expiredAt ELSE rel.expiredAt END
  }

  RETURN 1 AS okIP

  UNION

  // ---------------- UPDATE (strict: node + relationship must exist) ----------------
  WITH p, rel
  WITH p, rel WHERE rel.panelDefinition.update IS NOT NULL

  CALL apoc.util.validate(
    rel.panelDefinition.update.panelDefinitionId IS NULL,
    'IMPLEMENTS_PANEL update failed: panelDefinition.update.panelDefinitionId is required',
    []
  )

  OPTIONAL MATCH (pd3:PanelDefinition {panelDefinitionId: rel.panelDefinition.update.panelDefinitionId})
  OPTIONAL MATCH (p)-[r3:IMPLEMENTS_PANEL]->(pd3)

  CALL apoc.util.validate(
    pd3 IS NULL,
    'IMPLEMENTS_PANEL update failed: PanelDefinition not found for panelDefinitionId %s',
    [rel.panelDefinition.update.panelDefinitionId]
  )
  CALL apoc.util.validate(
    r3 IS NULL,
    'IMPLEMENTS_PANEL update failed: IMPLEMENTS_PANEL relationship not found for product %s -> panelDefinition %s',
    [$productId, rel.panelDefinition.update.panelDefinitionId]
  )

  SET pd3 += {
    canonicalName: CASE WHEN rel.panelDefinition.update.canonicalName IS NULL THEN pd3.canonicalName ELSE rel.panelDefinition.update.canonicalName END,
    aliases: CASE
      WHEN rel.panelDefinition.update.aliases IS NULL THEN pd3.aliases
      ELSE apoc.coll.toSet(coalesce(pd3.aliases, []) + coalesce(rel.panelDefinition.update.aliases, []))
    END,
    description: CASE WHEN rel.panelDefinition.update.description IS NULL THEN pd3.description ELSE rel.panelDefinition.update.description END,
    validAt: CASE WHEN rel.panelDefinition.update.validAt IS NULL THEN pd3.validAt ELSE rel.panelDefinition.update.validAt END,
    invalidAt: CASE WHEN rel.panelDefinition.update.invalidAt IS NULL THEN pd3.invalidAt ELSE rel.panelDefinition.update.invalidAt END,
    expiredAt: CASE WHEN rel.panelDefinition.update.expiredAt IS NULL THEN pd3.expiredAt ELSE rel.panelDefinition.update.expiredAt END
  }

  SET r3 += {
    panelRole: CASE WHEN rel.panelRole IS NULL THEN r3.panelRole ELSE rel.panelRole END,
    versionLabel: CASE WHEN rel.versionLabel IS NULL THEN r3.versionLabel ELSE rel.versionLabel END,
    claimIds: CASE
      WHEN rel.claimIds IS NULL THEN r3.claimIds
      ELSE apoc.coll.toSet(coalesce(r3.claimIds, []) + coalesce(rel.claimIds, []))
    END,
    createdAt: CASE WHEN rel.createdAt IS NULL THEN r3.createdAt ELSE rel.createdAt END,
    validAt: CASE WHEN rel.validAt IS NULL THEN r3.validAt ELSE rel.validAt END,
    invalidAt: CASE WHEN rel.invalidAt IS NULL THEN r3.invalidAt ELSE rel.invalidAt END,
    expiredAt: CASE WHEN rel.expiredAt IS NULL THEN r3.expiredAt ELSE rel.expiredAt END
  }

  RETURN 1 AS okIP
}
RETURN count(*) AS _implementsPanelProcessed
`;

// ==================================================================
// CONTAINS_COMPOUND_FORM (create / connect / update)
// ==================================================================
export const updateProductContainsCompoundFormCypher = `
MATCH (p:Product {productId: $productId})
UNWIND $containsCompoundForm AS rel
CALL {
  // ---------------- CREATE ----------------
  WITH p, rel
  WITH p, rel WHERE rel.compoundForm.create IS NOT NULL

  MERGE (cf:CompoundForm { compoundFormId: coalesce(rel.compoundForm.create.compoundFormId, randomUUID()) })
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

  MERGE (p)-[r:CONTAINS_COMPOUND_FORM]->(cf)
  ON CREATE SET r.createdAt = datetime()

  SET r += {
    dose: CASE WHEN rel.dose IS NULL THEN r.dose ELSE rel.dose END,
    doseUnit: CASE WHEN rel.doseUnit IS NULL THEN r.doseUnit ELSE rel.doseUnit END,
    role: CASE WHEN rel.role IS NULL THEN r.role ELSE rel.role END,
    standardizedTo: CASE WHEN rel.standardizedTo IS NULL THEN r.standardizedTo ELSE rel.standardizedTo END,
    claimIds: CASE
      WHEN rel.claimIds IS NULL THEN r.claimIds
      ELSE apoc.coll.toSet(coalesce(r.claimIds, []) + coalesce(rel.claimIds, []))
    END,
    createdAt: CASE WHEN rel.createdAt IS NULL THEN r.createdAt ELSE rel.createdAt END,
    validAt: CASE WHEN rel.validAt IS NULL THEN r.validAt ELSE rel.validAt END,
    invalidAt: CASE WHEN rel.invalidAt IS NULL THEN r.invalidAt ELSE rel.invalidAt END,
    expiredAt: CASE WHEN rel.expiredAt IS NULL THEN r.expiredAt ELSE rel.expiredAt END
  }

  RETURN 1 AS okCCF

  UNION

  // ---------------- CONNECT (strict: target must exist) ----------------
  WITH p, rel
  WITH p, rel WHERE rel.compoundForm.connect IS NOT NULL

  OPTIONAL MATCH (cf2:CompoundForm {compoundFormId: rel.compoundForm.connect.compoundFormId})
  CALL apoc.util.validate(
    cf2 IS NULL,
    'CONTAINS_COMPOUND_FORM connect failed: CompoundForm not found for compoundFormId %s',
    [rel.compoundForm.connect.compoundFormId]
  )

  MERGE (p)-[r2:CONTAINS_COMPOUND_FORM]->(cf2)
  ON CREATE SET r2.createdAt = datetime()

  SET r2 += {
    dose: CASE WHEN rel.dose IS NULL THEN r2.dose ELSE rel.dose END,
    doseUnit: CASE WHEN rel.doseUnit IS NULL THEN r2.doseUnit ELSE rel.doseUnit END,
    role: CASE WHEN rel.role IS NULL THEN r2.role ELSE rel.role END,
    standardizedTo: CASE WHEN rel.standardizedTo IS NULL THEN r2.standardizedTo ELSE rel.standardizedTo END,
    claimIds: CASE
      WHEN rel.claimIds IS NULL THEN r2.claimIds
      ELSE apoc.coll.toSet(coalesce(r2.claimIds, []) + coalesce(rel.claimIds, []))
    END,
    createdAt: CASE WHEN rel.createdAt IS NULL THEN r2.createdAt ELSE rel.createdAt END,
    validAt: CASE WHEN rel.validAt IS NULL THEN r2.validAt ELSE rel.validAt END,
    invalidAt: CASE WHEN rel.invalidAt IS NULL THEN r2.invalidAt ELSE rel.invalidAt END,
    expiredAt: CASE WHEN rel.expiredAt IS NULL THEN r2.expiredAt ELSE rel.expiredAt END
  }

  RETURN 1 AS okCCF

  UNION

  // ---------------- UPDATE (strict: node + relationship must exist) ----------------
  WITH p, rel
  WITH p, rel WHERE rel.compoundForm.update IS NOT NULL

  CALL apoc.util.validate(
    rel.compoundForm.update.compoundFormId IS NULL,
    'CONTAINS_COMPOUND_FORM update failed: compoundForm.update.compoundFormId is required',
    []
  )

  OPTIONAL MATCH (cf3:CompoundForm {compoundFormId: rel.compoundForm.update.compoundFormId})
  OPTIONAL MATCH (p)-[r3:CONTAINS_COMPOUND_FORM]->(cf3)

  CALL apoc.util.validate(
    cf3 IS NULL,
    'CONTAINS_COMPOUND_FORM update failed: CompoundForm not found for compoundFormId %s',
    [rel.compoundForm.update.compoundFormId]
  )
  CALL apoc.util.validate(
    r3 IS NULL,
    'CONTAINS_COMPOUND_FORM update failed: CONTAINS_COMPOUND_FORM relationship not found for product %s -> compoundForm %s',
    [$productId, rel.compoundForm.update.compoundFormId]
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
    dose: CASE WHEN rel.dose IS NULL THEN r3.dose ELSE rel.dose END,
    doseUnit: CASE WHEN rel.doseUnit IS NULL THEN r3.doseUnit ELSE rel.doseUnit END,
    role: CASE WHEN rel.role IS NULL THEN r3.role ELSE rel.role END,
    standardizedTo: CASE WHEN rel.standardizedTo IS NULL THEN r3.standardizedTo ELSE rel.standardizedTo END,
    claimIds: CASE
      WHEN rel.claimIds IS NULL THEN r3.claimIds
      ELSE apoc.coll.toSet(coalesce(r3.claimIds, []) + coalesce(rel.claimIds, []))
    END,
    createdAt: CASE WHEN rel.createdAt IS NULL THEN r3.createdAt ELSE rel.createdAt END,
    validAt: CASE WHEN rel.validAt IS NULL THEN r3.validAt ELSE rel.validAt END,
    invalidAt: CASE WHEN rel.invalidAt IS NULL THEN r3.invalidAt ELSE rel.invalidAt END,
    expiredAt: CASE WHEN rel.expiredAt IS NULL THEN r3.expiredAt ELSE rel.expiredAt END
  }

  RETURN 1 AS okCCF
}
RETURN count(*) AS _containsCompoundFormProcessed
`;

// ==================================================================
// FOLLOWS_PATHWAY (create / connect / update)
// ==================================================================
export const updateProductFollowsPathwayCypher = `
MATCH (p:Product {productId: $productId})
UNWIND $followsPathway AS rel
CALL {
  // ---------------- CREATE ----------------
  WITH p, rel
  WITH p, rel WHERE rel.regulatoryPathway.create IS NOT NULL

  MERGE (rp:RegulatoryPathway { pathwayId: coalesce(rel.regulatoryPathway.create.pathwayId, randomUUID()) })
  ON CREATE SET rp.createdAt = datetime()

  SET rp += {
    authority: CASE WHEN rel.regulatoryPathway.create.authority IS NULL THEN rp.authority ELSE rel.regulatoryPathway.create.authority END,
    pathwayType: CASE WHEN rel.regulatoryPathway.create.pathwayType IS NULL THEN rp.pathwayType ELSE rel.regulatoryPathway.create.pathwayType END,
    pathwayName: CASE WHEN rel.regulatoryPathway.create.pathwayName IS NULL THEN rp.pathwayName ELSE rel.regulatoryPathway.create.pathwayName END,
    requirementsSummary: CASE WHEN rel.regulatoryPathway.create.requirementsSummary IS NULL THEN rp.requirementsSummary ELSE rel.regulatoryPathway.create.requirementsSummary END,
    validAt: CASE WHEN rel.regulatoryPathway.create.validAt IS NULL THEN rp.validAt ELSE rel.regulatoryPathway.create.validAt END,
    invalidAt: CASE WHEN rel.regulatoryPathway.create.invalidAt IS NULL THEN rp.invalidAt ELSE rel.regulatoryPathway.create.invalidAt END,
    expiredAt: CASE WHEN rel.regulatoryPathway.create.expiredAt IS NULL THEN rp.expiredAt ELSE rel.regulatoryPathway.create.expiredAt END
  }

  MERGE (p)-[r:FOLLOWS_PATHWAY]->(rp)
  ON CREATE SET r.createdAt = datetime()

  SET r += {
    jurisdictionId: CASE WHEN rel.jurisdictionId IS NULL THEN r.jurisdictionId ELSE rel.jurisdictionId END,
    claimIds: CASE
      WHEN rel.claimIds IS NULL THEN r.claimIds
      ELSE apoc.coll.toSet(coalesce(r.claimIds, []) + coalesce(rel.claimIds, []))
    END,
    createdAt: CASE WHEN rel.createdAt IS NULL THEN r.createdAt ELSE rel.createdAt END,
    validAt: CASE WHEN rel.validAt IS NULL THEN r.validAt ELSE rel.validAt END,
    invalidAt: CASE WHEN rel.invalidAt IS NULL THEN r.invalidAt ELSE rel.invalidAt END,
    expiredAt: CASE WHEN rel.expiredAt IS NULL THEN r.expiredAt ELSE rel.expiredAt END
  }

  RETURN 1 AS okFP

  UNION

  // ---------------- CONNECT (strict: target must exist) ----------------
  WITH p, rel
  WITH p, rel WHERE rel.regulatoryPathway.connect IS NOT NULL

  OPTIONAL MATCH (rp2:RegulatoryPathway {pathwayId: rel.regulatoryPathway.connect.pathwayId})
  CALL apoc.util.validate(
    rp2 IS NULL,
    'FOLLOWS_PATHWAY connect failed: RegulatoryPathway not found for pathwayId %s',
    [rel.regulatoryPathway.connect.pathwayId]
  )

  MERGE (p)-[r2:FOLLOWS_PATHWAY]->(rp2)
  ON CREATE SET r2.createdAt = datetime()

  SET r2 += {
    jurisdictionId: CASE WHEN rel.jurisdictionId IS NULL THEN r2.jurisdictionId ELSE rel.jurisdictionId END,
    claimIds: CASE
      WHEN rel.claimIds IS NULL THEN r2.claimIds
      ELSE apoc.coll.toSet(coalesce(r2.claimIds, []) + coalesce(rel.claimIds, []))
    END,
    createdAt: CASE WHEN rel.createdAt IS NULL THEN r2.createdAt ELSE rel.createdAt END,
    validAt: CASE WHEN rel.validAt IS NULL THEN r2.validAt ELSE rel.validAt END,
    invalidAt: CASE WHEN rel.invalidAt IS NULL THEN r2.invalidAt ELSE rel.invalidAt END,
    expiredAt: CASE WHEN rel.expiredAt IS NULL THEN r2.expiredAt ELSE rel.expiredAt END
  }

  RETURN 1 AS okFP

  UNION

  // ---------------- UPDATE (strict: node + relationship must exist) ----------------
  WITH p, rel
  WITH p, rel WHERE rel.regulatoryPathway.update IS NOT NULL

  CALL apoc.util.validate(
    rel.regulatoryPathway.update.pathwayId IS NULL,
    'FOLLOWS_PATHWAY update failed: regulatoryPathway.update.pathwayId is required',
    []
  )

  OPTIONAL MATCH (rp3:RegulatoryPathway {pathwayId: rel.regulatoryPathway.update.pathwayId})
  OPTIONAL MATCH (p)-[r3:FOLLOWS_PATHWAY]->(rp3)

  CALL apoc.util.validate(
    rp3 IS NULL,
    'FOLLOWS_PATHWAY update failed: RegulatoryPathway not found for pathwayId %s',
    [rel.regulatoryPathway.update.pathwayId]
  )
  CALL apoc.util.validate(
    r3 IS NULL,
    'FOLLOWS_PATHWAY update failed: FOLLOWS_PATHWAY relationship not found for product %s -> regulatoryPathway %s',
    [$productId, rel.regulatoryPathway.update.pathwayId]
  )

  SET rp3 += {
    authority: CASE WHEN rel.regulatoryPathway.update.authority IS NULL THEN rp3.authority ELSE rel.regulatoryPathway.update.authority END,
    pathwayType: CASE WHEN rel.regulatoryPathway.update.pathwayType IS NULL THEN rp3.pathwayType ELSE rel.regulatoryPathway.update.pathwayType END,
    pathwayName: CASE WHEN rel.regulatoryPathway.update.pathwayName IS NULL THEN rp3.pathwayName ELSE rel.regulatoryPathway.update.pathwayName END,
    requirementsSummary: CASE WHEN rel.regulatoryPathway.update.requirementsSummary IS NULL THEN rp3.requirementsSummary ELSE rel.regulatoryPathway.update.requirementsSummary END,
    validAt: CASE WHEN rel.regulatoryPathway.update.validAt IS NULL THEN rp3.validAt ELSE rel.regulatoryPathway.update.validAt END,
    invalidAt: CASE WHEN rel.regulatoryPathway.update.invalidAt IS NULL THEN rp3.invalidAt ELSE rel.regulatoryPathway.update.invalidAt END,
    expiredAt: CASE WHEN rel.regulatoryPathway.update.expiredAt IS NULL THEN rp3.expiredAt ELSE rel.regulatoryPathway.update.expiredAt END
  }

  SET r3 += {
    jurisdictionId: CASE WHEN rel.jurisdictionId IS NULL THEN r3.jurisdictionId ELSE rel.jurisdictionId END,
    claimIds: CASE
      WHEN rel.claimIds IS NULL THEN r3.claimIds
      ELSE apoc.coll.toSet(coalesce(r3.claimIds, []) + coalesce(rel.claimIds, []))
    END,
    createdAt: CASE WHEN rel.createdAt IS NULL THEN r3.createdAt ELSE rel.createdAt END,
    validAt: CASE WHEN rel.validAt IS NULL THEN r3.validAt ELSE rel.validAt END,
    invalidAt: CASE WHEN rel.invalidAt IS NULL THEN r3.invalidAt ELSE rel.invalidAt END,
    expiredAt: CASE WHEN rel.expiredAt IS NULL THEN r3.expiredAt ELSE rel.expiredAt END
  }

  RETURN 1 AS okFP
}
RETURN count(*) AS _followsPathwayProcessed
`;

// ==================================================================
// IN_CATEGORY (create / connect / update)
// ==================================================================
export const updateProductInCategoryCypher = `
MATCH (p:Product {productId: $productId})
UNWIND $inCategory AS rel
CALL {
  // ---------------- CREATE ----------------
  WITH p, rel
  WITH p, rel WHERE rel.productCategory.create IS NOT NULL

  MERGE (pc:ProductCategory { categoryId: coalesce(rel.productCategory.create.categoryId, randomUUID()) })
  ON CREATE SET pc.createdAt = datetime()

  SET pc += {
    name: CASE WHEN rel.productCategory.create.name IS NULL THEN pc.name ELSE rel.productCategory.create.name END,
    description: CASE WHEN rel.productCategory.create.description IS NULL THEN pc.description ELSE rel.productCategory.create.description END,
    aliases: CASE
      WHEN rel.productCategory.create.aliases IS NULL THEN pc.aliases
      ELSE apoc.coll.toSet(coalesce(pc.aliases, []) + coalesce(rel.productCategory.create.aliases, []))
    END,
    validAt: CASE WHEN rel.productCategory.create.validAt IS NULL THEN pc.validAt ELSE rel.productCategory.create.validAt END,
    invalidAt: CASE WHEN rel.productCategory.create.invalidAt IS NULL THEN pc.invalidAt ELSE rel.productCategory.create.invalidAt END,
    expiredAt: CASE WHEN rel.productCategory.create.expiredAt IS NULL THEN pc.expiredAt ELSE rel.productCategory.create.expiredAt END
  }

  MERGE (p)-[r:IN_CATEGORY]->(pc)
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

  RETURN 1 AS okIC

  UNION

  // ---------------- CONNECT (strict: target must exist) ----------------
  WITH p, rel
  WITH p, rel WHERE rel.productCategory.connect IS NOT NULL

  OPTIONAL MATCH (pc2:ProductCategory {categoryId: rel.productCategory.connect.categoryId})
  CALL apoc.util.validate(
    pc2 IS NULL,
    'IN_CATEGORY connect failed: ProductCategory not found for categoryId %s',
    [rel.productCategory.connect.categoryId]
  )

  MERGE (p)-[r2:IN_CATEGORY]->(pc2)
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

  RETURN 1 AS okIC

  UNION

  // ---------------- UPDATE (strict: node + relationship must exist) ----------------
  WITH p, rel
  WITH p, rel WHERE rel.productCategory.update IS NOT NULL

  CALL apoc.util.validate(
    rel.productCategory.update.categoryId IS NULL,
    'IN_CATEGORY update failed: productCategory.update.categoryId is required',
    []
  )

  OPTIONAL MATCH (pc3:ProductCategory {categoryId: rel.productCategory.update.categoryId})
  OPTIONAL MATCH (p)-[r3:IN_CATEGORY]->(pc3)

  CALL apoc.util.validate(
    pc3 IS NULL,
    'IN_CATEGORY update failed: ProductCategory not found for categoryId %s',
    [rel.productCategory.update.categoryId]
  )
  CALL apoc.util.validate(
    r3 IS NULL,
    'IN_CATEGORY update failed: IN_CATEGORY relationship not found for product %s -> productCategory %s',
    [$productId, rel.productCategory.update.categoryId]
  )

  SET pc3 += {
    name: CASE WHEN rel.productCategory.update.name IS NULL THEN pc3.name ELSE rel.productCategory.update.name END,
    description: CASE WHEN rel.productCategory.update.description IS NULL THEN pc3.description ELSE rel.productCategory.update.description END,
    aliases: CASE
      WHEN rel.productCategory.update.aliases IS NULL THEN pc3.aliases
      ELSE apoc.coll.toSet(coalesce(pc3.aliases, []) + coalesce(rel.productCategory.update.aliases, []))
    END,
    validAt: CASE WHEN rel.productCategory.update.validAt IS NULL THEN pc3.validAt ELSE rel.productCategory.update.validAt END,
    invalidAt: CASE WHEN rel.productCategory.update.invalidAt IS NULL THEN pc3.invalidAt ELSE rel.productCategory.update.invalidAt END,
    expiredAt: CASE WHEN rel.productCategory.update.expiredAt IS NULL THEN pc3.expiredAt ELSE rel.productCategory.update.expiredAt END
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

  RETURN 1 AS okIC
}
RETURN count(*) AS _inCategoryProcessed
`;

// ==================================================================
// USES_PLATFORM (create / connect / update)
// ==================================================================
export const updateProductUsesPlatformCypher = `
MATCH (p:Product {productId: $productId})
UNWIND $usesPlatform AS rel
CALL {
  // ---------------- CREATE ----------------
  WITH p, rel
  WITH p, rel WHERE rel.technologyPlatform.create IS NOT NULL

  MERGE (tp:TechnologyPlatform { platformId: coalesce(rel.technologyPlatform.create.platformId, randomUUID()) })
  ON CREATE SET tp.createdAt = datetime()

  SET tp += {
    canonicalName: CASE WHEN rel.technologyPlatform.create.canonicalName IS NULL THEN tp.canonicalName ELSE rel.technologyPlatform.create.canonicalName END,
    aliases: CASE
      WHEN rel.technologyPlatform.create.aliases IS NULL THEN tp.aliases
      ELSE apoc.coll.toSet(coalesce(tp.aliases, []) + coalesce(rel.technologyPlatform.create.aliases, []))
    END,
    platformType: CASE WHEN rel.technologyPlatform.create.platformType IS NULL THEN tp.platformType ELSE rel.technologyPlatform.create.platformType END,
    description: CASE WHEN rel.technologyPlatform.create.description IS NULL THEN tp.description ELSE rel.technologyPlatform.create.description END,
    validAt: CASE WHEN rel.technologyPlatform.create.validAt IS NULL THEN tp.validAt ELSE rel.technologyPlatform.create.validAt END,
    invalidAt: CASE WHEN rel.technologyPlatform.create.invalidAt IS NULL THEN tp.invalidAt ELSE rel.technologyPlatform.create.invalidAt END,
    expiredAt: CASE WHEN rel.technologyPlatform.create.expiredAt IS NULL THEN tp.expiredAt ELSE rel.technologyPlatform.create.expiredAt END
  }

  MERGE (p)-[r:USES_PLATFORM]->(tp)
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

  RETURN 1 AS okUP

  UNION

  // ---------------- CONNECT (strict: target must exist) ----------------
  WITH p, rel
  WITH p, rel WHERE rel.technologyPlatform.connect IS NOT NULL

  OPTIONAL MATCH (tp2:TechnologyPlatform {platformId: rel.technologyPlatform.connect.platformId})
  CALL apoc.util.validate(
    tp2 IS NULL,
    'USES_PLATFORM connect failed: TechnologyPlatform not found for platformId %s',
    [rel.technologyPlatform.connect.platformId]
  )

  MERGE (p)-[r2:USES_PLATFORM]->(tp2)
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

  RETURN 1 AS okUP

  UNION

  // ---------------- UPDATE (strict: node + relationship must exist) ----------------
  WITH p, rel
  WITH p, rel WHERE rel.technologyPlatform.update IS NOT NULL

  CALL apoc.util.validate(
    rel.technologyPlatform.update.platformId IS NULL,
    'USES_PLATFORM update failed: technologyPlatform.update.platformId is required',
    []
  )

  OPTIONAL MATCH (tp3:TechnologyPlatform {platformId: rel.technologyPlatform.update.platformId})
  OPTIONAL MATCH (p)-[r3:USES_PLATFORM]->(tp3)

  CALL apoc.util.validate(
    tp3 IS NULL,
    'USES_PLATFORM update failed: TechnologyPlatform not found for platformId %s',
    [rel.technologyPlatform.update.platformId]
  )
  CALL apoc.util.validate(
    r3 IS NULL,
    'USES_PLATFORM update failed: USES_PLATFORM relationship not found for product %s -> technologyPlatform %s',
    [$productId, rel.technologyPlatform.update.platformId]
  )

  SET tp3 += {
    canonicalName: CASE WHEN rel.technologyPlatform.update.canonicalName IS NULL THEN tp3.canonicalName ELSE rel.technologyPlatform.update.canonicalName END,
    aliases: CASE
      WHEN rel.technologyPlatform.update.aliases IS NULL THEN tp3.aliases
      ELSE apoc.coll.toSet(coalesce(tp3.aliases, []) + coalesce(rel.technologyPlatform.update.aliases, []))
    END,
    platformType: CASE WHEN rel.technologyPlatform.update.platformType IS NULL THEN tp3.platformType ELSE rel.technologyPlatform.update.platformType END,
    description: CASE WHEN rel.technologyPlatform.update.description IS NULL THEN tp3.description ELSE rel.technologyPlatform.update.description END,
    validAt: CASE WHEN rel.technologyPlatform.update.validAt IS NULL THEN tp3.validAt ELSE rel.technologyPlatform.update.validAt END,
    invalidAt: CASE WHEN rel.technologyPlatform.update.invalidAt IS NULL THEN tp3.invalidAt ELSE rel.technologyPlatform.update.invalidAt END,
    expiredAt: CASE WHEN rel.technologyPlatform.update.expiredAt IS NULL THEN tp3.expiredAt ELSE rel.technologyPlatform.update.expiredAt END
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

  RETURN 1 AS okUP
}
RETURN count(*) AS _usesPlatformProcessed
`;

// ==================================================================
// HAS_REGULATORY_STATUS (create / connect / update)
// ==================================================================
export const updateProductHasRegulatoryStatusCypher = `
MATCH (p:Product {productId: $productId})
UNWIND $hasRegulatoryStatus AS rel
CALL {
  // ---------------- CREATE ----------------
  WITH p, rel
  WITH p, rel WHERE rel.regulatoryStatus.create IS NOT NULL

  MERGE (rs:RegulatoryStatus { regulatoryStatusId: coalesce(rel.regulatoryStatus.create.regulatoryStatusId, randomUUID()) })
  ON CREATE SET rs.createdAt = datetime()

  SET rs += {
    status: CASE WHEN rel.regulatoryStatus.create.status IS NULL THEN rs.status ELSE rel.regulatoryStatus.create.status END,
    effectiveDate: CASE WHEN rel.regulatoryStatus.create.effectiveDate IS NULL THEN rs.effectiveDate ELSE rel.regulatoryStatus.create.effectiveDate END,
    statusDetails: CASE WHEN rel.regulatoryStatus.create.statusDetails IS NULL THEN rs.statusDetails ELSE rel.regulatoryStatus.create.statusDetails END,
    validAt: CASE WHEN rel.regulatoryStatus.create.validAt IS NULL THEN rs.validAt ELSE rel.regulatoryStatus.create.validAt END,
    invalidAt: CASE WHEN rel.regulatoryStatus.create.invalidAt IS NULL THEN rs.invalidAt ELSE rel.regulatoryStatus.create.invalidAt END,
    expiredAt: CASE WHEN rel.regulatoryStatus.create.expiredAt IS NULL THEN rs.expiredAt ELSE rel.regulatoryStatus.create.expiredAt END
  }

  MERGE (p)-[r:HAS_REGULATORY_STATUS]->(rs)
  ON CREATE SET r.createdAt = datetime()

  SET r += {
    status: CASE WHEN rel.status IS NULL THEN r.status ELSE rel.status END,
    effectiveDate: CASE WHEN rel.effectiveDate IS NULL THEN r.effectiveDate ELSE rel.effectiveDate END,
    statusDetails: CASE WHEN rel.statusDetails IS NULL THEN r.statusDetails ELSE rel.statusDetails END,
    claimIds: CASE
      WHEN rel.claimIds IS NULL THEN r.claimIds
      ELSE apoc.coll.toSet(coalesce(r.claimIds, []) + coalesce(rel.claimIds, []))
    END,
    createdAt: CASE WHEN rel.createdAt IS NULL THEN r.createdAt ELSE rel.createdAt END,
    validAt: CASE WHEN rel.validAt IS NULL THEN r.validAt ELSE rel.validAt END,
    invalidAt: CASE WHEN rel.invalidAt IS NULL THEN r.invalidAt ELSE rel.invalidAt END,
    expiredAt: CASE WHEN rel.expiredAt IS NULL THEN r.expiredAt ELSE rel.expiredAt END
  }

  RETURN 1 AS okHRS

  UNION

  // ---------------- CONNECT (strict: target must exist) ----------------
  WITH p, rel
  WITH p, rel WHERE rel.regulatoryStatus.connect IS NOT NULL

  OPTIONAL MATCH (rs2:RegulatoryStatus {regulatoryStatusId: rel.regulatoryStatus.connect.regulatoryStatusId})
  CALL apoc.util.validate(
    rs2 IS NULL,
    'HAS_REGULATORY_STATUS connect failed: RegulatoryStatus not found for regulatoryStatusId %s',
    [rel.regulatoryStatus.connect.regulatoryStatusId]
  )

  MERGE (p)-[r2:HAS_REGULATORY_STATUS]->(rs2)
  ON CREATE SET r2.createdAt = datetime()

  SET r2 += {
    status: CASE WHEN rel.status IS NULL THEN r2.status ELSE rel.status END,
    effectiveDate: CASE WHEN rel.effectiveDate IS NULL THEN r2.effectiveDate ELSE rel.effectiveDate END,
    statusDetails: CASE WHEN rel.statusDetails IS NULL THEN r2.statusDetails ELSE rel.statusDetails END,
    claimIds: CASE
      WHEN rel.claimIds IS NULL THEN r2.claimIds
      ELSE apoc.coll.toSet(coalesce(r2.claimIds, []) + coalesce(rel.claimIds, []))
    END,
    createdAt: CASE WHEN rel.createdAt IS NULL THEN r2.createdAt ELSE rel.createdAt END,
    validAt: CASE WHEN rel.validAt IS NULL THEN r2.validAt ELSE rel.validAt END,
    invalidAt: CASE WHEN rel.invalidAt IS NULL THEN r2.invalidAt ELSE rel.invalidAt END,
    expiredAt: CASE WHEN rel.expiredAt IS NULL THEN r2.expiredAt ELSE rel.expiredAt END
  }

  RETURN 1 AS okHRS

  UNION

  // ---------------- UPDATE (strict: node + relationship must exist) ----------------
  WITH p, rel
  WITH p, rel WHERE rel.regulatoryStatus.update IS NOT NULL

  CALL apoc.util.validate(
    rel.regulatoryStatus.update.regulatoryStatusId IS NULL,
    'HAS_REGULATORY_STATUS update failed: regulatoryStatus.update.regulatoryStatusId is required',
    []
  )

  OPTIONAL MATCH (rs3:RegulatoryStatus {regulatoryStatusId: rel.regulatoryStatus.update.regulatoryStatusId})
  OPTIONAL MATCH (p)-[r3:HAS_REGULATORY_STATUS]->(rs3)

  CALL apoc.util.validate(
    rs3 IS NULL,
    'HAS_REGULATORY_STATUS update failed: RegulatoryStatus not found for regulatoryStatusId %s',
    [rel.regulatoryStatus.update.regulatoryStatusId]
  )
  CALL apoc.util.validate(
    r3 IS NULL,
    'HAS_REGULATORY_STATUS update failed: HAS_REGULATORY_STATUS relationship not found for product %s -> regulatoryStatus %s',
    [$productId, rel.regulatoryStatus.update.regulatoryStatusId]
  )

  SET rs3 += {
    status: CASE WHEN rel.regulatoryStatus.update.status IS NULL THEN rs3.status ELSE rel.regulatoryStatus.update.status END,
    effectiveDate: CASE WHEN rel.regulatoryStatus.update.effectiveDate IS NULL THEN rs3.effectiveDate ELSE rel.regulatoryStatus.update.effectiveDate END,
    statusDetails: CASE WHEN rel.regulatoryStatus.update.statusDetails IS NULL THEN rs3.statusDetails ELSE rel.regulatoryStatus.update.statusDetails END,
    validAt: CASE WHEN rel.regulatoryStatus.update.validAt IS NULL THEN rs3.validAt ELSE rel.regulatoryStatus.update.validAt END,
    invalidAt: CASE WHEN rel.regulatoryStatus.update.invalidAt IS NULL THEN rs3.invalidAt ELSE rel.regulatoryStatus.update.invalidAt END,
    expiredAt: CASE WHEN rel.regulatoryStatus.update.expiredAt IS NULL THEN rs3.expiredAt ELSE rel.regulatoryStatus.update.expiredAt END
  }

  SET r3 += {
    status: CASE WHEN rel.status IS NULL THEN r3.status ELSE rel.status END,
    effectiveDate: CASE WHEN rel.effectiveDate IS NULL THEN r3.effectiveDate ELSE rel.effectiveDate END,
    statusDetails: CASE WHEN rel.statusDetails IS NULL THEN r3.statusDetails ELSE rel.statusDetails END,
    claimIds: CASE
      WHEN rel.claimIds IS NULL THEN r3.claimIds
      ELSE apoc.coll.toSet(coalesce(r3.claimIds, []) + coalesce(rel.claimIds, []))
    END,
    createdAt: CASE WHEN rel.createdAt IS NULL THEN r3.createdAt ELSE rel.createdAt END,
    validAt: CASE WHEN rel.validAt IS NULL THEN r3.validAt ELSE rel.validAt END,
    invalidAt: CASE WHEN rel.invalidAt IS NULL THEN r3.invalidAt ELSE rel.invalidAt END,
    expiredAt: CASE WHEN rel.expiredAt IS NULL THEN r3.expiredAt ELSE rel.expiredAt END
  }

  RETURN 1 AS okHRS
}
RETURN count(*) AS _hasRegulatoryStatusProcessed
`;

// ==================================================================
// MANUFACTURED_BY (create / connect / update)
// Note: This is an incoming relationship exposed as outgoing
// In Neo4j: (Organization)-[:MANUFACTURES_PRODUCT]->(Product)
// ==================================================================
export const updateProductManufacturedByCypher = `
MATCH (p:Product {productId: $productId})
UNWIND $manufacturedBy AS rel
CALL {
  // ---------------- CREATE ----------------
  WITH p, rel
  WITH p, rel WHERE rel.organization.create IS NOT NULL

  MERGE (o:Organization { organizationId: coalesce(rel.organization.create.organizationId, randomUUID()) })
  ON CREATE SET o.createdAt = datetime()

  SET o.organizationId = coalesce(o.organizationId, randomUUID())

  SET o += {
    name: CASE WHEN rel.organization.create.name IS NULL THEN o.name ELSE rel.organization.create.name END,
    aliases: CASE
      WHEN rel.organization.create.aliases IS NULL THEN o.aliases
      ELSE apoc.coll.toSet(coalesce(o.aliases, []) + coalesce(rel.organization.create.aliases, []))
    END,
    orgType: CASE WHEN rel.organization.create.orgType IS NULL THEN o.orgType ELSE rel.organization.create.orgType END,
    description: CASE WHEN rel.organization.create.description IS NULL THEN o.description ELSE rel.organization.create.description END,
    businessModel: CASE WHEN rel.organization.create.businessModel IS NULL THEN o.businessModel ELSE rel.organization.create.businessModel END,
    primaryIndustryTags: CASE
      WHEN rel.organization.create.primaryIndustryTags IS NULL THEN o.primaryIndustryTags
      ELSE apoc.coll.toSet(coalesce(o.primaryIndustryTags, []) + coalesce(rel.organization.create.primaryIndustryTags, []))
    END,
    regionsServed: CASE
      WHEN rel.organization.create.regionsServed IS NULL THEN o.regionsServed
      ELSE apoc.coll.toSet(coalesce(o.regionsServed, []) + coalesce(rel.organization.create.regionsServed, []))
    END,
    legalName: CASE WHEN rel.organization.create.legalName IS NULL THEN o.legalName ELSE rel.organization.create.legalName END,
    legalStructure: CASE WHEN rel.organization.create.legalStructure IS NULL THEN o.legalStructure ELSE rel.organization.create.legalStructure END,
    ownershipType: CASE WHEN rel.organization.create.ownershipType IS NULL THEN o.ownershipType ELSE rel.organization.create.ownershipType END,
    jurisdictionsOfIncorporation: CASE
      WHEN rel.organization.create.jurisdictionsOfIncorporation IS NULL THEN o.jurisdictionsOfIncorporation
      ELSE apoc.coll.toSet(coalesce(o.jurisdictionsOfIncorporation, []) + coalesce(rel.organization.create.jurisdictionsOfIncorporation, []))
    END,
    websiteUrl: CASE WHEN rel.organization.create.websiteUrl IS NULL THEN o.websiteUrl ELSE rel.organization.create.websiteUrl END,
    defaultCollectionModes: CASE
      WHEN rel.organization.create.defaultCollectionModes IS NULL THEN o.defaultCollectionModes
      ELSE apoc.coll.toSet(coalesce(o.defaultCollectionModes, []) + coalesce(rel.organization.create.defaultCollectionModes, []))
    END,
    defaultRegionsAvailable: CASE
      WHEN rel.organization.create.defaultRegionsAvailable IS NULL THEN o.defaultRegionsAvailable
      ELSE apoc.coll.toSet(coalesce(o.defaultRegionsAvailable, []) + coalesce(rel.organization.create.defaultRegionsAvailable, []))
    END,
    publicTicker: CASE WHEN rel.organization.create.publicTicker IS NULL THEN o.publicTicker ELSE rel.organization.create.publicTicker END,
    fundingStage: CASE WHEN rel.organization.create.fundingStage IS NULL THEN o.fundingStage ELSE rel.organization.create.fundingStage END,
    employeeCountMin: CASE WHEN rel.organization.create.employeeCountMin IS NULL THEN o.employeeCountMin ELSE rel.organization.create.employeeCountMin END,
    employeeCountMax: CASE WHEN rel.organization.create.employeeCountMax IS NULL THEN o.employeeCountMax ELSE rel.organization.create.employeeCountMax END,
    employeeCountAsOf: CASE WHEN rel.organization.create.employeeCountAsOf IS NULL THEN o.employeeCountAsOf ELSE rel.organization.create.employeeCountAsOf END,
    revenueAnnualMin: CASE WHEN rel.organization.create.revenueAnnualMin IS NULL THEN o.revenueAnnualMin ELSE rel.organization.create.revenueAnnualMin END,
    revenueAnnualMax: CASE WHEN rel.organization.create.revenueAnnualMax IS NULL THEN o.revenueAnnualMax ELSE rel.organization.create.revenueAnnualMax END,
    revenueAnnualCurrency: CASE WHEN rel.organization.create.revenueAnnualCurrency IS NULL THEN o.revenueAnnualCurrency ELSE rel.organization.create.revenueAnnualCurrency END,
    revenueAnnualAsOf: CASE WHEN rel.organization.create.revenueAnnualAsOf IS NULL THEN o.revenueAnnualAsOf ELSE rel.organization.create.revenueAnnualAsOf END,
    validAt: CASE WHEN rel.organization.create.validAt IS NULL THEN o.validAt ELSE rel.organization.create.validAt END,
    invalidAt: CASE WHEN rel.organization.create.invalidAt IS NULL THEN o.invalidAt ELSE rel.organization.create.invalidAt END,
    expiredAt: CASE WHEN rel.organization.create.expiredAt IS NULL THEN o.expiredAt ELSE rel.organization.create.expiredAt END
  }

  MERGE (o)-[r:MANUFACTURES_PRODUCT]->(p)
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

  RETURN 1 AS okMB

  UNION

  // ---------------- CONNECT (strict: target must exist) ----------------
  WITH p, rel
  WITH p, rel WHERE rel.organization.connect IS NOT NULL

  OPTIONAL MATCH (o2:Organization {organizationId: rel.organization.connect.organizationId})
  CALL apoc.util.validate(
    o2 IS NULL,
    'MANUFACTURED_BY connect failed: Organization not found for organizationId %s',
    [rel.organization.connect.organizationId]
  )

  MERGE (o2)-[r2:MANUFACTURES_PRODUCT]->(p)
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

  RETURN 1 AS okMB

  UNION

  // ---------------- UPDATE (strict: node + relationship must exist) ----------------
  WITH p, rel
  WITH p, rel WHERE rel.organization.update IS NOT NULL

  CALL apoc.util.validate(
    rel.organization.update.organizationId IS NULL,
    'MANUFACTURED_BY update failed: organization.update.organizationId is required',
    []
  )

  OPTIONAL MATCH (o3:Organization {organizationId: rel.organization.update.organizationId})
  OPTIONAL MATCH (o3)-[r3:MANUFACTURES_PRODUCT]->(p)

  CALL apoc.util.validate(
    o3 IS NULL,
    'MANUFACTURED_BY update failed: Organization not found for organizationId %s',
    [rel.organization.update.organizationId]
  )
  CALL apoc.util.validate(
    r3 IS NULL,
    'MANUFACTURED_BY update failed: MANUFACTURES_PRODUCT relationship not found for organization %s -> product %s',
    [rel.organization.update.organizationId, $productId]
  )

  SET o3 += {
    name: CASE WHEN rel.organization.update.name IS NULL THEN o3.name ELSE rel.organization.update.name END,
    aliases: CASE
      WHEN rel.organization.update.aliases IS NULL THEN o3.aliases
      ELSE apoc.coll.toSet(coalesce(o3.aliases, []) + coalesce(rel.organization.update.aliases, []))
    END,
    orgType: CASE WHEN rel.organization.update.orgType IS NULL THEN o3.orgType ELSE rel.organization.update.orgType END,
    description: CASE WHEN rel.organization.update.description IS NULL THEN o3.description ELSE rel.organization.update.description END,
    businessModel: CASE WHEN rel.organization.update.businessModel IS NULL THEN o3.businessModel ELSE rel.organization.update.businessModel END,
    primaryIndustryTags: CASE
      WHEN rel.organization.update.primaryIndustryTags IS NULL THEN o3.primaryIndustryTags
      ELSE apoc.coll.toSet(coalesce(o3.primaryIndustryTags, []) + coalesce(rel.organization.update.primaryIndustryTags, []))
    END,
    regionsServed: CASE
      WHEN rel.organization.update.regionsServed IS NULL THEN o3.regionsServed
      ELSE apoc.coll.toSet(coalesce(o3.regionsServed, []) + coalesce(rel.organization.update.regionsServed, []))
    END,
    legalName: CASE WHEN rel.organization.update.legalName IS NULL THEN o3.legalName ELSE rel.organization.update.legalName END,
    legalStructure: CASE WHEN rel.organization.update.legalStructure IS NULL THEN o3.legalStructure ELSE rel.organization.update.legalStructure END,
    ownershipType: CASE WHEN rel.organization.update.ownershipType IS NULL THEN o3.ownershipType ELSE rel.organization.update.ownershipType END,
    jurisdictionsOfIncorporation: CASE
      WHEN rel.organization.update.jurisdictionsOfIncorporation IS NULL THEN o3.jurisdictionsOfIncorporation
      ELSE apoc.coll.toSet(coalesce(o3.jurisdictionsOfIncorporation, []) + coalesce(rel.organization.update.jurisdictionsOfIncorporation, []))
    END,
    websiteUrl: CASE WHEN rel.organization.update.websiteUrl IS NULL THEN o3.websiteUrl ELSE rel.organization.update.websiteUrl END,
    defaultCollectionModes: CASE
      WHEN rel.organization.update.defaultCollectionModes IS NULL THEN o3.defaultCollectionModes
      ELSE apoc.coll.toSet(coalesce(o3.defaultCollectionModes, []) + coalesce(rel.organization.update.defaultCollectionModes, []))
    END,
    defaultRegionsAvailable: CASE
      WHEN rel.organization.update.defaultRegionsAvailable IS NULL THEN o3.defaultRegionsAvailable
      ELSE apoc.coll.toSet(coalesce(o3.defaultRegionsAvailable, []) + coalesce(rel.organization.update.defaultRegionsAvailable, []))
    END,
    publicTicker: CASE WHEN rel.organization.update.publicTicker IS NULL THEN o3.publicTicker ELSE rel.organization.update.publicTicker END,
    fundingStage: CASE WHEN rel.organization.update.fundingStage IS NULL THEN o3.fundingStage ELSE rel.organization.update.fundingStage END,
    employeeCountMin: CASE WHEN rel.organization.update.employeeCountMin IS NULL THEN o3.employeeCountMin ELSE rel.organization.update.employeeCountMin END,
    employeeCountMax: CASE WHEN rel.organization.update.employeeCountMax IS NULL THEN o3.employeeCountMax ELSE rel.organization.update.employeeCountMax END,
    employeeCountAsOf: CASE WHEN rel.organization.update.employeeCountAsOf IS NULL THEN o3.employeeCountAsOf ELSE rel.organization.update.employeeCountAsOf END,
    revenueAnnualMin: CASE WHEN rel.organization.update.revenueAnnualMin IS NULL THEN o3.revenueAnnualMin ELSE rel.organization.update.revenueAnnualMin END,
    revenueAnnualMax: CASE WHEN rel.organization.update.revenueAnnualMax IS NULL THEN o3.revenueAnnualMax ELSE rel.organization.update.revenueAnnualMax END,
    revenueAnnualCurrency: CASE WHEN rel.organization.update.revenueAnnualCurrency IS NULL THEN o3.revenueAnnualCurrency ELSE rel.organization.update.revenueAnnualCurrency END,
    revenueAnnualAsOf: CASE WHEN rel.organization.update.revenueAnnualAsOf IS NULL THEN o3.revenueAnnualAsOf ELSE rel.organization.update.revenueAnnualAsOf END,
    validAt: CASE WHEN rel.organization.update.validAt IS NULL THEN o3.validAt ELSE rel.organization.update.validAt END,
    invalidAt: CASE WHEN rel.organization.update.invalidAt IS NULL THEN o3.invalidAt ELSE rel.organization.update.invalidAt END,
    expiredAt: CASE WHEN rel.organization.update.expiredAt IS NULL THEN o3.expiredAt ELSE rel.organization.update.expiredAt END
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

  RETURN 1 AS okMB
}
RETURN count(*) AS _manufacturedByProcessed
`;

export const returnUpdatedProductCypher = `
MATCH (p:Product {productId: $productId})
RETURN p
`;

export const updateProductStatements = {
  updateProductDeliversLabTestCypher,
  updateProductImplementsPanelCypher,
  updateProductContainsCompoundFormCypher,
  updateProductFollowsPathwayCypher,
  updateProductInCategoryCypher,
  updateProductUsesPlatformCypher,
  updateProductHasRegulatoryStatusCypher,
  updateProductManufacturedByCypher,
  returnUpdatedProductCypher,
};