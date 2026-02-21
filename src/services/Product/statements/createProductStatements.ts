import { ProductIdentifierKey } from "../types.js";

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

// ==================================================================
// IN_CATEGORY (create OR connect) (CONNECT = HARD FAIL if missing)
// ==================================================================
export const productInCategoryCypher = `
MATCH (p:Product {productId: $productId})

UNWIND coalesce($inCategory, []) AS icRel
CALL {
  // ---- CREATE branch ----
  WITH p, icRel 
  WITH p, icRel 
  WHERE icRel.productCategory.create IS NOT NULL

  MERGE (pc:ProductCategory {
    categoryId: coalesce(icRel.productCategory.create.categoryId, randomUUID())
  })
  ON CREATE SET pc.createdAt = datetime()

  SET pc += {
    name: CASE WHEN icRel.productCategory.create.name IS NULL THEN pc.name ELSE icRel.productCategory.create.name END,
    description: CASE WHEN icRel.productCategory.create.description IS NULL THEN pc.description ELSE icRel.productCategory.create.description END,
    aliases: CASE
      WHEN icRel.productCategory.create.aliases IS NULL THEN pc.aliases
      ELSE apoc.coll.toSet(coalesce(pc.aliases, []) + coalesce(icRel.productCategory.create.aliases, []))
    END,
    validAt: CASE WHEN icRel.productCategory.create.validAt IS NULL THEN pc.validAt ELSE icRel.productCategory.create.validAt END,
    invalidAt: CASE WHEN icRel.productCategory.create.invalidAt IS NULL THEN pc.invalidAt ELSE icRel.productCategory.create.invalidAt END,
    expiredAt: CASE WHEN icRel.productCategory.create.expiredAt IS NULL THEN pc.expiredAt ELSE icRel.productCategory.create.expiredAt END
  }

  MERGE (p)-[r:IN_CATEGORY]->(pc)
  ON CREATE SET r.createdAt = datetime()

  SET r += {
    claimIds: CASE
      WHEN icRel.claimIds IS NULL THEN r.claimIds
      ELSE apoc.coll.toSet(coalesce(r.claimIds, []) + coalesce(icRel.claimIds, []))
    END,
    createdAt: CASE WHEN icRel.createdAt IS NULL THEN r.createdAt ELSE icRel.createdAt END,
    validAt: CASE WHEN icRel.validAt IS NULL THEN r.validAt ELSE icRel.validAt END,
    invalidAt: CASE WHEN icRel.invalidAt IS NULL THEN r.invalidAt ELSE icRel.invalidAt END,
    expiredAt: CASE WHEN icRel.expiredAt IS NULL THEN r.expiredAt ELSE icRel.expiredAt END
  }

  RETURN 1 AS ok

  UNION

  // ---- CONNECT branch (HARD FAIL if missing) ----
  WITH p, icRel 
  WITH p, icRel
  WHERE icRel.productCategory.connect IS NOT NULL

  OPTIONAL MATCH (pc:ProductCategory {categoryId: icRel.productCategory.connect.categoryId})
  WITH p, icRel, pc

  CALL apoc.util.validate(
    pc IS NULL,
    'IN_CATEGORY connect failed: ProductCategory not found for categoryId %s',
    [icRel.productCategory.connect.categoryId]
  )

  MERGE (p)-[r:IN_CATEGORY]->(pc)
  ON CREATE SET r.createdAt = datetime()

  SET r += {
    claimIds: CASE
      WHEN icRel.claimIds IS NULL THEN r.claimIds
      ELSE apoc.coll.toSet(coalesce(r.claimIds, []) + coalesce(icRel.claimIds, []))
    END,
    createdAt: CASE WHEN icRel.createdAt IS NULL THEN r.createdAt ELSE icRel.createdAt END,
    validAt: CASE WHEN icRel.validAt IS NULL THEN r.validAt ELSE icRel.validAt END,
    invalidAt: CASE WHEN icRel.invalidAt IS NULL THEN r.invalidAt ELSE icRel.invalidAt END,
    expiredAt: CASE WHEN icRel.expiredAt IS NULL THEN r.expiredAt ELSE icRel.expiredAt END
  }

  RETURN 1 AS ok
}

RETURN 1 AS ok
`;

// ==================================================================
// USES_PLATFORM (create OR connect) (CONNECT = HARD FAIL if missing)
// ==================================================================
export const productUsesPlatformCypher = `
MATCH (p:Product {productId: $productId})

UNWIND coalesce($usesPlatform, []) AS upRel
CALL {
  // ---- CREATE branch ----
  WITH p, upRel 
  WITH p, upRel 
  WHERE upRel.technologyPlatform.create IS NOT NULL

  MERGE (tp:TechnologyPlatform {
    platformId: coalesce(upRel.technologyPlatform.create.platformId, randomUUID())
  })
  ON CREATE SET tp.createdAt = datetime()

  SET tp += {
    canonicalName: CASE WHEN upRel.technologyPlatform.create.canonicalName IS NULL THEN tp.canonicalName ELSE upRel.technologyPlatform.create.canonicalName END,
    aliases: CASE
      WHEN upRel.technologyPlatform.create.aliases IS NULL THEN tp.aliases
      ELSE apoc.coll.toSet(coalesce(tp.aliases, []) + coalesce(upRel.technologyPlatform.create.aliases, []))
    END,
    platformType: CASE WHEN upRel.technologyPlatform.create.platformType IS NULL THEN tp.platformType ELSE upRel.technologyPlatform.create.platformType END,
    description: CASE WHEN upRel.technologyPlatform.create.description IS NULL THEN tp.description ELSE upRel.technologyPlatform.create.description END,
    validAt: CASE WHEN upRel.technologyPlatform.create.validAt IS NULL THEN tp.validAt ELSE upRel.technologyPlatform.create.validAt END,
    invalidAt: CASE WHEN upRel.technologyPlatform.create.invalidAt IS NULL THEN tp.invalidAt ELSE upRel.technologyPlatform.create.invalidAt END,
    expiredAt: CASE WHEN upRel.technologyPlatform.create.expiredAt IS NULL THEN tp.expiredAt ELSE upRel.technologyPlatform.create.expiredAt END
  }

  MERGE (p)-[r:USES_PLATFORM]->(tp)
  ON CREATE SET r.createdAt = datetime()

  SET r += {
    claimIds: CASE
      WHEN upRel.claimIds IS NULL THEN r.claimIds
      ELSE apoc.coll.toSet(coalesce(r.claimIds, []) + coalesce(upRel.claimIds, []))
    END,
    createdAt: CASE WHEN upRel.createdAt IS NULL THEN r.createdAt ELSE upRel.createdAt END,
    validAt: CASE WHEN upRel.validAt IS NULL THEN r.validAt ELSE upRel.validAt END,
    invalidAt: CASE WHEN upRel.invalidAt IS NULL THEN r.invalidAt ELSE upRel.invalidAt END,
    expiredAt: CASE WHEN upRel.expiredAt IS NULL THEN r.expiredAt ELSE upRel.expiredAt END
  }

  RETURN 1 AS ok

  UNION

  // ---- CONNECT branch (HARD FAIL if missing) ----
  WITH p, upRel 
  WITH p, upRel
  WHERE upRel.technologyPlatform.connect IS NOT NULL

  OPTIONAL MATCH (tp:TechnologyPlatform {platformId: upRel.technologyPlatform.connect.platformId})
  WITH p, upRel, tp

  CALL apoc.util.validate(
    tp IS NULL,
    'USES_PLATFORM connect failed: TechnologyPlatform not found for platformId %s',
    [upRel.technologyPlatform.connect.platformId]
  )

  MERGE (p)-[r:USES_PLATFORM]->(tp)
  ON CREATE SET r.createdAt = datetime()

  SET r += {
    claimIds: CASE
      WHEN upRel.claimIds IS NULL THEN r.claimIds
      ELSE apoc.coll.toSet(coalesce(r.claimIds, []) + coalesce(upRel.claimIds, []))
    END,
    createdAt: CASE WHEN upRel.createdAt IS NULL THEN r.createdAt ELSE upRel.createdAt END,
    validAt: CASE WHEN upRel.validAt IS NULL THEN r.validAt ELSE upRel.validAt END,
    invalidAt: CASE WHEN upRel.invalidAt IS NULL THEN r.invalidAt ELSE upRel.invalidAt END,
    expiredAt: CASE WHEN upRel.expiredAt IS NULL THEN r.expiredAt ELSE upRel.expiredAt END
  }

  RETURN 1 AS ok
}

RETURN 1 AS ok
`;

// ==================================================================
// HAS_REGULATORY_STATUS (create OR connect) (CONNECT = HARD FAIL if missing)
// ==================================================================
export const productHasRegulatoryStatusCypher = `
MATCH (p:Product {productId: $productId})

UNWIND coalesce($hasRegulatoryStatus, []) AS hrsRel
CALL {
  // ---- CREATE branch ----
  WITH p, hrsRel 
  WITH p, hrsRel 
  WHERE hrsRel.regulatoryStatus.create IS NOT NULL

  MERGE (rs:RegulatoryStatus {
    regulatoryStatusId: coalesce(hrsRel.regulatoryStatus.create.regulatoryStatusId, randomUUID())
  })
  ON CREATE SET rs.createdAt = datetime()

  SET rs += {
    status: CASE WHEN hrsRel.regulatoryStatus.create.status IS NULL THEN rs.status ELSE hrsRel.regulatoryStatus.create.status END,
    effectiveDate: CASE WHEN hrsRel.regulatoryStatus.create.effectiveDate IS NULL THEN rs.effectiveDate ELSE hrsRel.regulatoryStatus.create.effectiveDate END,
    statusDetails: CASE WHEN hrsRel.regulatoryStatus.create.statusDetails IS NULL THEN rs.statusDetails ELSE hrsRel.regulatoryStatus.create.statusDetails END,
    validAt: CASE WHEN hrsRel.regulatoryStatus.create.validAt IS NULL THEN rs.validAt ELSE hrsRel.regulatoryStatus.create.validAt END,
    invalidAt: CASE WHEN hrsRel.regulatoryStatus.create.invalidAt IS NULL THEN rs.invalidAt ELSE hrsRel.regulatoryStatus.create.invalidAt END,
    expiredAt: CASE WHEN hrsRel.regulatoryStatus.create.expiredAt IS NULL THEN rs.expiredAt ELSE hrsRel.regulatoryStatus.create.expiredAt END
  }

  MERGE (p)-[r:HAS_REGULATORY_STATUS]->(rs)
  ON CREATE SET r.createdAt = datetime()

  SET r += {
    status: CASE WHEN hrsRel.status IS NULL THEN r.status ELSE hrsRel.status END,
    effectiveDate: CASE WHEN hrsRel.effectiveDate IS NULL THEN r.effectiveDate ELSE hrsRel.effectiveDate END,
    statusDetails: CASE WHEN hrsRel.statusDetails IS NULL THEN r.statusDetails ELSE hrsRel.statusDetails END,
    claimIds: CASE
      WHEN hrsRel.claimIds IS NULL THEN r.claimIds
      ELSE apoc.coll.toSet(coalesce(r.claimIds, []) + coalesce(hrsRel.claimIds, []))
    END,
    createdAt: CASE WHEN hrsRel.createdAt IS NULL THEN r.createdAt ELSE hrsRel.createdAt END,
    validAt: CASE WHEN hrsRel.validAt IS NULL THEN r.validAt ELSE hrsRel.validAt END,
    invalidAt: CASE WHEN hrsRel.invalidAt IS NULL THEN r.invalidAt ELSE hrsRel.invalidAt END,
    expiredAt: CASE WHEN hrsRel.expiredAt IS NULL THEN r.expiredAt ELSE hrsRel.expiredAt END
  }

  RETURN 1 AS ok

  UNION

  // ---- CONNECT branch (HARD FAIL if missing) ----
  WITH p, hrsRel 
  WITH p, hrsRel
  WHERE hrsRel.regulatoryStatus.connect IS NOT NULL

  OPTIONAL MATCH (rs:RegulatoryStatus {regulatoryStatusId: hrsRel.regulatoryStatus.connect.regulatoryStatusId})
  WITH p, hrsRel, rs

  CALL apoc.util.validate(
    rs IS NULL,
    'HAS_REGULATORY_STATUS connect failed: RegulatoryStatus not found for regulatoryStatusId %s',
    [hrsRel.regulatoryStatus.connect.regulatoryStatusId]
  )

  MERGE (p)-[r:HAS_REGULATORY_STATUS]->(rs)
  ON CREATE SET r.createdAt = datetime()

  SET r += {
    status: CASE WHEN hrsRel.status IS NULL THEN r.status ELSE hrsRel.status END,
    effectiveDate: CASE WHEN hrsRel.effectiveDate IS NULL THEN r.effectiveDate ELSE hrsRel.effectiveDate END,
    statusDetails: CASE WHEN hrsRel.statusDetails IS NULL THEN r.statusDetails ELSE hrsRel.statusDetails END,
    claimIds: CASE
      WHEN hrsRel.claimIds IS NULL THEN r.claimIds
      ELSE apoc.coll.toSet(coalesce(r.claimIds, []) + coalesce(hrsRel.claimIds, []))
    END,
    createdAt: CASE WHEN hrsRel.createdAt IS NULL THEN r.createdAt ELSE hrsRel.createdAt END,
    validAt: CASE WHEN hrsRel.validAt IS NULL THEN r.validAt ELSE hrsRel.validAt END,
    invalidAt: CASE WHEN hrsRel.invalidAt IS NULL THEN r.invalidAt ELSE hrsRel.invalidAt END,
    expiredAt: CASE WHEN hrsRel.expiredAt IS NULL THEN r.expiredAt ELSE hrsRel.expiredAt END
  }

  RETURN 1 AS ok
}

RETURN 1 AS ok
`;

// ==================================================================
// MANUFACTURED_BY (create OR connect) (CONNECT = HARD FAIL if missing)
// Note: This is an incoming relationship exposed as outgoing
// In Neo4j: (Organization)-[:MANUFACTURES_PRODUCT]->(Product)
// ==================================================================
export const productManufacturedByCypher = `
MATCH (p:Product {productId: $productId})

UNWIND coalesce($manufacturedBy, []) AS mbRel
CALL {
  // ---- CREATE branch ----
  WITH p, mbRel 
  WITH p, mbRel 
  WHERE mbRel.organization.create IS NOT NULL

  MERGE (o:Organization {
    organizationId: coalesce(mbRel.organization.create.organizationId, randomUUID())
  })
  ON CREATE SET o.createdAt = datetime()

  SET o.organizationId = coalesce(o.organizationId, randomUUID())

  SET o += {
    name: CASE WHEN mbRel.organization.create.name IS NULL THEN o.name ELSE mbRel.organization.create.name END,
    aliases: CASE
      WHEN mbRel.organization.create.aliases IS NULL THEN o.aliases
      ELSE apoc.coll.toSet(coalesce(o.aliases, []) + coalesce(mbRel.organization.create.aliases, []))
    END,
    orgType: CASE WHEN mbRel.organization.create.orgType IS NULL THEN o.orgType ELSE mbRel.organization.create.orgType END,
    description: CASE WHEN mbRel.organization.create.description IS NULL THEN o.description ELSE mbRel.organization.create.description END,
    businessModel: CASE WHEN mbRel.organization.create.businessModel IS NULL THEN o.businessModel ELSE mbRel.organization.create.businessModel END,
    primaryIndustryTags: CASE
      WHEN mbRel.organization.create.primaryIndustryTags IS NULL THEN o.primaryIndustryTags
      ELSE apoc.coll.toSet(coalesce(o.primaryIndustryTags, []) + coalesce(mbRel.organization.create.primaryIndustryTags, []))
    END,
    regionsServed: CASE
      WHEN mbRel.organization.create.regionsServed IS NULL THEN o.regionsServed
      ELSE apoc.coll.toSet(coalesce(o.regionsServed, []) + coalesce(mbRel.organization.create.regionsServed, []))
    END,
    legalName: CASE WHEN mbRel.organization.create.legalName IS NULL THEN o.legalName ELSE mbRel.organization.create.legalName END,
    legalStructure: CASE WHEN mbRel.organization.create.legalStructure IS NULL THEN o.legalStructure ELSE mbRel.organization.create.legalStructure END,
    ownershipType: CASE WHEN mbRel.organization.create.ownershipType IS NULL THEN o.ownershipType ELSE mbRel.organization.create.ownershipType END,
    jurisdictionsOfIncorporation: CASE
      WHEN mbRel.organization.create.jurisdictionsOfIncorporation IS NULL THEN o.jurisdictionsOfIncorporation
      ELSE apoc.coll.toSet(coalesce(o.jurisdictionsOfIncorporation, []) + coalesce(mbRel.organization.create.jurisdictionsOfIncorporation, []))
    END,
    websiteUrl: CASE WHEN mbRel.organization.create.websiteUrl IS NULL THEN o.websiteUrl ELSE mbRel.organization.create.websiteUrl END,
    defaultCollectionModes: CASE
      WHEN mbRel.organization.create.defaultCollectionModes IS NULL THEN o.defaultCollectionModes
      ELSE apoc.coll.toSet(coalesce(o.defaultCollectionModes, []) + coalesce(mbRel.organization.create.defaultCollectionModes, []))
    END,
    defaultRegionsAvailable: CASE
      WHEN mbRel.organization.create.defaultRegionsAvailable IS NULL THEN o.defaultRegionsAvailable
      ELSE apoc.coll.toSet(coalesce(o.defaultRegionsAvailable, []) + coalesce(mbRel.organization.create.defaultRegionsAvailable, []))
    END,
    publicTicker: CASE WHEN mbRel.organization.create.publicTicker IS NULL THEN o.publicTicker ELSE mbRel.organization.create.publicTicker END,
    fundingStage: CASE WHEN mbRel.organization.create.fundingStage IS NULL THEN o.fundingStage ELSE mbRel.organization.create.fundingStage END,
    employeeCountMin: CASE WHEN mbRel.organization.create.employeeCountMin IS NULL THEN o.employeeCountMin ELSE mbRel.organization.create.employeeCountMin END,
    employeeCountMax: CASE WHEN mbRel.organization.create.employeeCountMax IS NULL THEN o.employeeCountMax ELSE mbRel.organization.create.employeeCountMax END,
    employeeCountAsOf: CASE WHEN mbRel.organization.create.employeeCountAsOf IS NULL THEN o.employeeCountAsOf ELSE mbRel.organization.create.employeeCountAsOf END,
    revenueAnnualMin: CASE WHEN mbRel.organization.create.revenueAnnualMin IS NULL THEN o.revenueAnnualMin ELSE mbRel.organization.create.revenueAnnualMin END,
    revenueAnnualMax: CASE WHEN mbRel.organization.create.revenueAnnualMax IS NULL THEN o.revenueAnnualMax ELSE mbRel.organization.create.revenueAnnualMax END,
    revenueAnnualCurrency: CASE WHEN mbRel.organization.create.revenueAnnualCurrency IS NULL THEN o.revenueAnnualCurrency ELSE mbRel.organization.create.revenueAnnualCurrency END,
    revenueAnnualAsOf: CASE WHEN mbRel.organization.create.revenueAnnualAsOf IS NULL THEN o.revenueAnnualAsOf ELSE mbRel.organization.create.revenueAnnualAsOf END,
    validAt: CASE WHEN mbRel.organization.create.validAt IS NULL THEN o.validAt ELSE mbRel.organization.create.validAt END,
    invalidAt: CASE WHEN mbRel.organization.create.invalidAt IS NULL THEN o.invalidAt ELSE mbRel.organization.create.invalidAt END,
    expiredAt: CASE WHEN mbRel.organization.create.expiredAt IS NULL THEN o.expiredAt ELSE mbRel.organization.create.expiredAt END
  }

  MERGE (o)-[r:MANUFACTURES_PRODUCT]->(p)
  ON CREATE SET r.createdAt = datetime()

  SET r += {
    claimIds: CASE
      WHEN mbRel.claimIds IS NULL THEN r.claimIds
      ELSE apoc.coll.toSet(coalesce(r.claimIds, []) + coalesce(mbRel.claimIds, []))
    END,
    createdAt: CASE WHEN mbRel.createdAt IS NULL THEN r.createdAt ELSE mbRel.createdAt END,
    validAt: CASE WHEN mbRel.validAt IS NULL THEN r.validAt ELSE mbRel.validAt END,
    invalidAt: CASE WHEN mbRel.invalidAt IS NULL THEN r.invalidAt ELSE mbRel.invalidAt END,
    expiredAt: CASE WHEN mbRel.expiredAt IS NULL THEN r.expiredAt ELSE mbRel.expiredAt END
  }

  RETURN 1 AS ok

  UNION

  // ---- CONNECT branch (HARD FAIL if missing) ----
  WITH p, mbRel 
  WITH p, mbRel
  WHERE mbRel.organization.connect IS NOT NULL

  OPTIONAL MATCH (o:Organization {organizationId: mbRel.organization.connect.organizationId})
  WITH p, mbRel, o

  CALL apoc.util.validate(
    o IS NULL,
    'MANUFACTURED_BY connect failed: Organization not found for organizationId %s',
    [mbRel.organization.connect.organizationId]
  )

  MERGE (o)-[r:MANUFACTURES_PRODUCT]->(p)
  ON CREATE SET r.createdAt = datetime()

  SET r += {
    claimIds: CASE
      WHEN mbRel.claimIds IS NULL THEN r.claimIds
      ELSE apoc.coll.toSet(coalesce(r.claimIds, []) + coalesce(mbRel.claimIds, []))
    END,
    createdAt: CASE WHEN mbRel.createdAt IS NULL THEN r.createdAt ELSE mbRel.createdAt END,
    validAt: CASE WHEN mbRel.validAt IS NULL THEN r.validAt ELSE mbRel.validAt END,
    invalidAt: CASE WHEN mbRel.invalidAt IS NULL THEN r.invalidAt ELSE mbRel.invalidAt END,
    expiredAt: CASE WHEN mbRel.expiredAt IS NULL THEN r.expiredAt ELSE mbRel.expiredAt END
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
  productDeliversLabTestCypher,
  productImplementsPanelCypher,
  productContainsCompoundFormCypher,
  productFollowsPathwayCypher,
  productInCategoryCypher,
  productUsesPlatformCypher,
  productHasRegulatoryStatusCypher,
  productManufacturedByCypher,
  returnProductsCypher,
};

