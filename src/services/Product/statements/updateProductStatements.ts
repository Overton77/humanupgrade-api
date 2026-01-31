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

export const returnUpdatedProductCypher = `
MATCH (p:Product {productId: $productId})
RETURN p
`;

export const updateProductStatements = {
  updateProductDeliversLabTestCypher,
  updateProductImplementsPanelCypher,
  updateProductContainsCompoundFormCypher,
  updateProductFollowsPathwayCypher,
  returnUpdatedProductCypher,
};