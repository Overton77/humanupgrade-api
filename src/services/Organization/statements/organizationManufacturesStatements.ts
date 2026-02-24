export const organizationManufacturesCompoundFormCypher = `
// ==================================================================
// MANUFACTURES (create OR connect) (CONNECT = HARD FAIL if missing)
// ==================================================================
MATCH (o:Organization {organizationId: $organizationId})

UNWIND coalesce($manufactures, []) AS mRel
CALL {
  // ---- CREATE branch ----
  WITH o, mRel 
  WITH o, mRel  
  WHERE mRel.compoundForm.create IS NOT NULL

  MERGE (cf:CompoundForm {
    compoundFormId: coalesce(mRel.compoundForm.create.compoundFormId, randomUUID())
  })
  ON CREATE SET cf.createdAt = datetime()

  SET cf += {
    canonicalName: CASE WHEN mRel.compoundForm.create.canonicalName IS NULL THEN cf.canonicalName ELSE mRel.compoundForm.create.canonicalName END,
    formType: CASE WHEN mRel.compoundForm.create.formType IS NULL THEN cf.formType ELSE mRel.compoundForm.create.formType END,
    chemicalDifferences: CASE WHEN mRel.compoundForm.create.chemicalDifferences IS NULL THEN cf.chemicalDifferences ELSE mRel.compoundForm.create.chemicalDifferences END,
    stabilityProfile: CASE WHEN mRel.compoundForm.create.stabilityProfile IS NULL THEN cf.stabilityProfile ELSE mRel.compoundForm.create.stabilityProfile END,
    solubilityProfile: CASE WHEN mRel.compoundForm.create.solubilityProfile IS NULL THEN cf.solubilityProfile ELSE mRel.compoundForm.create.solubilityProfile END,
    bioavailabilityNotes: CASE WHEN mRel.compoundForm.create.bioavailabilityNotes IS NULL THEN cf.bioavailabilityNotes ELSE mRel.compoundForm.create.bioavailabilityNotes END,
    regulatoryStatusSummary: CASE WHEN mRel.compoundForm.create.regulatoryStatusSummary IS NULL THEN cf.regulatoryStatusSummary ELSE mRel.compoundForm.create.regulatoryStatusSummary END
  }

  MERGE (o)-[r:MANUFACTURES]->(cf)
  ON CREATE SET r.createdAt = datetime()

  SET r += {
    claimIds: CASE
      WHEN mRel.claimIds IS NULL THEN r.claimIds
      ELSE apoc.coll.toSet(coalesce(r.claimIds, []) + coalesce(mRel.claimIds, []))
    END,
    createdAt: CASE WHEN mRel.createdAt IS NULL THEN r.createdAt ELSE mRel.createdAt END,
    validAt: CASE WHEN mRel.validAt IS NULL THEN r.validAt ELSE mRel.validAt END,
    invalidAt: CASE WHEN mRel.invalidAt IS NULL THEN r.invalidAt ELSE mRel.invalidAt END,
    expiredAt: CASE WHEN mRel.expiredAt IS NULL THEN r.expiredAt ELSE mRel.expiredAt END
  }

  RETURN 1 AS ok

  UNION

  // ---- CONNECT branch (HARD FAIL if missing) ----
  WITH o, mRel  
  WITH o, mRel  
  WHERE mRel.compoundForm.connect IS NOT NULL

  OPTIONAL MATCH (cf:CompoundForm {compoundFormId: mRel.compoundForm.connect.compoundFormId})
  WITH o, mRel, cf

  CALL apoc.util.validate(
    cf IS NULL,
    'MANUFACTURES connect failed: CompoundForm not found for compoundFormId %s',
    [mRel.compoundForm.connect.compoundFormId]
  )

  MERGE (o)-[r:MANUFACTURES]->(cf)
  ON CREATE SET r.createdAt = datetime()

  SET r += {
    claimIds: CASE
      WHEN mRel.claimIds IS NULL THEN r.claimIds
      ELSE apoc.coll.toSet(coalesce(r.claimIds, []) + coalesce(mRel.claimIds, []))
    END,
    createdAt: CASE WHEN mRel.createdAt IS NULL THEN r.createdAt ELSE mRel.createdAt END,
    validAt: CASE WHEN mRel.validAt IS NULL THEN r.validAt ELSE mRel.validAt END,
    invalidAt: CASE WHEN mRel.invalidAt IS NULL THEN r.invalidAt ELSE mRel.invalidAt END,
    expiredAt: CASE WHEN mRel.expiredAt IS NULL THEN r.expiredAt ELSE mRel.expiredAt END
  }

  RETURN 1 AS ok
}

RETURN 1 AS ok
`;

export const organizationManufacturesProductCypher = `
// ==================================================================
// MANUFACTURES_PRODUCT (create OR connect) (CONNECT = HARD FAIL if missing)
// ==================================================================
MATCH (o:Organization {organizationId: $organizationId})

UNWIND coalesce($manufacturesProduct, []) AS mpRel
CALL {
  // ---- CREATE branch ----
  WITH o, mpRel  
  WITH o, mpRel  
  WHERE mpRel.product.create IS NOT NULL

  MERGE (p:Product {
    productId: coalesce(mpRel.product.create.productId, randomUUID())
  })
  ON CREATE SET p.createdAt = datetime()

  SET p += {
    name: CASE WHEN mpRel.product.create.name IS NULL THEN p.name ELSE mpRel.product.create.name END,
    synonyms: CASE WHEN mpRel.product.create.synonyms IS NULL THEN p.synonyms ELSE mpRel.product.create.synonyms END,
    productDomain: CASE WHEN mpRel.product.create.productDomain IS NULL THEN p.productDomain ELSE mpRel.product.create.productDomain END,
    productType: CASE WHEN mpRel.product.create.productType IS NULL THEN p.productType ELSE mpRel.product.create.productType END,
    intendedUse: CASE WHEN mpRel.product.create.intendedUse IS NULL THEN p.intendedUse ELSE mpRel.product.create.intendedUse END,
    description: CASE WHEN mpRel.product.create.description IS NULL THEN p.description ELSE mpRel.product.create.description END,
    brandName: CASE WHEN mpRel.product.create.brandName IS NULL THEN p.brandName ELSE mpRel.product.create.brandName END,
    modelNumber: CASE WHEN mpRel.product.create.modelNumber IS NULL THEN p.modelNumber ELSE mpRel.product.create.modelNumber END,
    ndcCode: CASE WHEN mpRel.product.create.ndcCode IS NULL THEN p.ndcCode ELSE mpRel.product.create.ndcCode END,
    upc: CASE WHEN mpRel.product.create.upc IS NULL THEN p.upc ELSE mpRel.product.create.upc END,
    gtin: CASE WHEN mpRel.product.create.gtin IS NULL THEN p.gtin ELSE mpRel.product.create.gtin END,
    riskClass: CASE WHEN mpRel.product.create.riskClass IS NULL THEN p.riskClass ELSE mpRel.product.create.riskClass END,
    currency: CASE WHEN mpRel.product.create.currency IS NULL THEN p.currency ELSE mpRel.product.create.currency END,
    priceAmount: CASE WHEN mpRel.product.create.priceAmount IS NULL THEN p.priceAmount ELSE mpRel.product.create.priceAmount END
  }

  MERGE (o)-[r:MANUFACTURES_PRODUCT]->(p)
  ON CREATE SET r.createdAt = datetime()

  SET r += {
    claimIds: CASE
      WHEN mpRel.claimIds IS NULL THEN r.claimIds
      ELSE apoc.coll.toSet(coalesce(r.claimIds, []) + coalesce(mpRel.claimIds, []))
    END,
    createdAt: CASE WHEN mpRel.createdAt IS NULL THEN r.createdAt ELSE mpRel.createdAt END,
    validAt: CASE WHEN mpRel.validAt IS NULL THEN r.validAt ELSE mpRel.validAt END,
    invalidAt: CASE WHEN mpRel.invalidAt IS NULL THEN r.invalidAt ELSE mpRel.invalidAt END,
    expiredAt: CASE WHEN mpRel.expiredAt IS NULL THEN r.expiredAt ELSE mpRel.expiredAt END
  }

  RETURN 1 AS ok

  UNION

  // ---- CONNECT branch (HARD FAIL if missing) ----
  WITH o, mpRel  
  WITH o, mpRel  
  WHERE mpRel.product.connect IS NOT NULL

  OPTIONAL MATCH (p:Product {productId: mpRel.product.connect.productId})
  WITH o, mpRel, p

  CALL apoc.util.validate(
    p IS NULL,
    'MANUFACTURES_PRODUCT connect failed: Product not found for productId %s',
    [mpRel.product.connect.productId]
  )

  MERGE (o)-[r:MANUFACTURES_PRODUCT]->(p)
  ON CREATE SET r.createdAt = datetime()

  SET r += {
    claimIds: CASE
      WHEN mpRel.claimIds IS NULL THEN r.claimIds
      ELSE apoc.coll.toSet(coalesce(r.claimIds, []) + coalesce(mpRel.claimIds, []))
    END,
    createdAt: CASE WHEN mpRel.createdAt IS NULL THEN r.createdAt ELSE mpRel.createdAt END,
    validAt: CASE WHEN mpRel.validAt IS NULL THEN r.validAt ELSE mpRel.validAt END,
    invalidAt: CASE WHEN mpRel.invalidAt IS NULL THEN r.invalidAt ELSE mpRel.invalidAt END,
    expiredAt: CASE WHEN mpRel.expiredAt IS NULL THEN r.expiredAt ELSE mpRel.expiredAt END
  }

  RETURN 1 AS ok
}

RETURN 1 AS ok
`;

export const updateOrganizationManufacturesCompoundFormCypher = `
  MATCH (o:Organization {organizationId: $organizationId})
  UNWIND $manufactures AS rel
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
  
    MERGE (o)-[r:MANUFACTURES]->(cf)
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
  
    RETURN 1 AS okM
  
    UNION
  
    // ---------------- CONNECT (strict) ----------------
    WITH o, rel
    WITH o, rel WHERE rel.compoundForm.connect IS NOT NULL
  
    OPTIONAL MATCH (cf2:CompoundForm {compoundFormId: rel.compoundForm.connect.compoundFormId})
    CALL apoc.util.validate(
      cf2 IS NULL,
      'MANUFACTURES connect failed: CompoundForm not found for compoundFormId %s',
      [rel.compoundForm.connect.compoundFormId]
    )
  
    MERGE (o)-[r2:MANUFACTURES]->(cf2)
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
  
    RETURN 1 AS okM
  
    UNION
  
    // ---------------- UPDATE (strict: rel must already exist) ----------------
    WITH o, rel
    WITH o, rel WHERE rel.compoundForm.update IS NOT NULL
  
    CALL apoc.util.validate(
      rel.compoundForm.update.compoundFormId IS NULL,
      'MANUFACTURES update failed: compoundForm.update.compoundFormId is required',
      []
    )
  
    OPTIONAL MATCH (cf3:CompoundForm {compoundFormId: rel.compoundForm.update.compoundFormId})
    OPTIONAL MATCH (o)-[r3:MANUFACTURES]->(cf3)
  
    CALL apoc.util.validate(
      cf3 IS NULL,
      'MANUFACTURES update failed: CompoundForm not found for compoundFormId %s',
      [rel.compoundForm.update.compoundFormId]
    )
    CALL apoc.util.validate(
      r3 IS NULL,
      'MANUFACTURES update failed: relationship not found for org %s -> compoundForm %s',
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
      claimIds: CASE
        WHEN rel.claimIds IS NULL THEN r3.claimIds
        ELSE apoc.coll.toSet(coalesce(r3.claimIds, []) + coalesce(rel.claimIds, []))
      END,
      createdAt: CASE WHEN rel.createdAt IS NULL THEN r3.createdAt ELSE rel.createdAt END,
      validAt: CASE WHEN rel.validAt IS NULL THEN r3.validAt ELSE rel.validAt END,
      invalidAt: CASE WHEN rel.invalidAt IS NULL THEN r3.invalidAt ELSE rel.invalidAt END,
      expiredAt: CASE WHEN rel.expiredAt IS NULL THEN r3.expiredAt ELSE rel.expiredAt END
    }
  
    RETURN 1 AS okM
  }
  RETURN count(*) AS _manufacturesProcessed
            `;

export const updateOrganizationManufacturesProductCypher = `
  MATCH (o:Organization {organizationId: $organizationId})
  UNWIND $manufacturesProduct AS rel
  CALL {
    // ---------------- CREATE ----------------
    WITH o, rel
    WITH o, rel WHERE rel.product.create IS NOT NULL
  
    MERGE (p:Product {productId: coalesce(rel.product.create.productId, randomUUID())})
    ON CREATE SET p.createdAt = datetime()
  
    SET p += {
      name: CASE WHEN rel.product.create.name IS NULL THEN p.name ELSE rel.product.create.name END,
      synonyms: CASE
        WHEN rel.product.create.synonyms IS NULL THEN p.synonyms
        ELSE apoc.coll.toSet(coalesce(p.synonyms, []) + coalesce(rel.product.create.synonyms, []))
      END,
      productDomain: CASE WHEN rel.product.create.productDomain IS NULL THEN p.productDomain ELSE rel.product.create.productDomain END,
      productType: CASE WHEN rel.product.create.productType IS NULL THEN p.productType ELSE rel.product.create.productType END,
      intendedUse: CASE WHEN rel.product.create.intendedUse IS NULL THEN p.intendedUse ELSE rel.product.create.intendedUse END,
      description: CASE WHEN rel.product.create.description IS NULL THEN p.description ELSE rel.product.create.description END,
      brandName: CASE WHEN rel.product.create.brandName IS NULL THEN p.brandName ELSE rel.product.create.brandName END,
      modelNumber: CASE WHEN rel.product.create.modelNumber IS NULL THEN p.modelNumber ELSE rel.product.create.modelNumber END,
      ndcCode: CASE WHEN rel.product.create.ndcCode IS NULL THEN p.ndcCode ELSE rel.product.create.ndcCode END,
      upc: CASE WHEN rel.product.create.upc IS NULL THEN p.upc ELSE rel.product.create.upc END,
      gtin: CASE WHEN rel.product.create.gtin IS NULL THEN p.gtin ELSE rel.product.create.gtin END,
      riskClass: CASE WHEN rel.product.create.riskClass IS NULL THEN p.riskClass ELSE rel.product.create.riskClass END,
      currency: CASE WHEN rel.product.create.currency IS NULL THEN p.currency ELSE rel.product.create.currency END,
      priceAmount: CASE WHEN rel.product.create.priceAmount IS NULL THEN p.priceAmount ELSE rel.product.create.priceAmount END
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
  
    RETURN 1 AS okMP
  
    UNION
  
    // ---------------- CONNECT (strict) ----------------
    WITH o, rel
    WITH o, rel WHERE rel.product.connect IS NOT NULL
  
    OPTIONAL MATCH (p2:Product {productId: rel.product.connect.productId})
    CALL apoc.util.validate(
      p2 IS NULL,
      'MANUFACTURES_PRODUCT connect failed: Product not found for productId %s',
      [rel.product.connect.productId]
    )
  
    MERGE (o)-[r2:MANUFACTURES_PRODUCT]->(p2)
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
  
    RETURN 1 AS okMP
  
    UNION
  
    // ---------------- UPDATE (strict: rel must already exist) ----------------
    WITH o, rel
    WITH o, rel WHERE rel.product.update IS NOT NULL
  
    CALL apoc.util.validate(
      rel.product.update.productId IS NULL,
      'MANUFACTURES_PRODUCT update failed: product.update.productId is required',
      []
    )
  
    OPTIONAL MATCH (p3:Product {productId: rel.product.update.productId})
    OPTIONAL MATCH (o)-[r3:MANUFACTURES_PRODUCT]->(p3)
  
    CALL apoc.util.validate(
      p3 IS NULL,
      'MANUFACTURES_PRODUCT update failed: Product not found for productId %s',
      [rel.product.update.productId]
    )
    CALL apoc.util.validate(
      r3 IS NULL,
      'MANUFACTURES_PRODUCT update failed: relationship not found for org %s -> product %s',
      [$organizationId, rel.product.update.productId]
    )
  
    SET p3 += {
      name: CASE WHEN rel.product.update.name IS NULL THEN p3.name ELSE rel.product.update.name END,
      synonyms: CASE
        WHEN rel.product.update.synonyms IS NULL THEN p3.synonyms
        ELSE apoc.coll.toSet(coalesce(p3.synonyms, []) + coalesce(rel.product.update.synonyms, []))
      END,
      productDomain: CASE WHEN rel.product.update.productDomain IS NULL THEN p3.productDomain ELSE rel.product.update.productDomain END,
      productType: CASE WHEN rel.product.update.productType IS NULL THEN p3.productType ELSE rel.product.update.productType END,
      intendedUse: CASE WHEN rel.product.update.intendedUse IS NULL THEN p3.intendedUse ELSE rel.product.update.intendedUse END,
      description: CASE WHEN rel.product.update.description IS NULL THEN p3.description ELSE rel.product.update.description END,
      brandName: CASE WHEN rel.product.update.brandName IS NULL THEN p3.brandName ELSE rel.product.update.brandName END,
      modelNumber: CASE WHEN rel.product.update.modelNumber IS NULL THEN p3.modelNumber ELSE rel.product.update.modelNumber END,
      ndcCode: CASE WHEN rel.product.update.ndcCode IS NULL THEN p3.ndcCode ELSE rel.product.update.ndcCode END,
      upc: CASE WHEN rel.product.update.upc IS NULL THEN p3.upc ELSE rel.product.update.upc END,
      gtin: CASE WHEN rel.product.update.gtin IS NULL THEN p3.gtin ELSE rel.product.update.gtin END,
      riskClass: CASE WHEN rel.product.update.riskClass IS NULL THEN p3.riskClass ELSE rel.product.update.riskClass END,
      currency: CASE WHEN rel.product.update.currency IS NULL THEN p3.currency ELSE rel.product.update.currency END,
      priceAmount: CASE WHEN rel.product.update.priceAmount IS NULL THEN p3.priceAmount ELSE rel.product.update.priceAmount END
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
  
    RETURN 1 AS okMP
  }
  RETURN count(*) AS _manufacturesProductProcessed
            `;

export const organizationPerformsManufacturingProcessCypher = `
// ==================================================================
// PERFORMS_MANUFACTURING_PROCESS (create OR connect)
// (CONNECT = HARD FAIL if missing)
// ==================================================================
MATCH (o:Organization {organizationId: $organizationId})

UNWIND coalesce($performsManufacturingProcess, []) AS pmpRel
CALL {
  // ---- CREATE branch ----
  WITH o, pmpRel  
  WITH o, pmpRel  
  WHERE pmpRel.manufacturingProcess.create IS NOT NULL

  MERGE (mp:ManufacturingProcess {
    manufacturingProcessId: coalesce(pmpRel.manufacturingProcess.create.manufacturingProcessId, randomUUID())
  })
  ON CREATE SET mp.createdAt = datetime()

  SET mp += {
    canonicalName: CASE WHEN pmpRel.manufacturingProcess.create.canonicalName IS NULL THEN mp.canonicalName ELSE pmpRel.manufacturingProcess.create.canonicalName END,
    processType: CASE WHEN pmpRel.manufacturingProcess.create.processType IS NULL THEN mp.processType ELSE pmpRel.manufacturingProcess.create.processType END,
    description: CASE WHEN pmpRel.manufacturingProcess.create.description IS NULL THEN mp.description ELSE pmpRel.manufacturingProcess.create.description END,
    inputs: CASE
      WHEN pmpRel.manufacturingProcess.create.inputs IS NULL THEN mp.inputs
      ELSE apoc.coll.toSet(coalesce(mp.inputs, []) + coalesce(pmpRel.manufacturingProcess.create.inputs, []))
    END,
    outputs: CASE
      WHEN pmpRel.manufacturingProcess.create.outputs IS NULL THEN mp.outputs
      ELSE apoc.coll.toSet(coalesce(mp.outputs, []) + coalesce(pmpRel.manufacturingProcess.create.outputs, []))
    END,
    qualityRisks: CASE
      WHEN pmpRel.manufacturingProcess.create.qualityRisks IS NULL THEN mp.qualityRisks
      ELSE apoc.coll.toSet(coalesce(mp.qualityRisks, []) + coalesce(pmpRel.manufacturingProcess.create.qualityRisks, []))
    END,
    scalabilityLevel: CASE WHEN pmpRel.manufacturingProcess.create.scalabilityLevel IS NULL THEN mp.scalabilityLevel ELSE pmpRel.manufacturingProcess.create.scalabilityLevel END
  }

  MERGE (o)-[r:PERFORMS_MANUFACTURING_PROCESS]->(mp)
  ON CREATE SET r.createdAt = datetime()

  SET r += {
    role: CASE WHEN pmpRel.role IS NULL THEN r.role ELSE pmpRel.role END,
    claimIds: CASE
      WHEN pmpRel.claimIds IS NULL THEN r.claimIds
      ELSE apoc.coll.toSet(coalesce(r.claimIds, []) + coalesce(pmpRel.claimIds, []))
    END,
    createdAt: CASE WHEN pmpRel.createdAt IS NULL THEN r.createdAt ELSE pmpRel.createdAt END,
    validAt: CASE WHEN pmpRel.validAt IS NULL THEN r.validAt ELSE pmpRel.validAt END,
    invalidAt: CASE WHEN pmpRel.invalidAt IS NULL THEN r.invalidAt ELSE pmpRel.invalidAt END,
    expiredAt: CASE WHEN pmpRel.expiredAt IS NULL THEN r.expiredAt ELSE pmpRel.expiredAt END
  }

  RETURN 1 AS ok

  UNION

  // ---- CONNECT branch (HARD FAIL if missing) ----
  WITH o, pmpRel  
  WITH o, pmpRel  
  WHERE pmpRel.manufacturingProcess.connect IS NOT NULL

  OPTIONAL MATCH (mp:ManufacturingProcess {manufacturingProcessId: pmpRel.manufacturingProcess.connect.manufacturingProcessId})
  WITH o, pmpRel, mp

  CALL apoc.util.validate(
    mp IS NULL,
    'PERFORMS_MANUFACTURING_PROCESS connect failed: ManufacturingProcess not found for manufacturingProcessId %s',
    [pmpRel.manufacturingProcess.connect.manufacturingProcessId]
  )

  MERGE (o)-[r:PERFORMS_MANUFACTURING_PROCESS]->(mp)
  ON CREATE SET r.createdAt = datetime()

  SET r += {
    role: CASE WHEN pmpRel.role IS NULL THEN r.role ELSE pmpRel.role END,
    claimIds: CASE
      WHEN pmpRel.claimIds IS NULL THEN r.claimIds
      ELSE apoc.coll.toSet(coalesce(r.claimIds, []) + coalesce(pmpRel.claimIds, []))
    END,
    createdAt: CASE WHEN pmpRel.createdAt IS NULL THEN r.createdAt ELSE pmpRel.createdAt END,
    validAt: CASE WHEN pmpRel.validAt IS NULL THEN r.validAt ELSE pmpRel.validAt END,
    invalidAt: CASE WHEN pmpRel.invalidAt IS NULL THEN r.invalidAt ELSE pmpRel.invalidAt END,
    expiredAt: CASE WHEN pmpRel.expiredAt IS NULL THEN r.expiredAt ELSE pmpRel.expiredAt END
  }

  RETURN 1 AS ok
}

RETURN 1 AS ok
`;

export const updateOrganizationPerformsManufacturingProcessCypher = `
  MATCH (o:Organization {organizationId: $organizationId})
  UNWIND $performsManufacturingProcess AS rel
  CALL {
    // ---------------- CREATE ----------------
    WITH o, rel
    WITH o, rel WHERE rel.manufacturingProcess.create IS NOT NULL
  
    MERGE (mp:ManufacturingProcess {manufacturingProcessId: coalesce(rel.manufacturingProcess.create.manufacturingProcessId, randomUUID())})
    ON CREATE SET mp.createdAt = datetime()
  
    SET mp += {
      canonicalName: CASE WHEN rel.manufacturingProcess.create.canonicalName IS NULL THEN mp.canonicalName ELSE rel.manufacturingProcess.create.canonicalName END,
      processType: CASE WHEN rel.manufacturingProcess.create.processType IS NULL THEN mp.processType ELSE rel.manufacturingProcess.create.processType END,
      description: CASE WHEN rel.manufacturingProcess.create.description IS NULL THEN mp.description ELSE rel.manufacturingProcess.create.description END,
      inputs: CASE
        WHEN rel.manufacturingProcess.create.inputs IS NULL THEN mp.inputs
        ELSE apoc.coll.toSet(coalesce(mp.inputs, []) + coalesce(rel.manufacturingProcess.create.inputs, []))
      END,
      outputs: CASE
        WHEN rel.manufacturingProcess.create.outputs IS NULL THEN mp.outputs
        ELSE apoc.coll.toSet(coalesce(mp.outputs, []) + coalesce(rel.manufacturingProcess.create.outputs, []))
      END,
      qualityRisks: CASE
        WHEN rel.manufacturingProcess.create.qualityRisks IS NULL THEN mp.qualityRisks
        ELSE apoc.coll.toSet(coalesce(mp.qualityRisks, []) + coalesce(rel.manufacturingProcess.create.qualityRisks, []))
      END,
      scalabilityLevel: CASE WHEN rel.manufacturingProcess.create.scalabilityLevel IS NULL THEN mp.scalabilityLevel ELSE rel.manufacturingProcess.create.scalabilityLevel END
    }
  
    MERGE (o)-[r:PERFORMS_MANUFACTURING_PROCESS]->(mp)
    ON CREATE SET r.createdAt = datetime()
  
    SET r += {
      role: CASE WHEN rel.role IS NULL THEN r.role ELSE rel.role END,
      claimIds: CASE
        WHEN rel.claimIds IS NULL THEN r.claimIds
        ELSE apoc.coll.toSet(coalesce(r.claimIds, []) + coalesce(rel.claimIds, []))
      END,
      createdAt: CASE WHEN rel.createdAt IS NULL THEN r.createdAt ELSE rel.createdAt END,
      validAt: CASE WHEN rel.validAt IS NULL THEN r.validAt ELSE rel.validAt END,
      invalidAt: CASE WHEN rel.invalidAt IS NULL THEN r.invalidAt ELSE rel.invalidAt END,
      expiredAt: CASE WHEN rel.expiredAt IS NULL THEN r.expiredAt ELSE rel.expiredAt END
    }
  
    RETURN 1 AS okPMP
  
    UNION
  
    // ---------------- CONNECT (strict) ----------------
    WITH o, rel
    WITH o, rel WHERE rel.manufacturingProcess.connect IS NOT NULL
  
    OPTIONAL MATCH (mp2:ManufacturingProcess {manufacturingProcessId: rel.manufacturingProcess.connect.manufacturingProcessId})
    CALL apoc.util.validate(
      mp2 IS NULL,
      'PERFORMS_MANUFACTURING_PROCESS connect failed: ManufacturingProcess not found for manufacturingProcessId %s',
      [rel.manufacturingProcess.connect.manufacturingProcessId]
    )
  
    MERGE (o)-[r2:PERFORMS_MANUFACTURING_PROCESS]->(mp2)
    ON CREATE SET r2.createdAt = datetime()
  
    SET r2 += {
      role: CASE WHEN rel.role IS NULL THEN r2.role ELSE rel.role END,
      claimIds: CASE
        WHEN rel.claimIds IS NULL THEN r2.claimIds
        ELSE apoc.coll.toSet(coalesce(r2.claimIds, []) + coalesce(rel.claimIds, []))
      END,
      createdAt: CASE WHEN rel.createdAt IS NULL THEN r2.createdAt ELSE rel.createdAt END,
      validAt: CASE WHEN rel.validAt IS NULL THEN r2.validAt ELSE rel.validAt END,
      invalidAt: CASE WHEN rel.invalidAt IS NULL THEN r2.invalidAt ELSE rel.invalidAt END,
      expiredAt: CASE WHEN rel.expiredAt IS NULL THEN r2.expiredAt ELSE rel.expiredAt END
    }
  
    RETURN 1 AS okPMP
  
    UNION
  
    // ---------------- UPDATE (strict: rel must already exist) ----------------
    WITH o, rel
    WITH o, rel WHERE rel.manufacturingProcess.update IS NOT NULL
  
    CALL apoc.util.validate(
      rel.manufacturingProcess.update.manufacturingProcessId IS NULL,
      'PERFORMS_MANUFACTURING_PROCESS update failed: manufacturingProcess.update.manufacturingProcessId is required',
      []
    )
  
    OPTIONAL MATCH (mp3:ManufacturingProcess {manufacturingProcessId: rel.manufacturingProcess.update.manufacturingProcessId})
    OPTIONAL MATCH (o)-[r3:PERFORMS_MANUFACTURING_PROCESS]->(mp3)
  
    CALL apoc.util.validate(
      mp3 IS NULL,
      'PERFORMS_MANUFACTURING_PROCESS update failed: ManufacturingProcess not found for manufacturingProcessId %s',
      [rel.manufacturingProcess.update.manufacturingProcessId]
    )
    CALL apoc.util.validate(
      r3 IS NULL,
      'PERFORMS_MANUFACTURING_PROCESS update failed: relationship not found for org %s -> manufacturingProcess %s',
      [$organizationId, rel.manufacturingProcess.update.manufacturingProcessId]
    )
  
    SET mp3 += {
      canonicalName: CASE WHEN rel.manufacturingProcess.update.canonicalName IS NULL THEN mp3.canonicalName ELSE rel.manufacturingProcess.update.canonicalName END,
      processType: CASE WHEN rel.manufacturingProcess.update.processType IS NULL THEN mp3.processType ELSE rel.manufacturingProcess.update.processType END,
      description: CASE WHEN rel.manufacturingProcess.update.description IS NULL THEN mp3.description ELSE rel.manufacturingProcess.update.description END,
      inputs: CASE
        WHEN rel.manufacturingProcess.update.inputs IS NULL THEN mp3.inputs
        ELSE apoc.coll.toSet(coalesce(mp3.inputs, []) + coalesce(rel.manufacturingProcess.update.inputs, []))
      END,
      outputs: CASE
        WHEN rel.manufacturingProcess.update.outputs IS NULL THEN mp3.outputs
        ELSE apoc.coll.toSet(coalesce(mp3.outputs, []) + coalesce(rel.manufacturingProcess.update.outputs, []))
      END,
      qualityRisks: CASE
        WHEN rel.manufacturingProcess.update.qualityRisks IS NULL THEN mp3.qualityRisks
        ELSE apoc.coll.toSet(coalesce(mp3.qualityRisks, []) + coalesce(rel.manufacturingProcess.update.qualityRisks, []))
      END,
      scalabilityLevel: CASE WHEN rel.manufacturingProcess.update.scalabilityLevel IS NULL THEN mp3.scalabilityLevel ELSE rel.manufacturingProcess.update.scalabilityLevel END
    }
  
    SET r3 += {
      role: CASE WHEN rel.role IS NULL THEN r3.role ELSE rel.role END,
      claimIds: CASE
        WHEN rel.claimIds IS NULL THEN r3.claimIds
        ELSE apoc.coll.toSet(coalesce(r3.claimIds, []) + coalesce(rel.claimIds, []))
      END,
      createdAt: CASE WHEN rel.createdAt IS NULL THEN r3.createdAt ELSE rel.createdAt END,
      validAt: CASE WHEN rel.validAt IS NULL THEN r3.validAt ELSE rel.validAt END,
      invalidAt: CASE WHEN rel.invalidAt IS NULL THEN r3.invalidAt ELSE rel.invalidAt END,
      expiredAt: CASE WHEN rel.expiredAt IS NULL THEN r3.expiredAt ELSE rel.expiredAt END
    }
  
    RETURN 1 AS okPMP
  }
  RETURN count(*) AS _performsManufacturingProcessProcessed
            `;
