export const organizationContractManufacturerForOrganizationCypher = `
// ==================================================================
// CONTRACT_MANUFACTURER_FOR_ORGANIZATION (create OR connect)
// (CONNECT = HARD FAIL if missing)
// ==================================================================
MATCH (o:Organization {organizationId: $organizationId})

UNWIND coalesce($contractManufacturerForOrganization, []) AS cmRel
CALL {
  // ---- CREATE branch ----
  WITH o, cmRel  
  WITH o, cmRel  
  WHERE cmRel.organization.create IS NOT NULL

  MERGE (org2:Organization {
    organizationId: coalesce(cmRel.organization.create.organizationId, randomUUID())
  })
  ON CREATE SET org2.createdAt = datetime()

  SET org2 += {
    name: CASE WHEN cmRel.organization.create.name IS NULL THEN org2.name ELSE cmRel.organization.create.name END,

    aliases: CASE
      WHEN cmRel.organization.create.aliases IS NULL THEN org2.aliases
      ELSE apoc.coll.toSet(coalesce(org2.aliases, []) + coalesce(cmRel.organization.create.aliases, []))
    END,

    orgType: CASE WHEN cmRel.organization.create.orgType IS NULL THEN org2.orgType ELSE cmRel.organization.create.orgType END,
    description: CASE WHEN cmRel.organization.create.description IS NULL THEN org2.description ELSE cmRel.organization.create.description END,
    businessModel: CASE WHEN cmRel.organization.create.businessModel IS NULL THEN org2.businessModel ELSE cmRel.organization.create.businessModel END,

    primaryIndustryTags: CASE
      WHEN cmRel.organization.create.primaryIndustryTags IS NULL THEN org2.primaryIndustryTags
      ELSE apoc.coll.toSet(coalesce(org2.primaryIndustryTags, []) + coalesce(cmRel.organization.create.primaryIndustryTags, []))
    END,
    regionsServed: CASE
      WHEN cmRel.organization.create.regionsServed IS NULL THEN org2.regionsServed
      ELSE apoc.coll.toSet(coalesce(org2.regionsServed, []) + coalesce(cmRel.organization.create.regionsServed, []))
    END,

    legalName: CASE WHEN cmRel.organization.create.legalName IS NULL THEN org2.legalName ELSE cmRel.organization.create.legalName END,
    legalStructure: CASE WHEN cmRel.organization.create.legalStructure IS NULL THEN org2.legalStructure ELSE cmRel.organization.create.legalStructure END,
    ownershipType: CASE WHEN cmRel.organization.create.ownershipType IS NULL THEN org2.ownershipType ELSE cmRel.organization.create.ownershipType END,

    jurisdictionsOfIncorporation: CASE
      WHEN cmRel.organization.create.jurisdictionsOfIncorporation IS NULL THEN org2.jurisdictionsOfIncorporation
      ELSE apoc.coll.toSet(coalesce(org2.jurisdictionsOfIncorporation, []) + coalesce(cmRel.organization.create.jurisdictionsOfIncorporation, []))
    END,

    websiteUrl: CASE WHEN cmRel.organization.create.websiteUrl IS NULL THEN org2.websiteUrl ELSE cmRel.organization.create.websiteUrl END,

    defaultCollectionModes: CASE
      WHEN cmRel.organization.create.defaultCollectionModes IS NULL THEN org2.defaultCollectionModes
      ELSE apoc.coll.toSet(coalesce(org2.defaultCollectionModes, []) + coalesce(cmRel.organization.create.defaultCollectionModes, []))
    END,

    defaultRegionsAvailable: CASE
      WHEN cmRel.organization.create.defaultRegionsAvailable IS NULL THEN org2.defaultRegionsAvailable
      ELSE apoc.coll.toSet(coalesce(org2.defaultRegionsAvailable, []) + coalesce(cmRel.organization.create.defaultRegionsAvailable, []))
    END,

    publicTicker: CASE WHEN cmRel.organization.create.publicTicker IS NULL THEN org2.publicTicker ELSE cmRel.organization.create.publicTicker END,
    fundingStage: CASE WHEN cmRel.organization.create.fundingStage IS NULL THEN org2.fundingStage ELSE cmRel.organization.create.fundingStage END,
    employeeCountMin: CASE WHEN cmRel.organization.create.employeeCountMin IS NULL THEN org2.employeeCountMin ELSE cmRel.organization.create.employeeCountMin END,
    employeeCountMax: CASE WHEN cmRel.organization.create.employeeCountMax IS NULL THEN org2.employeeCountMax ELSE cmRel.organization.create.employeeCountMax END,
    employeeCountAsOf: CASE WHEN cmRel.organization.create.employeeCountAsOf IS NULL THEN org2.employeeCountAsOf ELSE cmRel.organization.create.employeeCountAsOf END,
    revenueAnnualMin: CASE WHEN cmRel.organization.create.revenueAnnualMin IS NULL THEN org2.revenueAnnualMin ELSE cmRel.organization.create.revenueAnnualMin END,
    revenueAnnualMax: CASE WHEN cmRel.organization.create.revenueAnnualMax IS NULL THEN org2.revenueAnnualMax ELSE cmRel.organization.create.revenueAnnualMax END,
    revenueAnnualCurrency: CASE WHEN cmRel.organization.create.revenueAnnualCurrency IS NULL THEN org2.revenueAnnualCurrency ELSE cmRel.organization.create.revenueAnnualCurrency END,
    revenueAnnualAsOf: CASE WHEN cmRel.organization.create.revenueAnnualAsOf IS NULL THEN org2.revenueAnnualAsOf ELSE cmRel.organization.create.revenueAnnualAsOf END,
    valuationMin: CASE WHEN cmRel.organization.create.valuationMin IS NULL THEN org2.valuationMin ELSE cmRel.organization.create.valuationMin END,
    valuationMax: CASE WHEN cmRel.organization.create.valuationMax IS NULL THEN org2.valuationMax ELSE cmRel.organization.create.valuationMax END,
    valuationCurrency: CASE WHEN cmRel.organization.create.valuationCurrency IS NULL THEN org2.valuationCurrency ELSE cmRel.organization.create.valuationCurrency END,
    valuationAsOf: CASE WHEN cmRel.organization.create.valuationAsOf IS NULL THEN org2.valuationAsOf ELSE cmRel.organization.create.valuationAsOf END
  }

  MERGE (o)-[r:CONTRACT_MANUFACTURER_FOR_ORGANIZATION]->(org2)
  ON CREATE SET r.createdAt = datetime()

  SET r += {
    claimIds: CASE
      WHEN cmRel.claimIds IS NULL THEN r.claimIds
      ELSE apoc.coll.toSet(coalesce(r.claimIds, []) + coalesce(cmRel.claimIds, []))
    END,
    createdAt: CASE WHEN cmRel.createdAt IS NULL THEN r.createdAt ELSE cmRel.createdAt END,
    validAt: CASE WHEN cmRel.validAt IS NULL THEN r.validAt ELSE cmRel.validAt END,
    invalidAt: CASE WHEN cmRel.invalidAt IS NULL THEN r.invalidAt ELSE cmRel.invalidAt END,
    expiredAt: CASE WHEN cmRel.expiredAt IS NULL THEN r.expiredAt ELSE cmRel.expiredAt END
  }

  RETURN 1 AS ok

  UNION

  // ---- CONNECT branch (HARD FAIL if missing) ----
  WITH o, cmRel 
  WITH o, cmRel 
  WHERE cmRel.organization.connect IS NOT NULL

  OPTIONAL MATCH (org2:Organization {organizationId: cmRel.organization.connect.organizationId})
  WITH o, cmRel, org2

  CALL apoc.util.validate(
    org2 IS NULL,
    'CONTRACT_MANUFACTURER_FOR_ORGANIZATION connect failed: Organization not found for organizationId %s',
    [cmRel.organization.connect.organizationId]
  )

  MERGE (o)-[r:CONTRACT_MANUFACTURER_FOR_ORGANIZATION]->(org2)
  ON CREATE SET r.createdAt = datetime()

  SET r += {
    claimIds: CASE
      WHEN cmRel.claimIds IS NULL THEN r.claimIds
      ELSE apoc.coll.toSet(coalesce(r.claimIds, []) + coalesce(cmRel.claimIds, []))
    END,
    createdAt: CASE WHEN cmRel.createdAt IS NULL THEN r.createdAt ELSE cmRel.createdAt END,
    validAt: CASE WHEN cmRel.validAt IS NULL THEN r.validAt ELSE cmRel.validAt END,
    invalidAt: CASE WHEN cmRel.invalidAt IS NULL THEN r.invalidAt ELSE cmRel.invalidAt END,
    expiredAt: CASE WHEN cmRel.expiredAt IS NULL THEN r.expiredAt ELSE cmRel.expiredAt END
  }

  RETURN 1 AS ok
}

RETURN 1 AS ok
`;

export const organizationContractManufacturerForProductCypher = `
// ==================================================================
// CONTRACT_MANUFACTURER_FOR_PRODUCT (create OR connect)
// (CONNECT = HARD FAIL if missing)
// ==================================================================
MATCH (o:Organization {organizationId: $organizationId})

UNWIND coalesce($contractManufacturerForProduct, []) AS cmpRel
CALL {
  // ---- CREATE branch ----
  WITH o, cmpRel  
  WITH o, cmpRel  
  WHERE cmpRel.product.create IS NOT NULL

  MERGE (p:Product {
    productId: coalesce(cmpRel.product.create.productId, randomUUID())
  })
  ON CREATE SET p.createdAt = datetime()

  SET p += {
    name: CASE WHEN cmpRel.product.create.name IS NULL THEN p.name ELSE cmpRel.product.create.name END,
    synonyms: CASE
      WHEN cmpRel.product.create.synonyms IS NULL THEN p.synonyms
      ELSE apoc.coll.toSet(coalesce(p.synonyms, []) + coalesce(cmpRel.product.create.synonyms, []))
    END,
    productDomain: CASE WHEN cmpRel.product.create.productDomain IS NULL THEN p.productDomain ELSE cmpRel.product.create.productDomain END,
    productType: CASE WHEN cmpRel.product.create.productType IS NULL THEN p.productType ELSE cmpRel.product.create.productType END,
    intendedUse: CASE WHEN cmpRel.product.create.intendedUse IS NULL THEN p.intendedUse ELSE cmpRel.product.create.intendedUse END,
    description: CASE WHEN cmpRel.product.create.description IS NULL THEN p.description ELSE cmpRel.product.create.description END,
    brandName: CASE WHEN cmpRel.product.create.brandName IS NULL THEN p.brandName ELSE cmpRel.product.create.brandName END,
    modelNumber: CASE WHEN cmpRel.product.create.modelNumber IS NULL THEN p.modelNumber ELSE cmpRel.product.create.modelNumber END,
    ndcCode: CASE WHEN cmpRel.product.create.ndcCode IS NULL THEN p.ndcCode ELSE cmpRel.product.create.ndcCode END,
    upc: CASE WHEN cmpRel.product.create.upc IS NULL THEN p.upc ELSE cmpRel.product.create.upc END,
    gtin: CASE WHEN cmpRel.product.create.gtin IS NULL THEN p.gtin ELSE cmpRel.product.create.gtin END,
    riskClass: CASE WHEN cmpRel.product.create.riskClass IS NULL THEN p.riskClass ELSE cmpRel.product.create.riskClass END,
    currency: CASE WHEN cmpRel.product.create.currency IS NULL THEN p.currency ELSE cmpRel.product.create.currency END,
    priceAmount: CASE WHEN cmpRel.product.create.priceAmount IS NULL THEN p.priceAmount ELSE cmpRel.product.create.priceAmount END
  }

  MERGE (o)-[r:CONTRACT_MANUFACTURER_FOR_PRODUCT]->(p)
  ON CREATE SET r.createdAt = datetime()

  SET r += {
    claimIds: CASE
      WHEN cmpRel.claimIds IS NULL THEN r.claimIds
      ELSE apoc.coll.toSet(coalesce(r.claimIds, []) + coalesce(cmpRel.claimIds, []))
    END,
    createdAt: CASE WHEN cmpRel.createdAt IS NULL THEN r.createdAt ELSE cmpRel.createdAt END,
    validAt: CASE WHEN cmpRel.validAt IS NULL THEN r.validAt ELSE cmpRel.validAt END,
    invalidAt: CASE WHEN cmpRel.invalidAt IS NULL THEN r.invalidAt ELSE cmpRel.invalidAt END,
    expiredAt: CASE WHEN cmpRel.expiredAt IS NULL THEN r.expiredAt ELSE cmpRel.expiredAt END
  }

  RETURN 1 AS ok

  UNION

  // ---- CONNECT branch (HARD FAIL if missing) ----
  WITH o, cmpRel  
  WITH o, cmpRel  
  WHERE cmpRel.product.connect IS NOT NULL

  OPTIONAL MATCH (p:Product {productId: cmpRel.product.connect.productId})
  WITH o, cmpRel, p

  CALL apoc.util.validate(
    p IS NULL,
    'CONTRACT_MANUFACTURER_FOR_PRODUCT connect failed: Product not found for productId %s',
    [cmpRel.product.connect.productId]
  )

  MERGE (o)-[r:CONTRACT_MANUFACTURER_FOR_PRODUCT]->(p)
  ON CREATE SET r.createdAt = datetime()

  SET r += {
    claimIds: CASE
      WHEN cmpRel.claimIds IS NULL THEN r.claimIds
      ELSE apoc.coll.toSet(coalesce(r.claimIds, []) + coalesce(cmpRel.claimIds, []))
    END,
    createdAt: CASE WHEN cmpRel.createdAt IS NULL THEN r.createdAt ELSE cmpRel.createdAt END,
    validAt: CASE WHEN cmpRel.validAt IS NULL THEN r.validAt ELSE cmpRel.validAt END,
    invalidAt: CASE WHEN cmpRel.invalidAt IS NULL THEN r.invalidAt ELSE cmpRel.invalidAt END,
    expiredAt: CASE WHEN cmpRel.expiredAt IS NULL THEN r.expiredAt ELSE cmpRel.expiredAt END
  }

  RETURN 1 AS ok
}

RETURN 1 AS ok
`;

export const organizationContractManufacturerForCompoundFormCypher = `
// ==================================================================
// CONTRACT_MANUFACTURER_FOR_COMPOUND_FORM (create OR connect)
// (CONNECT = HARD FAIL if missing)
// ==================================================================
MATCH (o:Organization {organizationId: $organizationId})

UNWIND coalesce($contractManufacturerForCompoundForm, []) AS cmcfRel
CALL {
  // ---- CREATE branch ----
  WITH o, cmcfRel  
  WITH o, cmcfRel  
  WHERE cmcfRel.compoundForm.create IS NOT NULL

  MERGE (cf:CompoundForm {
    compoundFormId: coalesce(cmcfRel.compoundForm.create.compoundFormId, randomUUID())
  })
  ON CREATE SET cf.createdAt = datetime()

  SET cf += {
    canonicalName: CASE WHEN cmcfRel.compoundForm.create.canonicalName IS NULL THEN cf.canonicalName ELSE cmcfRel.compoundForm.create.canonicalName END,
    formType: CASE WHEN cmcfRel.compoundForm.create.formType IS NULL THEN cf.formType ELSE cmcfRel.compoundForm.create.formType END,
    chemicalDifferences: CASE WHEN cmcfRel.compoundForm.create.chemicalDifferences IS NULL THEN cf.chemicalDifferences ELSE cmcfRel.compoundForm.create.chemicalDifferences END,
    stabilityProfile: CASE WHEN cmcfRel.compoundForm.create.stabilityProfile IS NULL THEN cf.stabilityProfile ELSE cmcfRel.compoundForm.create.stabilityProfile END,
    solubilityProfile: CASE WHEN cmcfRel.compoundForm.create.solubilityProfile IS NULL THEN cf.solubilityProfile ELSE cmcfRel.compoundForm.create.solubilityProfile END,
    bioavailabilityNotes: CASE WHEN cmcfRel.compoundForm.create.bioavailabilityNotes IS NULL THEN cf.bioavailabilityNotes ELSE cmcfRel.compoundForm.create.bioavailabilityNotes END,
    regulatoryStatusSummary: CASE WHEN cmcfRel.compoundForm.create.regulatoryStatusSummary IS NULL THEN cf.regulatoryStatusSummary ELSE cmcfRel.compoundForm.create.regulatoryStatusSummary END
  }

  MERGE (o)-[r:CONTRACT_MANUFACTURER_FOR_COMPOUND_FORM]->(cf)
  ON CREATE SET r.createdAt = datetime()

  SET r += {
    claimIds: CASE
      WHEN cmcfRel.claimIds IS NULL THEN r.claimIds
      ELSE apoc.coll.toSet(coalesce(r.claimIds, []) + coalesce(cmcfRel.claimIds, []))
    END,
    createdAt: CASE WHEN cmcfRel.createdAt IS NULL THEN r.createdAt ELSE cmcfRel.createdAt END,
    validAt: CASE WHEN cmcfRel.validAt IS NULL THEN r.validAt ELSE cmcfRel.validAt END,
    invalidAt: CASE WHEN cmcfRel.invalidAt IS NULL THEN r.invalidAt ELSE cmcfRel.invalidAt END,
    expiredAt: CASE WHEN cmcfRel.expiredAt IS NULL THEN r.expiredAt ELSE cmcfRel.expiredAt END
  }

  RETURN 1 AS ok

  UNION

  // ---- CONNECT branch (HARD FAIL if missing) ----
  WITH o, cmcfRel  
  WITH o, cmcfRel  
  WHERE cmcfRel.compoundForm.connect IS NOT NULL

  OPTIONAL MATCH (cf:CompoundForm {compoundFormId: cmcfRel.compoundForm.connect.compoundFormId})
  WITH o, cmcfRel, cf

  CALL apoc.util.validate(
    cf IS NULL,
    'CONTRACT_MANUFACTURER_FOR_COMPOUND_FORM connect failed: CompoundForm not found for compoundFormId %s',
    [cmcfRel.compoundForm.connect.compoundFormId]
  )

  MERGE (o)-[r:CONTRACT_MANUFACTURER_FOR_COMPOUND_FORM]->(cf)
  ON CREATE SET r.createdAt = datetime()

  SET r += {
    claimIds: CASE
      WHEN cmcfRel.claimIds IS NULL THEN r.claimIds
      ELSE apoc.coll.toSet(coalesce(r.claimIds, []) + coalesce(cmcfRel.claimIds, []))
    END,
    createdAt: CASE WHEN cmcfRel.createdAt IS NULL THEN r.createdAt ELSE cmcfRel.createdAt END,
    validAt: CASE WHEN cmcfRel.validAt IS NULL THEN r.validAt ELSE cmcfRel.validAt END,
    invalidAt: CASE WHEN cmcfRel.invalidAt IS NULL THEN r.invalidAt ELSE cmcfRel.invalidAt END,
    expiredAt: CASE WHEN cmcfRel.expiredAt IS NULL THEN r.expiredAt ELSE cmcfRel.expiredAt END
  }

  RETURN 1 AS ok
}

RETURN 1 AS ok
`;

export const updateOrganizationContractManufacturerForOrganizationCypher = `
  MATCH (o:Organization {organizationId: $organizationId})
  UNWIND $contractManufacturerForOrganization AS rel
  CALL {
    // ---------------- CREATE ----------------
    WITH o, rel
    WITH o, rel WHERE rel.organization.create IS NOT NULL
  
    MERGE (org2:Organization {organizationId: coalesce(rel.organization.create.organizationId, randomUUID())})
    ON CREATE SET org2.createdAt = datetime()
  
    SET org2 += {
      name: CASE WHEN rel.organization.create.name IS NULL THEN org2.name ELSE rel.organization.create.name END,
      aliases: CASE
        WHEN rel.organization.create.aliases IS NULL THEN org2.aliases
        ELSE apoc.coll.toSet(coalesce(org2.aliases, []) + coalesce(rel.organization.create.aliases, []))
      END,
      orgType: CASE WHEN rel.organization.create.orgType IS NULL THEN org2.orgType ELSE rel.organization.create.orgType END,
      description: CASE WHEN rel.organization.create.description IS NULL THEN org2.description ELSE rel.organization.create.description END,
      businessModel: CASE WHEN rel.organization.create.businessModel IS NULL THEN org2.businessModel ELSE rel.organization.create.businessModel END,
      primaryIndustryTags: CASE
        WHEN rel.organization.create.primaryIndustryTags IS NULL THEN org2.primaryIndustryTags
        ELSE apoc.coll.toSet(coalesce(org2.primaryIndustryTags, []) + coalesce(rel.organization.create.primaryIndustryTags, []))
      END,
      regionsServed: CASE
        WHEN rel.organization.create.regionsServed IS NULL THEN org2.regionsServed
        ELSE apoc.coll.toSet(coalesce(org2.regionsServed, []) + coalesce(rel.organization.create.regionsServed, []))
      END,
      legalName: CASE WHEN rel.organization.create.legalName IS NULL THEN org2.legalName ELSE rel.organization.create.legalName END,
      legalStructure: CASE WHEN rel.organization.create.legalStructure IS NULL THEN org2.legalStructure ELSE rel.organization.create.legalStructure END,
      ownershipType: CASE WHEN rel.organization.create.ownershipType IS NULL THEN org2.ownershipType ELSE rel.organization.create.ownershipType END,
      jurisdictionsOfIncorporation: CASE
        WHEN rel.organization.create.jurisdictionsOfIncorporation IS NULL THEN org2.jurisdictionsOfIncorporation
        ELSE apoc.coll.toSet(coalesce(org2.jurisdictionsOfIncorporation, []) + coalesce(rel.organization.create.jurisdictionsOfIncorporation, []))
      END,
      websiteUrl: CASE WHEN rel.organization.create.websiteUrl IS NULL THEN org2.websiteUrl ELSE rel.organization.create.websiteUrl END,
      defaultCollectionModes: CASE
        WHEN rel.organization.create.defaultCollectionModes IS NULL THEN org2.defaultCollectionModes
        ELSE apoc.coll.toSet(coalesce(org2.defaultCollectionModes, []) + coalesce(rel.organization.create.defaultCollectionModes, []))
      END,
      defaultRegionsAvailable: CASE
        WHEN rel.organization.create.defaultRegionsAvailable IS NULL THEN org2.defaultRegionsAvailable
        ELSE apoc.coll.toSet(coalesce(org2.defaultRegionsAvailable, []) + coalesce(rel.organization.create.defaultRegionsAvailable, []))
      END
    }
  
    MERGE (o)-[r:CONTRACT_MANUFACTURER_FOR_ORGANIZATION]->(org2)
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
  
    RETURN 1 AS okCMFO
  
    UNION
  
    // ---------------- CONNECT (strict) ----------------
    WITH o, rel
    WITH o, rel WHERE rel.organization.connect IS NOT NULL
  
    OPTIONAL MATCH (org3:Organization {organizationId: rel.organization.connect.organizationId})
    CALL apoc.util.validate(
      org3 IS NULL,
      'CONTRACT_MANUFACTURER_FOR_ORGANIZATION connect failed: Organization not found for organizationId %s',
      [rel.organization.connect.organizationId]
    )
  
    MERGE (o)-[r2:CONTRACT_MANUFACTURER_FOR_ORGANIZATION]->(org3)
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
  
    RETURN 1 AS okCMFO
  
    UNION
  
    // ---------------- UPDATE (strict: rel must already exist) ----------------
    WITH o, rel
    WITH o, rel WHERE rel.organization.update IS NOT NULL
  
    CALL apoc.util.validate(
      rel.organization.update.organizationId IS NULL,
      'CONTRACT_MANUFACTURER_FOR_ORGANIZATION update failed: organization.update.organizationId is required',
      []
    )
  
    OPTIONAL MATCH (org4:Organization {organizationId: rel.organization.update.organizationId})
    OPTIONAL MATCH (o)-[r3:CONTRACT_MANUFACTURER_FOR_ORGANIZATION]->(org4)
  
    CALL apoc.util.validate(
      org4 IS NULL,
      'CONTRACT_MANUFACTURER_FOR_ORGANIZATION update failed: Organization not found for organizationId %s',
      [rel.organization.update.organizationId]
    )
    CALL apoc.util.validate(
      r3 IS NULL,
      'CONTRACT_MANUFACTURER_FOR_ORGANIZATION update failed: relationship not found for org %s -> org %s',
      [$organizationId, rel.organization.update.organizationId]
    )
  
    SET org4 += {
      name: CASE WHEN rel.organization.update.name IS NULL THEN org4.name ELSE rel.organization.update.name END,
      aliases: CASE
        WHEN rel.organization.update.aliases IS NULL THEN org4.aliases
        ELSE apoc.coll.toSet(coalesce(org4.aliases, []) + coalesce(rel.organization.update.aliases, []))
      END,
      orgType: CASE WHEN rel.organization.update.orgType IS NULL THEN org4.orgType ELSE rel.organization.update.orgType END,
      description: CASE WHEN rel.organization.update.description IS NULL THEN org4.description ELSE rel.organization.update.description END,
      businessModel: CASE WHEN rel.organization.update.businessModel IS NULL THEN org4.businessModel ELSE rel.organization.update.businessModel END,
      primaryIndustryTags: CASE
        WHEN rel.organization.update.primaryIndustryTags IS NULL THEN org4.primaryIndustryTags
        ELSE apoc.coll.toSet(coalesce(org4.primaryIndustryTags, []) + coalesce(rel.organization.update.primaryIndustryTags, []))
      END,
      regionsServed: CASE
        WHEN rel.organization.update.regionsServed IS NULL THEN org4.regionsServed
        ELSE apoc.coll.toSet(coalesce(org4.regionsServed, []) + coalesce(rel.organization.update.regionsServed, []))
      END,
      legalName: CASE WHEN rel.organization.update.legalName IS NULL THEN org4.legalName ELSE rel.organization.update.legalName END,
      legalStructure: CASE WHEN rel.organization.update.legalStructure IS NULL THEN org4.legalStructure ELSE rel.organization.update.legalStructure END,
      ownershipType: CASE WHEN rel.organization.update.ownershipType IS NULL THEN org4.ownershipType ELSE rel.organization.update.ownershipType END,
      jurisdictionsOfIncorporation: CASE
        WHEN rel.organization.update.jurisdictionsOfIncorporation IS NULL THEN org4.jurisdictionsOfIncorporation
        ELSE apoc.coll.toSet(coalesce(org4.jurisdictionsOfIncorporation, []) + coalesce(rel.organization.update.jurisdictionsOfIncorporation, []))
      END,
      websiteUrl: CASE WHEN rel.organization.update.websiteUrl IS NULL THEN org4.websiteUrl ELSE rel.organization.update.websiteUrl END,
      defaultCollectionModes: CASE
        WHEN rel.organization.update.defaultCollectionModes IS NULL THEN org4.defaultCollectionModes
        ELSE apoc.coll.toSet(coalesce(org4.defaultCollectionModes, []) + coalesce(rel.organization.update.defaultCollectionModes, []))
      END,
      defaultRegionsAvailable: CASE
        WHEN rel.organization.update.defaultRegionsAvailable IS NULL THEN org4.defaultRegionsAvailable
        ELSE apoc.coll.toSet(coalesce(org4.defaultRegionsAvailable, []) + coalesce(rel.organization.update.defaultRegionsAvailable, []))
      END
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
  
    RETURN 1 AS okCMFO
  }
  RETURN count(*) AS _contractManufacturerForOrganizationProcessed
            `;

export const updateOrganizationContractManufacturerForProductCypher = `
  MATCH (o:Organization {organizationId: $organizationId})
  UNWIND $contractManufacturerForProduct AS rel
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
  
    MERGE (o)-[r:CONTRACT_MANUFACTURER_FOR_PRODUCT]->(p)
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
  
    RETURN 1 AS okCMP
  
    UNION
  
    // ---------------- CONNECT (strict) ----------------
    WITH o, rel
    WITH o, rel WHERE rel.product.connect IS NOT NULL
  
    OPTIONAL MATCH (p2:Product {productId: rel.product.connect.productId})
    CALL apoc.util.validate(
      p2 IS NULL,
      'CONTRACT_MANUFACTURER_FOR_PRODUCT connect failed: Product not found for productId %s',
      [rel.product.connect.productId]
    )
  
    MERGE (o)-[r2:CONTRACT_MANUFACTURER_FOR_PRODUCT]->(p2)
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
  
    RETURN 1 AS okCMP
  
    UNION
  
    // ---------------- UPDATE (strict: rel must already exist) ----------------
    WITH o, rel
    WITH o, rel WHERE rel.product.update IS NOT NULL
  
    CALL apoc.util.validate(
      rel.product.update.productId IS NULL,
      'CONTRACT_MANUFACTURER_FOR_PRODUCT update failed: product.update.productId is required',
      []
    )
  
    OPTIONAL MATCH (p3:Product {productId: rel.product.update.productId})
    OPTIONAL MATCH (o)-[r3:CONTRACT_MANUFACTURER_FOR_PRODUCT]->(p3)
  
    CALL apoc.util.validate(
      p3 IS NULL,
      'CONTRACT_MANUFACTURER_FOR_PRODUCT update failed: Product not found for productId %s',
      [rel.product.update.productId]
    )
    CALL apoc.util.validate(
      r3 IS NULL,
      'CONTRACT_MANUFACTURER_FOR_PRODUCT update failed: relationship not found for org %s -> product %s',
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
  
    RETURN 1 AS okCMP
  }
  RETURN count(*) AS _contractManufacturerForProductProcessed
            `;

export const updateOrganizationContractManufacturerForCompoundFormCypher = `
  MATCH (o:Organization {organizationId: $organizationId})
  UNWIND $contractManufacturerForCompoundForm AS rel
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
  
    MERGE (o)-[r:CONTRACT_MANUFACTURER_FOR_COMPOUND_FORM]->(cf)
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
  
    RETURN 1 AS okCMCF
  
    UNION
  
    // ---------------- CONNECT (strict) ----------------
    WITH o, rel
    WITH o, rel WHERE rel.compoundForm.connect IS NOT NULL
  
    OPTIONAL MATCH (cf2:CompoundForm {compoundFormId: rel.compoundForm.connect.compoundFormId})
    CALL apoc.util.validate(
      cf2 IS NULL,
      'CONTRACT_MANUFACTURER_FOR_COMPOUND_FORM connect failed: CompoundForm not found for compoundFormId %s',
      [rel.compoundForm.connect.compoundFormId]
    )
  
    MERGE (o)-[r2:CONTRACT_MANUFACTURER_FOR_COMPOUND_FORM]->(cf2)
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
  
    RETURN 1 AS okCMCF
  
    UNION
  
    // ---------------- UPDATE (strict: rel must already exist) ----------------
    WITH o, rel
    WITH o, rel WHERE rel.compoundForm.update IS NOT NULL
  
    CALL apoc.util.validate(
      rel.compoundForm.update.compoundFormId IS NULL,
      'CONTRACT_MANUFACTURER_FOR_COMPOUND_FORM update failed: compoundForm.update.compoundFormId is required',
      []
    )
  
    OPTIONAL MATCH (cf3:CompoundForm {compoundFormId: rel.compoundForm.update.compoundFormId})
    OPTIONAL MATCH (o)-[r3:CONTRACT_MANUFACTURER_FOR_COMPOUND_FORM]->(cf3)
  
    CALL apoc.util.validate(
      cf3 IS NULL,
      'CONTRACT_MANUFACTURER_FOR_COMPOUND_FORM update failed: CompoundForm not found for compoundFormId %s',
      [rel.compoundForm.update.compoundFormId]
    )
    CALL apoc.util.validate(
      r3 IS NULL,
      'CONTRACT_MANUFACTURER_FOR_COMPOUND_FORM update failed: relationship not found for org %s -> compoundForm %s',
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
  
    RETURN 1 AS okCMCF
  }
  RETURN count(*) AS _contractManufacturerForCompoundFormProcessed
            `;
