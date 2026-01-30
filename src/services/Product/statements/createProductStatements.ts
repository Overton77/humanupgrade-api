export function buildProductUpsertCypher(identifierKey: ProductIdentifierKey) {
    return `
      MERGE (p:Product { ${identifierKey}: $idValue })
      ON CREATE SET p.createdAt = datetime()
  
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
        intendedUse: CASE WHEN $intendedUse IS NULL THEN p.intendedUse ELSE $intendedUse END,
        description: CASE WHEN $description IS NULL THEN p.description ELSE $description END,
        brandName: CASE WHEN $brandName IS NULL THEN p.brandName ELSE $brandName END,
        modelNumber: CASE WHEN $modelNumber IS NULL THEN p.modelNumber ELSE $modelNumber END,
  
        gtin: CASE WHEN $gtin IS NULL THEN p.gtin ELSE $gtin END,
        upc: CASE WHEN $upc IS NULL THEN p.upc ELSE $upc END,
        productFingerprint: CASE WHEN $productFingerprint IS NULL THEN p.productFingerprint ELSE $productFingerprint END,
  
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


export const upsertProductsCypher = `
MERGE (p:Product {productId: coalesce($productId, randomUUID())})
ON CREATE SET p.createdAt = datetime()

SET p += {
  name: CASE WHEN $name IS NULL THEN p.name ELSE $name END,

  synonyms: CASE
    WHEN $synonyms IS NULL THEN p.synonyms
    ELSE apoc.coll.toSet(coalesce(p.synonyms, []) + coalesce($synonyms, []))
  END,

  productDomain: CASE WHEN $productDomain IS NULL THEN p.productDomain ELSE $productDomain END,
  productType: CASE WHEN $productType IS NULL THEN p.productType ELSE $productType END,
  intendedUse: CASE WHEN $intendedUse IS NULL THEN p.intendedUse ELSE $intendedUse END,
  description: CASE WHEN $description IS NULL THEN p.description ELSE $description END,
  brandName: CASE WHEN $brandName IS NULL THEN p.brandName ELSE $brandName END,
  modelNumber: CASE WHEN $modelNumber IS NULL THEN p.modelNumber ELSE $modelNumber END,
  ndcCode: CASE WHEN $ndcCode IS NULL THEN p.ndcCode ELSE $ndcCode END,
  upc: CASE WHEN $upc IS NULL THEN p.upc ELSE $upc END,
  gtin: CASE WHEN $gtin IS NULL THEN p.gtin ELSE $gtin END,
  riskClass: CASE WHEN $riskClass IS NULL THEN p.riskClass ELSE $riskClass END,
  currency: CASE WHEN $currency IS NULL THEN p.currency ELSE $currency END,
  priceAmount: CASE WHEN $priceAmount IS NULL THEN p.priceAmount ELSE $priceAmount END,

  validAt: CASE WHEN $validAt IS NULL THEN p.validAt ELSE $validAt END,
  invalidAt: CASE WHEN $invalidAt IS NULL THEN p.invalidAt ELSE $invalidAt END,
  expiredAt: CASE WHEN $expiredAt IS NULL THEN p.expiredAt ELSE $expiredAt END
}

RETURN p
`;

// ==================================================================
// DELIVERS_LAB_TEST (create OR connect) (CONNECT = HARD FAIL if missing)
// ==================================================================
export const productDeliversLabTestCypher = `
MATCH (p:Product {productId: $productId})

UNWIND coalesce($deliversLabTest, []) AS dltRel
CALL {
  // ---- CREATE branch ----
  WITH p, dltRel 
  WITH p, dltRel 
  WHERE dltRel.labTest.create IS NOT NULL

  MERGE (lt:LabTest {
    labTestId: coalesce(dltRel.labTest.create.labTestId, randomUUID())
  })
  ON CREATE SET lt.createdAt = datetime()

  SET lt += {
    name: CASE WHEN dltRel.labTest.create.name IS NULL THEN lt.name ELSE dltRel.labTest.create.name END,
    synonyms: CASE
      WHEN dltRel.labTest.create.synonyms IS NULL THEN lt.synonyms
      ELSE apoc.coll.toSet(coalesce(lt.synonyms, []) + coalesce(dltRel.labTest.create.synonyms, []))
    END,
    loincCodes: CASE
      WHEN dltRel.labTest.create.loincCodes IS NULL THEN lt.loincCodes
      ELSE apoc.coll.toSet(coalesce(lt.loincCodes, []) + coalesce(dltRel.labTest.create.loincCodes, []))
    END,
    cptCodes: CASE
      WHEN dltRel.labTest.create.cptCodes IS NULL THEN lt.cptCodes
      ELSE apoc.coll.toSet(coalesce(lt.cptCodes, []) + coalesce(dltRel.labTest.create.cptCodes, []))
    END,
    whatItMeasures: CASE WHEN dltRel.labTest.create.whatItMeasures IS NULL THEN lt.whatItMeasures ELSE dltRel.labTest.create.whatItMeasures END,
    prepRequirements: CASE WHEN dltRel.labTest.create.prepRequirements IS NULL THEN lt.prepRequirements ELSE dltRel.labTest.create.prepRequirements END,
    validAt: CASE WHEN dltRel.labTest.create.validAt IS NULL THEN lt.validAt ELSE dltRel.labTest.create.validAt END,
    invalidAt: CASE WHEN dltRel.labTest.create.invalidAt IS NULL THEN lt.invalidAt ELSE dltRel.labTest.create.invalidAt END,
    expiredAt: CASE WHEN dltRel.labTest.create.expiredAt IS NULL THEN lt.expiredAt ELSE dltRel.labTest.create.expiredAt END
  }

  MERGE (p)-[r:DELIVERS_LAB_TEST]->(lt)
  ON CREATE SET r.createdAt = datetime()

  SET r += {
    role: CASE WHEN dltRel.role IS NULL THEN r.role ELSE dltRel.role END,
    quantity: CASE WHEN dltRel.quantity IS NULL THEN r.quantity ELSE dltRel.quantity END,
    componentName: CASE WHEN dltRel.componentName IS NULL THEN r.componentName ELSE dltRel.componentName END,
    claimIds: CASE
      WHEN dltRel.claimIds IS NULL THEN r.claimIds
      ELSE apoc.coll.toSet(coalesce(r.claimIds, []) + coalesce(dltRel.claimIds, []))
    END,
    createdAt: CASE WHEN dltRel.createdAt IS NULL THEN r.createdAt ELSE dltRel.createdAt END,
    validAt: CASE WHEN dltRel.validAt IS NULL THEN r.validAt ELSE dltRel.validAt END,
    invalidAt: CASE WHEN dltRel.invalidAt IS NULL THEN r.invalidAt ELSE dltRel.invalidAt END,
    expiredAt: CASE WHEN dltRel.expiredAt IS NULL THEN r.expiredAt ELSE dltRel.expiredAt END
  }

  RETURN 1 AS ok

  UNION

  // ---- CONNECT branch (HARD FAIL if missing) ----
  WITH p, dltRel 
  WITH p, dltRel
  WHERE dltRel.labTest.connect IS NOT NULL

  OPTIONAL MATCH (lt:LabTest {labTestId: dltRel.labTest.connect.labTestId})
  WITH p, dltRel, lt

  CALL apoc.util.validate(
    lt IS NULL,
    'DELIVERS_LAB_TEST connect failed: LabTest not found for labTestId %s',
    [dltRel.labTest.connect.labTestId]
  )

  MERGE (p)-[r:DELIVERS_LAB_TEST]->(lt)
  ON CREATE SET r.createdAt = datetime()

  SET r += {
    role: CASE WHEN dltRel.role IS NULL THEN r.role ELSE dltRel.role END,
    quantity: CASE WHEN dltRel.quantity IS NULL THEN r.quantity ELSE dltRel.quantity END,
    componentName: CASE WHEN dltRel.componentName IS NULL THEN r.componentName ELSE dltRel.componentName END,
    claimIds: CASE
      WHEN dltRel.claimIds IS NULL THEN r.claimIds
      ELSE apoc.coll.toSet(coalesce(r.claimIds, []) + coalesce(dltRel.claimIds, []))
    END,
    createdAt: CASE WHEN dltRel.createdAt IS NULL THEN r.createdAt ELSE dltRel.createdAt END,
    validAt: CASE WHEN dltRel.validAt IS NULL THEN r.validAt ELSE dltRel.validAt END,
    invalidAt: CASE WHEN dltRel.invalidAt IS NULL THEN r.invalidAt ELSE dltRel.invalidAt END,
    expiredAt: CASE WHEN dltRel.expiredAt IS NULL THEN r.expiredAt ELSE dltRel.expiredAt END
  }

  RETURN 1 AS ok
}

RETURN 1 AS ok
`;

// ==================================================================
// IMPLEMENTS_PANEL (create OR connect) (CONNECT = HARD FAIL if missing)
// ==================================================================
export const productImplementsPanelCypher = `
MATCH (p:Product {productId: $productId})

UNWIND coalesce($implementsPanel, []) AS ipRel
CALL {
  // ---- CREATE branch ----
  WITH p, ipRel 
  WITH p, ipRel 
  WHERE ipRel.panelDefinition.create IS NOT NULL

  MERGE (pd:PanelDefinition {
    panelDefinitionId: coalesce(ipRel.panelDefinition.create.panelDefinitionId, randomUUID())
  })
  ON CREATE SET pd.createdAt = datetime()

  SET pd += {
    canonicalName: CASE WHEN ipRel.panelDefinition.create.canonicalName IS NULL THEN pd.canonicalName ELSE ipRel.panelDefinition.create.canonicalName END,
    aliases: CASE
      WHEN ipRel.panelDefinition.create.aliases IS NULL THEN pd.aliases
      ELSE apoc.coll.toSet(coalesce(pd.aliases, []) + coalesce(ipRel.panelDefinition.create.aliases, []))
    END,
    description: CASE WHEN ipRel.panelDefinition.create.description IS NULL THEN pd.description ELSE ipRel.panelDefinition.create.description END,
    validAt: CASE WHEN ipRel.panelDefinition.create.validAt IS NULL THEN pd.validAt ELSE ipRel.panelDefinition.create.validAt END,
    invalidAt: CASE WHEN ipRel.panelDefinition.create.invalidAt IS NULL THEN pd.invalidAt ELSE ipRel.panelDefinition.create.invalidAt END,
    expiredAt: CASE WHEN ipRel.panelDefinition.create.expiredAt IS NULL THEN pd.expiredAt ELSE ipRel.panelDefinition.create.expiredAt END
  }

  MERGE (p)-[r:IMPLEMENTS_PANEL]->(pd)
  ON CREATE SET r.createdAt = datetime()

  SET r += {
    panelRole: CASE WHEN ipRel.panelRole IS NULL THEN r.panelRole ELSE ipRel.panelRole END,
    versionLabel: CASE WHEN ipRel.versionLabel IS NULL THEN r.versionLabel ELSE ipRel.versionLabel END,
    claimIds: CASE
      WHEN ipRel.claimIds IS NULL THEN r.claimIds
      ELSE apoc.coll.toSet(coalesce(r.claimIds, []) + coalesce(ipRel.claimIds, []))
    END,
    createdAt: CASE WHEN ipRel.createdAt IS NULL THEN r.createdAt ELSE ipRel.createdAt END,
    validAt: CASE WHEN ipRel.validAt IS NULL THEN r.validAt ELSE ipRel.validAt END,
    invalidAt: CASE WHEN ipRel.invalidAt IS NULL THEN r.invalidAt ELSE ipRel.invalidAt END,
    expiredAt: CASE WHEN ipRel.expiredAt IS NULL THEN r.expiredAt ELSE ipRel.expiredAt END
  }

  RETURN 1 AS ok

  UNION

  // ---- CONNECT branch (HARD FAIL if missing) ----
  WITH p, ipRel 
  WITH p, ipRel
  WHERE ipRel.panelDefinition.connect IS NOT NULL

  OPTIONAL MATCH (pd:PanelDefinition {panelDefinitionId: ipRel.panelDefinition.connect.panelDefinitionId})
  WITH p, ipRel, pd

  CALL apoc.util.validate(
    pd IS NULL,
    'IMPLEMENTS_PANEL connect failed: PanelDefinition not found for panelDefinitionId %s',
    [ipRel.panelDefinition.connect.panelDefinitionId]
  )

  MERGE (p)-[r:IMPLEMENTS_PANEL]->(pd)
  ON CREATE SET r.createdAt = datetime()

  SET r += {
    panelRole: CASE WHEN ipRel.panelRole IS NULL THEN r.panelRole ELSE ipRel.panelRole END,
    versionLabel: CASE WHEN ipRel.versionLabel IS NULL THEN r.versionLabel ELSE ipRel.versionLabel END,
    claimIds: CASE
      WHEN ipRel.claimIds IS NULL THEN r.claimIds
      ELSE apoc.coll.toSet(coalesce(r.claimIds, []) + coalesce(ipRel.claimIds, []))
    END,
    createdAt: CASE WHEN ipRel.createdAt IS NULL THEN r.createdAt ELSE ipRel.createdAt END,
    validAt: CASE WHEN ipRel.validAt IS NULL THEN r.validAt ELSE ipRel.validAt END,
    invalidAt: CASE WHEN ipRel.invalidAt IS NULL THEN r.invalidAt ELSE ipRel.invalidAt END,
    expiredAt: CASE WHEN ipRel.expiredAt IS NULL THEN r.expiredAt ELSE ipRel.expiredAt END
  }

  RETURN 1 AS ok
}

RETURN 1 AS ok
`;

// ==================================================================
// CONTAINS_COMPOUND_FORM (create OR connect) (CONNECT = HARD FAIL if missing)
// ==================================================================
export const productContainsCompoundFormCypher = `
MATCH (p:Product {productId: $productId})

UNWIND coalesce($containsCompoundForm, []) AS ccfRel
CALL {
  // ---- CREATE branch ----
  WITH p, ccfRel 
  WITH p, ccfRel 
  WHERE ccfRel.compoundForm.create IS NOT NULL

  MERGE (cf:CompoundForm {
    compoundFormId: coalesce(ccfRel.compoundForm.create.compoundFormId, randomUUID())
  })
  ON CREATE SET cf.createdAt = datetime()

  SET cf += {
    canonicalName: CASE WHEN ccfRel.compoundForm.create.canonicalName IS NULL THEN cf.canonicalName ELSE ccfRel.compoundForm.create.canonicalName END,
    formType: CASE WHEN ccfRel.compoundForm.create.formType IS NULL THEN cf.formType ELSE ccfRel.compoundForm.create.formType END,
    chemicalDifferences: CASE WHEN ccfRel.compoundForm.create.chemicalDifferences IS NULL THEN cf.chemicalDifferences ELSE ccfRel.compoundForm.create.chemicalDifferences END,
    stabilityProfile: CASE WHEN ccfRel.compoundForm.create.stabilityProfile IS NULL THEN cf.stabilityProfile ELSE ccfRel.compoundForm.create.stabilityProfile END,
    solubilityProfile: CASE WHEN ccfRel.compoundForm.create.solubilityProfile IS NULL THEN cf.solubilityProfile ELSE ccfRel.compoundForm.create.solubilityProfile END,
    bioavailabilityNotes: CASE WHEN ccfRel.compoundForm.create.bioavailabilityNotes IS NULL THEN cf.bioavailabilityNotes ELSE ccfRel.compoundForm.create.bioavailabilityNotes END,
    regulatoryStatusSummary: CASE WHEN ccfRel.compoundForm.create.regulatoryStatusSummary IS NULL THEN cf.regulatoryStatusSummary ELSE ccfRel.compoundForm.create.regulatoryStatusSummary END
  }

  MERGE (p)-[r:CONTAINS_COMPOUND_FORM]->(cf)
  ON CREATE SET r.createdAt = datetime()

  SET r += {
    dose: CASE WHEN ccfRel.dose IS NULL THEN r.dose ELSE ccfRel.dose END,
    doseUnit: CASE WHEN ccfRel.doseUnit IS NULL THEN r.doseUnit ELSE ccfRel.doseUnit END,
    role: CASE WHEN ccfRel.role IS NULL THEN r.role ELSE ccfRel.role END,
    standardizedTo: CASE WHEN ccfRel.standardizedTo IS NULL THEN r.standardizedTo ELSE ccfRel.standardizedTo END,
    claimIds: CASE
      WHEN ccfRel.claimIds IS NULL THEN r.claimIds
      ELSE apoc.coll.toSet(coalesce(r.claimIds, []) + coalesce(ccfRel.claimIds, []))
    END,
    createdAt: CASE WHEN ccfRel.createdAt IS NULL THEN r.createdAt ELSE ccfRel.createdAt END,
    validAt: CASE WHEN ccfRel.validAt IS NULL THEN r.validAt ELSE ccfRel.validAt END,
    invalidAt: CASE WHEN ccfRel.invalidAt IS NULL THEN r.invalidAt ELSE ccfRel.invalidAt END,
    expiredAt: CASE WHEN ccfRel.expiredAt IS NULL THEN r.expiredAt ELSE ccfRel.expiredAt END
  }

  RETURN 1 AS ok

  UNION

  // ---- CONNECT branch (HARD FAIL if missing) ----
  WITH p, ccfRel 
  WITH p, ccfRel
  WHERE ccfRel.compoundForm.connect IS NOT NULL

  OPTIONAL MATCH (cf:CompoundForm {compoundFormId: ccfRel.compoundForm.connect.compoundFormId})
  WITH p, ccfRel, cf

  CALL apoc.util.validate(
    cf IS NULL,
    'CONTAINS_COMPOUND_FORM connect failed: CompoundForm not found for compoundFormId %s',
    [ccfRel.compoundForm.connect.compoundFormId]
  )

  MERGE (p)-[r:CONTAINS_COMPOUND_FORM]->(cf)
  ON CREATE SET r.createdAt = datetime()

  SET r += {
    dose: CASE WHEN ccfRel.dose IS NULL THEN r.dose ELSE ccfRel.dose END,
    doseUnit: CASE WHEN ccfRel.doseUnit IS NULL THEN r.doseUnit ELSE ccfRel.doseUnit END,
    role: CASE WHEN ccfRel.role IS NULL THEN r.role ELSE ccfRel.role END,
    standardizedTo: CASE WHEN ccfRel.standardizedTo IS NULL THEN r.standardizedTo ELSE ccfRel.standardizedTo END,
    claimIds: CASE
      WHEN ccfRel.claimIds IS NULL THEN r.claimIds
      ELSE apoc.coll.toSet(coalesce(r.claimIds, []) + coalesce(ccfRel.claimIds, []))
    END,
    createdAt: CASE WHEN ccfRel.createdAt IS NULL THEN r.createdAt ELSE ccfRel.createdAt END,
    validAt: CASE WHEN ccfRel.validAt IS NULL THEN r.validAt ELSE ccfRel.validAt END,
    invalidAt: CASE WHEN ccfRel.invalidAt IS NULL THEN r.invalidAt ELSE ccfRel.invalidAt END,
    expiredAt: CASE WHEN ccfRel.expiredAt IS NULL THEN r.expiredAt ELSE ccfRel.expiredAt END
  }

  RETURN 1 AS ok
}

RETURN 1 AS ok
`;

// ==================================================================
// FOLLOWS_PATHWAY (create OR connect) (CONNECT = HARD FAIL if missing)
// ==================================================================
export const productFollowsPathwayCypher = `
MATCH (p:Product {productId: $productId})

UNWIND coalesce($followsPathway, []) AS fpRel
CALL {
  // ---- CREATE branch ----
  WITH p, fpRel 
  WITH p, fpRel 
  WHERE fpRel.regulatoryPathway.create IS NOT NULL

  MERGE (rp:RegulatoryPathway {
    pathwayId: coalesce(fpRel.regulatoryPathway.create.pathwayId, randomUUID())
  })
  ON CREATE SET rp.createdAt = datetime()

  SET rp += {
    authority: CASE WHEN fpRel.regulatoryPathway.create.authority IS NULL THEN rp.authority ELSE fpRel.regulatoryPathway.create.authority END,
    pathwayType: CASE WHEN fpRel.regulatoryPathway.create.pathwayType IS NULL THEN rp.pathwayType ELSE fpRel.regulatoryPathway.create.pathwayType END,
    pathwayName: CASE WHEN fpRel.regulatoryPathway.create.pathwayName IS NULL THEN rp.pathwayName ELSE fpRel.regulatoryPathway.create.pathwayName END,
    requirementsSummary: CASE WHEN fpRel.regulatoryPathway.create.requirementsSummary IS NULL THEN rp.requirementsSummary ELSE fpRel.regulatoryPathway.create.requirementsSummary END,
    validAt: CASE WHEN fpRel.regulatoryPathway.create.validAt IS NULL THEN rp.validAt ELSE fpRel.regulatoryPathway.create.validAt END,
    invalidAt: CASE WHEN fpRel.regulatoryPathway.create.invalidAt IS NULL THEN rp.invalidAt ELSE fpRel.regulatoryPathway.create.invalidAt END,
    expiredAt: CASE WHEN fpRel.regulatoryPathway.create.expiredAt IS NULL THEN rp.expiredAt ELSE fpRel.regulatoryPathway.create.expiredAt END
  }

  MERGE (p)-[r:FOLLOWS_PATHWAY]->(rp)
  ON CREATE SET r.createdAt = datetime()

  SET r += {
    jurisdictionId: CASE WHEN fpRel.jurisdictionId IS NULL THEN r.jurisdictionId ELSE fpRel.jurisdictionId END,
    claimIds: CASE
      WHEN fpRel.claimIds IS NULL THEN r.claimIds
      ELSE apoc.coll.toSet(coalesce(r.claimIds, []) + coalesce(fpRel.claimIds, []))
    END,
    createdAt: CASE WHEN fpRel.createdAt IS NULL THEN r.createdAt ELSE fpRel.createdAt END,
    validAt: CASE WHEN fpRel.validAt IS NULL THEN r.validAt ELSE fpRel.validAt END,
    invalidAt: CASE WHEN fpRel.invalidAt IS NULL THEN r.invalidAt ELSE fpRel.invalidAt END,
    expiredAt: CASE WHEN fpRel.expiredAt IS NULL THEN r.expiredAt ELSE fpRel.expiredAt END
  }

  RETURN 1 AS ok

  UNION

  // ---- CONNECT branch (HARD FAIL if missing) ----
  WITH p, fpRel 
  WITH p, fpRel
  WHERE fpRel.regulatoryPathway.connect IS NOT NULL

  OPTIONAL MATCH (rp:RegulatoryPathway {pathwayId: fpRel.regulatoryPathway.connect.pathwayId})
  WITH p, fpRel, rp

  CALL apoc.util.validate(
    rp IS NULL,
    'FOLLOWS_PATHWAY connect failed: RegulatoryPathway not found for pathwayId %s',
    [fpRel.regulatoryPathway.connect.pathwayId]
  )

  MERGE (p)-[r:FOLLOWS_PATHWAY]->(rp)
  ON CREATE SET r.createdAt = datetime()

  SET r += {
    jurisdictionId: CASE WHEN fpRel.jurisdictionId IS NULL THEN r.jurisdictionId ELSE fpRel.jurisdictionId END,
    claimIds: CASE
      WHEN fpRel.claimIds IS NULL THEN r.claimIds
      ELSE apoc.coll.toSet(coalesce(r.claimIds, []) + coalesce(fpRel.claimIds, []))
    END,
    createdAt: CASE WHEN fpRel.createdAt IS NULL THEN r.createdAt ELSE fpRel.createdAt END,
    validAt: CASE WHEN fpRel.validAt IS NULL THEN r.validAt ELSE fpRel.validAt END,
    invalidAt: CASE WHEN fpRel.invalidAt IS NULL THEN r.invalidAt ELSE fpRel.invalidAt END,
    expiredAt: CASE WHEN fpRel.expiredAt IS NULL THEN r.expiredAt ELSE fpRel.expiredAt END
  }

  RETURN 1 AS ok
}

RETURN 1 AS ok
`;

export const returnProductsCypher = `
MATCH (p:Product {productId: $productId})
RETURN p
`;

export const createProductStatements = {
  upsertProductsCypher,
  productDeliversLabTestCypher,
  productImplementsPanelCypher,
  productContainsCompoundFormCypher,
  productFollowsPathwayCypher,
  returnProductsCypher,
};

