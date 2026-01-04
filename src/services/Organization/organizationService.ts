import {
  getNeo4jDriver,
  getNeo4jDatabaseName,
  isNeo4jTransientError,
} from "../../db/neo4j/driver.js";

import {
  executeWrite,
  firstRecordOrNull,
  executeRead,
} from "../../db/neo4j/query.js";

import { Errors } from "../../lib/errors.js";
import { logger } from "../../lib/logger.js";
import { validateInput } from "../../lib/validation.js";
import {
  OrganizationInput,
  OrganizationInputSchema,
} from "../../graphql/inputs/OrganizationInputs.js";
import { Organization } from "../../graphql/types/OrganizationModel.js";

const HAS_LOCATION_RELATIONSHIP_LABEL = "HAS_LOCATION";
const OWNS_OR_CONTROLS_RELATIONSHIP_LABEL = "OWNS_OR_CONTROLS";
const LIST_RELATIONSHIP_LABEL = "LIST";
const OFFERS_PRODUCT_RELATIONSHIP_LABEL = "OFFERS_PRODUCT";
const SUPPLIES_COMPOUND_FORM_RELATIONSHIP_LABEL = "SUPPLIES_COMPOUND_FORM";

export async function createOrganizationWithOptionalRelations(
  input: OrganizationInput
): Promise<Organization> {
  const driver = getNeo4jDriver();

  const validated = validateInput(
    OrganizationInputSchema,
    input,
    "OrganizationInputWithOptionalRelations"
  );

  // Extract only primitive properties for the main Organization SET statement
  // Relationship arrays are handled separately in UNWIND clauses
  const params = {
    organizationId: validated.organizationId,
    name: validated.name,
    aliases: validated.aliases ?? null,
    orgType: validated.orgType,
    description: validated.description ?? null,
    businessModel: validated.businessModel ?? null,
    primaryIndustryTags: validated.primaryIndustryTags ?? null,
    regionsServed: validated.regionsServed ?? null,
    legalName: validated.legalName ?? null,
    legalStructure: validated.legalStructure ?? null,
    ownershipType: validated.ownershipType ?? null,
    jurisdictionsOfIncorporation:
      validated.jurisdictionsOfIncorporation ?? null,
    websiteUrl: validated.websiteUrl ?? null,
    defaultCollectionModes: validated.defaultCollectionModes ?? null,
    defaultRegionsAvailable: validated.defaultRegionsAvailable ?? null,
    publicTicker: validated.publicTicker ?? null,
    fundingStage: validated.fundingStage ?? null,
    employeeCountMin: validated.employeeCountMin ?? null,
    employeeCountMax: validated.employeeCountMax ?? null,
    employeeCountAsOf: validated.employeeCountAsOf ?? null,
    revenueAnnualMin: validated.revenueAnnualMin ?? null,
    revenueAnnualMax: validated.revenueAnnualMax ?? null,
    revenueAnnualCurrency: validated.revenueAnnualCurrency ?? null,
    revenueAnnualAsOf: validated.revenueAnnualAsOf ?? null,
    valuationMin: validated.valuationMin ?? null,
    valuationMax: validated.valuationMax ?? null,
    valuationCurrency: validated.valuationCurrency ?? null,
    valuationAsOf: validated.valuationAsOf ?? null,
    validAt: validated.validAt ?? null,
    invalidAt: validated.invalidAt ?? null,
    expiredAt: validated.expiredAt ?? null,
    // Relationship arrays - these are used in UNWIND clauses
    hasLocation: validated.hasLocation ?? null,
    ownsOrControls: validated.ownsOrControls ?? null,
    lists: validated.lists ?? null,
    offersProduct: validated.offersProduct ?? null,
    suppliesCompoundForm: validated.suppliesCompoundForm ?? null,
  };

  try {
    const organization = await executeWrite(async (tx) => {
      const result = await tx.run(
        `
          MERGE (o:Organization {organizationId: $organizationId})
ON CREATE SET o.createdAt = datetime()

// --- Organization properties (null-safe) ---
SET o += {
  name: CASE WHEN $name IS NULL THEN o.name ELSE $name END,
  aliases: CASE WHEN $aliases IS NULL THEN o.aliases ELSE $aliases END,
  orgType: CASE WHEN $orgType IS NULL THEN o.orgType ELSE $orgType END,
  description: CASE WHEN $description IS NULL THEN o.description ELSE $description END,
  businessModel: CASE WHEN $businessModel IS NULL THEN o.businessModel ELSE $businessModel END,
  primaryIndustryTags: CASE WHEN $primaryIndustryTags IS NULL THEN o.primaryIndustryTags ELSE $primaryIndustryTags END,
  regionsServed: CASE WHEN $regionsServed IS NULL THEN o.regionsServed ELSE $regionsServed END,
  legalName: CASE WHEN $legalName IS NULL THEN o.legalName ELSE $legalName END,
  legalStructure: CASE WHEN $legalStructure IS NULL THEN o.legalStructure ELSE $legalStructure END,
  ownershipType: CASE WHEN $ownershipType IS NULL THEN o.ownershipType ELSE $ownershipType END,
  jurisdictionsOfIncorporation: CASE WHEN $jurisdictionsOfIncorporation IS NULL THEN o.jurisdictionsOfIncorporation ELSE $jurisdictionsOfIncorporation END,
  websiteUrl: CASE WHEN $websiteUrl IS NULL THEN o.websiteUrl ELSE $websiteUrl END,
  defaultCollectionModes: CASE WHEN $defaultCollectionModes IS NULL THEN o.defaultCollectionModes ELSE $defaultCollectionModes END,
  defaultRegionsAvailable: CASE WHEN $defaultRegionsAvailable IS NULL THEN o.defaultRegionsAvailable ELSE $defaultRegionsAvailable END,
  publicTicker: CASE WHEN $publicTicker IS NULL THEN o.publicTicker ELSE $publicTicker END,
  fundingStage: CASE WHEN $fundingStage IS NULL THEN o.fundingStage ELSE $fundingStage END,
  employeeCountMin: CASE WHEN $employeeCountMin IS NULL THEN o.employeeCountMin ELSE $employeeCountMin END,
  employeeCountMax: CASE WHEN $employeeCountMax IS NULL THEN o.employeeCountMax ELSE $employeeCountMax END,
  employeeCountAsOf: CASE WHEN $employeeCountAsOf IS NULL THEN o.employeeCountAsOf ELSE $employeeCountAsOf END,
  revenueAnnualMin: CASE WHEN $revenueAnnualMin IS NULL THEN o.revenueAnnualMin ELSE $revenueAnnualMin END,
  revenueAnnualMax: CASE WHEN $revenueAnnualMax IS NULL THEN o.revenueAnnualMax ELSE $revenueAnnualMax END,
  revenueAnnualCurrency: CASE WHEN $revenueAnnualCurrency IS NULL THEN o.revenueAnnualCurrency ELSE $revenueAnnualCurrency END,
  revenueAnnualAsOf: CASE WHEN $revenueAnnualAsOf IS NULL THEN o.revenueAnnualAsOf ELSE $revenueAnnualAsOf END,
  valuationMin: CASE WHEN $valuationMin IS NULL THEN o.valuationMin ELSE $valuationMin END,
  valuationMax: CASE WHEN $valuationMax IS NULL THEN o.valuationMax ELSE $valuationMax END,
  valuationCurrency: CASE WHEN $valuationCurrency IS NULL THEN o.valuationCurrency ELSE $valuationCurrency END,
  valuationAsOf: CASE WHEN $valuationAsOf IS NULL THEN o.valuationAsOf ELSE $valuationAsOf END,
  validAt: CASE WHEN $validAt IS NULL THEN o.validAt ELSE $validAt END,
  invalidAt: CASE WHEN $invalidAt IS NULL THEN o.invalidAt ELSE $invalidAt END,
  expiredAt: CASE WHEN $expiredAt IS NULL THEN o.expiredAt ELSE $expiredAt END
}

WITH o

// ------------------------------------------------------------------
// HAS_LOCATION (create or connect) ✅ (no MATCH in FOREACH; importing WITH rule respected)
// ------------------------------------------------------------------
UNWIND coalesce($hasLocation, []) AS rel
CALL {
  WITH o, rel

  // ---- CREATE branch ----
  WITH o, rel
  WHERE rel.location.create IS NOT NULL

  MERGE (p:PhysicalLocation {
    locationId: coalesce(rel.location.create.locationId, randomUUID())
  })
  ON CREATE SET p.createdAt = datetime()

  SET p += {
    canonicalName: CASE WHEN rel.location.create.canonicalName IS NULL THEN p.canonicalName ELSE rel.location.create.canonicalName END,
    locationType: CASE WHEN rel.location.create.locationType IS NULL THEN p.locationType ELSE rel.location.create.locationType END,
    addressLine1: CASE WHEN rel.location.create.addressLine1 IS NULL THEN p.addressLine1 ELSE rel.location.create.addressLine1 END,
    addressLine2: CASE WHEN rel.location.create.addressLine2 IS NULL THEN p.addressLine2 ELSE rel.location.create.addressLine2 END,
    city: CASE WHEN rel.location.create.city IS NULL THEN p.city ELSE rel.location.create.city END,
    region: CASE WHEN rel.location.create.region IS NULL THEN p.region ELSE rel.location.create.region END,
    postalCode: CASE WHEN rel.location.create.postalCode IS NULL THEN p.postalCode ELSE rel.location.create.postalCode END,
    countryCode: CASE WHEN rel.location.create.countryCode IS NULL THEN p.countryCode ELSE rel.location.create.countryCode END,
    geoLat: CASE WHEN rel.location.create.geoLat IS NULL THEN p.geoLat ELSE rel.location.create.geoLat END,
    geoLon: CASE WHEN rel.location.create.geoLon IS NULL THEN p.geoLon ELSE rel.location.create.geoLon END,
    timezone: CASE WHEN rel.location.create.timezone IS NULL THEN p.timezone ELSE rel.location.create.timezone END,
    jurisdiction: CASE WHEN rel.location.create.jurisdiction IS NULL THEN p.jurisdiction ELSE rel.location.create.jurisdiction END,
    placeTags: CASE WHEN rel.location.create.placeTags IS NULL THEN p.placeTags ELSE rel.location.create.placeTags END,
    hoursOfOperation: CASE WHEN rel.location.create.hoursOfOperation IS NULL THEN p.hoursOfOperation ELSE rel.location.create.hoursOfOperation END,
    contactPhone: CASE WHEN rel.location.create.contactPhone IS NULL THEN p.contactPhone ELSE rel.location.create.contactPhone END,
    contactEmail: CASE WHEN rel.location.create.contactEmail IS NULL THEN p.contactEmail ELSE rel.location.create.contactEmail END
  }

  MERGE (o)-[l:HAS_LOCATION]->(p)
  ON CREATE SET l.createdAt = datetime()

  SET l += {
    locationRole: CASE WHEN rel.locationRole IS NULL THEN l.locationRole ELSE rel.locationRole END,
    isPrimary: CASE WHEN rel.isPrimary IS NULL THEN l.isPrimary ELSE rel.isPrimary END,
    startDate: CASE WHEN rel.startDate IS NULL THEN l.startDate ELSE rel.startDate END,
    endDate: CASE WHEN rel.endDate IS NULL THEN l.endDate ELSE rel.endDate END,
    claimIds: CASE WHEN rel.claimIds IS NULL THEN l.claimIds ELSE rel.claimIds END,
    validAt: CASE WHEN rel.validAt IS NULL THEN l.validAt ELSE rel.validAt END,
    invalidAt: CASE WHEN rel.invalidAt IS NULL THEN l.invalidAt ELSE rel.invalidAt END,
    expiredAt: CASE WHEN rel.expiredAt IS NULL THEN l.expiredAt ELSE rel.expiredAt END
  }

  RETURN 1 AS _

  UNION

  // ---- CONNECT branch ----
  WITH o, rel
  WITH o, rel
  WHERE rel.location.connect IS NOT NULL

  OPTIONAL MATCH (p:PhysicalLocation {locationId: rel.location.connect.locationId})
  WITH o, rel, p
  WHERE p IS NOT NULL

  MERGE (o)-[l:HAS_LOCATION]->(p)
  ON CREATE SET l.createdAt = datetime()

  SET l += {
    locationRole: CASE WHEN rel.locationRole IS NULL THEN l.locationRole ELSE rel.locationRole END,
    isPrimary: CASE WHEN rel.isPrimary IS NULL THEN l.isPrimary ELSE rel.isPrimary END,
    startDate: CASE WHEN rel.startDate IS NULL THEN l.startDate ELSE rel.startDate END,
    endDate: CASE WHEN rel.endDate IS NULL THEN l.endDate ELSE rel.endDate END,
    claimIds: CASE WHEN rel.claimIds IS NULL THEN l.claimIds ELSE rel.claimIds END,
    validAt: CASE WHEN rel.validAt IS NULL THEN l.validAt ELSE rel.validAt END,
    invalidAt: CASE WHEN rel.invalidAt IS NULL THEN l.invalidAt ELSE rel.invalidAt END,
    expiredAt: CASE WHEN rel.expiredAt IS NULL THEN l.expiredAt ELSE rel.expiredAt END
  }

  RETURN 1 AS _
}
WITH DISTINCT o

// ------------------------------------------------------------------
// OWNS_OR_CONTROLS (create only) ✅ importing WITH rule respected
// ------------------------------------------------------------------
UNWIND coalesce($ownsOrControls, []) AS ocRel
CALL {
  WITH o, ocRel
  WITH o, ocRel
  WHERE ocRel.organization.create IS NOT NULL

  MERGE (other:Organization {
    organizationId: coalesce(ocRel.organization.create.organizationId, randomUUID())
  })
  ON CREATE SET other.createdAt = datetime()

  SET other += {
    name: CASE WHEN ocRel.organization.create.name IS NULL THEN other.name ELSE ocRel.organization.create.name END,
    aliases: CASE WHEN ocRel.organization.create.aliases IS NULL THEN other.aliases ELSE ocRel.organization.create.aliases END,
    orgType: CASE WHEN ocRel.organization.create.orgType IS NULL THEN other.orgType ELSE ocRel.organization.create.orgType END,
    description: CASE WHEN ocRel.organization.create.description IS NULL THEN other.description ELSE ocRel.organization.create.description END,
    businessModel: CASE WHEN ocRel.organization.create.businessModel IS NULL THEN other.businessModel ELSE ocRel.organization.create.businessModel END,
    primaryIndustryTags: CASE WHEN ocRel.organization.create.primaryIndustryTags IS NULL THEN other.primaryIndustryTags ELSE ocRel.organization.create.primaryIndustryTags END,
    regionsServed: CASE WHEN ocRel.organization.create.regionsServed IS NULL THEN other.regionsServed ELSE ocRel.organization.create.regionsServed END,
    legalName: CASE WHEN ocRel.organization.create.legalName IS NULL THEN other.legalName ELSE ocRel.organization.create.legalName END,
    legalStructure: CASE WHEN ocRel.organization.create.legalStructure IS NULL THEN other.legalStructure ELSE ocRel.organization.create.legalStructure END,
    ownershipType: CASE WHEN ocRel.organization.create.ownershipType IS NULL THEN other.ownershipType ELSE ocRel.organization.create.ownershipType END,
    jurisdictionsOfIncorporation: CASE WHEN ocRel.organization.create.jurisdictionsOfIncorporation IS NULL THEN other.jurisdictionsOfIncorporation ELSE ocRel.organization.create.jurisdictionsOfIncorporation END,
    websiteUrl: CASE WHEN ocRel.organization.create.websiteUrl IS NULL THEN other.websiteUrl ELSE ocRel.organization.create.websiteUrl END,
    defaultCollectionModes: CASE WHEN ocRel.organization.create.defaultCollectionModes IS NULL THEN other.defaultCollectionModes ELSE ocRel.organization.create.defaultCollectionModes END,
    defaultRegionsAvailable: CASE WHEN ocRel.organization.create.defaultRegionsAvailable IS NULL THEN other.defaultRegionsAvailable ELSE ocRel.organization.create.defaultRegionsAvailable END,
    publicTicker: CASE WHEN ocRel.organization.create.publicTicker IS NULL THEN other.publicTicker ELSE ocRel.organization.create.publicTicker END,
    fundingStage: CASE WHEN ocRel.organization.create.fundingStage IS NULL THEN other.fundingStage ELSE ocRel.organization.create.fundingStage END,
    employeeCountMin: CASE WHEN ocRel.organization.create.employeeCountMin IS NULL THEN other.employeeCountMin ELSE ocRel.organization.create.employeeCountMin END,
    employeeCountMax: CASE WHEN ocRel.organization.create.employeeCountMax IS NULL THEN other.employeeCountMax ELSE ocRel.organization.create.employeeCountMax END,
    employeeCountAsOf: CASE WHEN ocRel.organization.create.employeeCountAsOf IS NULL THEN other.employeeCountAsOf ELSE ocRel.organization.create.employeeCountAsOf END,
    revenueAnnualMin: CASE WHEN ocRel.organization.create.revenueAnnualMin IS NULL THEN other.revenueAnnualMin ELSE ocRel.organization.create.revenueAnnualMin END,
    revenueAnnualMax: CASE WHEN ocRel.organization.create.revenueAnnualMax IS NULL THEN other.revenueAnnualMax ELSE ocRel.organization.create.revenueAnnualMax END,
    revenueAnnualCurrency: CASE WHEN ocRel.organization.create.revenueAnnualCurrency IS NULL THEN other.revenueAnnualCurrency ELSE ocRel.organization.create.revenueAnnualCurrency END,
    revenueAnnualAsOf: CASE WHEN ocRel.organization.create.revenueAnnualAsOf IS NULL THEN other.revenueAnnualAsOf ELSE ocRel.organization.create.revenueAnnualAsOf END,
    valuationMin: CASE WHEN ocRel.organization.create.valuationMin IS NULL THEN other.valuationMin ELSE ocRel.organization.create.valuationMin END,
    valuationMax: CASE WHEN ocRel.organization.create.valuationMax IS NULL THEN other.valuationMax ELSE ocRel.organization.create.valuationMax END,
    valuationCurrency: CASE WHEN ocRel.organization.create.valuationCurrency IS NULL THEN other.valuationCurrency ELSE ocRel.organization.create.valuationCurrency END,
    valuationAsOf: CASE WHEN ocRel.organization.create.valuationAsOf IS NULL THEN other.valuationAsOf ELSE ocRel.organization.create.valuationAsOf END,
    validAt: CASE WHEN ocRel.organization.create.validAt IS NULL THEN other.validAt ELSE ocRel.organization.create.validAt END,
    invalidAt: CASE WHEN ocRel.organization.create.invalidAt IS NULL THEN other.invalidAt ELSE ocRel.organization.create.invalidAt END,
    expiredAt: CASE WHEN ocRel.organization.create.expiredAt IS NULL THEN other.expiredAt ELSE ocRel.organization.create.expiredAt END
  }

  MERGE (o)-[r:OWNS_OR_CONTROLS]->(other)
  ON CREATE SET r.createdAt = datetime()

  SET r += {
    relationshipType: CASE WHEN ocRel.relationshipType IS NULL THEN r.relationshipType ELSE ocRel.relationshipType END,
    ownershipPercent: CASE WHEN ocRel.ownershipPercent IS NULL THEN r.ownershipPercent ELSE ocRel.ownershipPercent END,
    controlType: CASE WHEN ocRel.controlType IS NULL THEN r.controlType ELSE ocRel.controlType END,
    effectiveFrom: CASE WHEN ocRel.effectiveFrom IS NULL THEN r.effectiveFrom ELSE ocRel.effectiveFrom END,
    effectiveTo: CASE WHEN ocRel.effectiveTo IS NULL THEN r.effectiveTo ELSE ocRel.effectiveTo END,
    isCurrent: CASE WHEN ocRel.isCurrent IS NULL THEN r.isCurrent ELSE ocRel.isCurrent END,
    claimIds: CASE WHEN ocRel.claimIds IS NULL THEN r.claimIds ELSE ocRel.claimIds END,
    validAt: CASE WHEN ocRel.validAt IS NULL THEN r.validAt ELSE ocRel.validAt END,
    invalidAt: CASE WHEN ocRel.invalidAt IS NULL THEN r.invalidAt ELSE ocRel.invalidAt END,
    expiredAt: CASE WHEN ocRel.expiredAt IS NULL THEN r.expiredAt ELSE ocRel.expiredAt END
  }

  RETURN 1 AS _
}
WITH DISTINCT o

// ------------------------------------------------------------------
// LIST (create only) ✅ importing WITH rule respected
// ------------------------------------------------------------------
UNWIND coalesce($lists, []) AS listRel
CALL {
  WITH o, listRel
  WITH o, listRel
  WHERE listRel.listing.create IS NOT NULL

  MERGE (lst:Listing {
    listingId: coalesce(listRel.listing.create.listingId, randomUUID())
  })
  ON CREATE SET lst.createdAt = datetime()

  SET lst += {
    listingDomain: CASE WHEN listRel.listing.create.listingDomain IS NULL THEN lst.listingDomain ELSE listRel.listing.create.listingDomain END,
    title: CASE WHEN listRel.listing.create.title IS NULL THEN lst.title ELSE listRel.listing.create.title END,
    description: CASE WHEN listRel.listing.create.description IS NULL THEN lst.description ELSE listRel.listing.create.description END,
    sku: CASE WHEN listRel.listing.create.sku IS NULL THEN lst.sku ELSE listRel.listing.create.sku END,
    url: CASE WHEN listRel.listing.create.url IS NULL THEN lst.url ELSE listRel.listing.create.url END,
    brandName: CASE WHEN listRel.listing.create.brandName IS NULL THEN lst.brandName ELSE listRel.listing.create.brandName END,
    currency: CASE WHEN listRel.listing.create.currency IS NULL THEN lst.currency ELSE listRel.listing.create.currency END,
    priceAmount: CASE WHEN listRel.listing.create.priceAmount IS NULL THEN lst.priceAmount ELSE listRel.listing.create.priceAmount END,
    priceType: CASE WHEN listRel.listing.create.priceType IS NULL THEN lst.priceType ELSE listRel.listing.create.priceType END,
    pricingNotes: CASE WHEN listRel.listing.create.pricingNotes IS NULL THEN lst.pricingNotes ELSE listRel.listing.create.pricingNotes END,
    constraints: CASE WHEN listRel.listing.create.constraints IS NULL THEN lst.constraints ELSE listRel.listing.create.constraints END,
    regionsAvailable: CASE WHEN listRel.listing.create.regionsAvailable IS NULL THEN lst.regionsAvailable ELSE listRel.listing.create.regionsAvailable END,
    requiresAppointment: CASE WHEN listRel.listing.create.requiresAppointment IS NULL THEN lst.requiresAppointment ELSE listRel.listing.create.requiresAppointment END,
    collectionMode: CASE WHEN listRel.listing.create.collectionMode IS NULL THEN lst.collectionMode ELSE listRel.listing.create.collectionMode END,
    turnaroundTime: CASE WHEN listRel.listing.create.turnaroundTime IS NULL THEN lst.turnaroundTime ELSE listRel.listing.create.turnaroundTime END
  }

  MERGE (o)-[r:LIST]->(lst)
  ON CREATE SET r.createdAt = datetime()

  SET r += {
    listRole: CASE WHEN listRel.listRole IS NULL THEN r.listRole ELSE listRel.listRole END,
    channel: CASE WHEN listRel.channel IS NULL THEN r.channel ELSE listRel.channel END,
    regionsOverrides: CASE WHEN listRel.regionsOverrides IS NULL THEN r.regionsOverrides ELSE listRel.regionsOverrides END,
    collectionModesOverrides: CASE WHEN listRel.collectionModesOverrides IS NULL THEN r.collectionModesOverrides ELSE listRel.collectionModesOverrides END,
    availabilityNotes: CASE WHEN listRel.availabilityNotes IS NULL THEN r.availabilityNotes ELSE listRel.availabilityNotes END,
    claimIds: CASE WHEN listRel.claimIds IS NULL THEN r.claimIds ELSE listRel.claimIds END,
    validAt: CASE WHEN listRel.validAt IS NULL THEN r.validAt ELSE listRel.validAt END,
    invalidAt: CASE WHEN listRel.invalidAt IS NULL THEN r.invalidAt ELSE listRel.invalidAt END,
    expiredAt: CASE WHEN listRel.expiredAt IS NULL THEN r.expiredAt ELSE listRel.expiredAt END
  }

  RETURN 1 AS _
}
WITH DISTINCT o

// ------------------------------------------------------------------
// OFFERS_PRODUCT (create only) ✅ importing WITH rule respected
// ------------------------------------------------------------------
UNWIND coalesce($offersProduct, []) AS prodRel
CALL {
  WITH o, prodRel
  WITH o, prodRel
  WHERE prodRel.product.create IS NOT NULL

  MERGE (p:Product {
    productId: coalesce(prodRel.product.create.productId, randomUUID())
  })
  ON CREATE SET p.createdAt = datetime()

  SET p += {
    name: CASE WHEN prodRel.product.create.name IS NULL THEN p.name ELSE prodRel.product.create.name END,
    synonyms: CASE WHEN prodRel.product.create.synonyms IS NULL THEN p.synonyms ELSE prodRel.product.create.synonyms END,
    productDomain: CASE WHEN prodRel.product.create.productDomain IS NULL THEN p.productDomain ELSE prodRel.product.create.productDomain END,
    productType: CASE WHEN prodRel.product.create.productType IS NULL THEN p.productType ELSE prodRel.product.create.productType END,
    intendedUse: CASE WHEN prodRel.product.create.intendedUse IS NULL THEN p.intendedUse ELSE prodRel.product.create.intendedUse END,
    description: CASE WHEN prodRel.product.create.description IS NULL THEN p.description ELSE prodRel.product.create.description END,
    brandName: CASE WHEN prodRel.product.create.brandName IS NULL THEN p.brandName ELSE prodRel.product.create.brandName END,
    modelNumber: CASE WHEN prodRel.product.create.modelNumber IS NULL THEN p.modelNumber ELSE prodRel.product.create.modelNumber END,
    ndcCode: CASE WHEN prodRel.product.create.ndcCode IS NULL THEN p.ndcCode ELSE prodRel.product.create.ndcCode END,
    upc: CASE WHEN prodRel.product.create.upc IS NULL THEN p.upc ELSE prodRel.product.create.upc END,
    gtin: CASE WHEN prodRel.product.create.gtin IS NULL THEN p.gtin ELSE prodRel.product.create.gtin END,
    riskClass: CASE WHEN prodRel.product.create.riskClass IS NULL THEN p.riskClass ELSE prodRel.product.create.riskClass END,
    currency: CASE WHEN prodRel.product.create.currency IS NULL THEN p.currency ELSE prodRel.product.create.currency END,
    priceAmount: CASE WHEN prodRel.product.create.priceAmount IS NULL THEN p.priceAmount ELSE prodRel.product.create.priceAmount END
  }

  MERGE (o)-[r:OFFERS_PRODUCT]->(p)
  ON CREATE SET r.createdAt = datetime()

  SET r += {
    validAt: CASE WHEN prodRel.validAt IS NULL THEN r.validAt ELSE prodRel.validAt END,
    invalidAt: CASE WHEN prodRel.invalidAt IS NULL THEN r.invalidAt ELSE prodRel.invalidAt END,
    expiredAt: CASE WHEN prodRel.expiredAt IS NULL THEN r.expiredAt ELSE prodRel.expiredAt END
  }

  RETURN 1 AS _
}
WITH DISTINCT o

// ------------------------------------------------------------------
// SUPPLIES_COMPOUND_FORM (create only) ✅ importing WITH rule respected
// ------------------------------------------------------------------
UNWIND coalesce($suppliesCompoundForm, []) AS cfRel
CALL {
  WITH o, cfRel
  WITH o, cfRel
  WHERE cfRel.compoundForm.create IS NOT NULL

  MERGE (cf:CompoundForm {
    compoundFormId: coalesce(cfRel.compoundForm.create.compoundFormId, randomUUID())
  })
  ON CREATE SET cf.createdAt = datetime()

  SET cf += {
    canonicalName: CASE WHEN cfRel.compoundForm.create.canonicalName IS NULL THEN cf.canonicalName ELSE cfRel.compoundForm.create.canonicalName END,
    formType: CASE WHEN cfRel.compoundForm.create.formType IS NULL THEN cf.formType ELSE cfRel.compoundForm.create.formType END,
    chemicalDifferences: CASE WHEN cfRel.compoundForm.create.chemicalDifferences IS NULL THEN cf.chemicalDifferences ELSE cfRel.compoundForm.create.chemicalDifferences END,
    stabilityProfile: CASE WHEN cfRel.compoundForm.create.stabilityProfile IS NULL THEN cf.stabilityProfile ELSE cfRel.compoundForm.create.stabilityProfile END,
    solubilityProfile: CASE WHEN cfRel.compoundForm.create.solubilityProfile IS NULL THEN cf.solubilityProfile ELSE cfRel.compoundForm.create.solubilityProfile END,
    bioavailabilityNotes: CASE WHEN cfRel.compoundForm.create.bioavailabilityNotes IS NULL THEN cf.bioavailabilityNotes ELSE cfRel.compoundForm.create.bioavailabilityNotes END,
    regulatoryStatusSummary: CASE WHEN cfRel.compoundForm.create.regulatoryStatusSummary IS NULL THEN cf.regulatoryStatusSummary ELSE cfRel.compoundForm.create.regulatoryStatusSummary END
  }

  MERGE (o)-[r:SUPPLIES_COMPOUND_FORM]->(cf)
  ON CREATE SET r.createdAt = datetime()

  SET r += {
    validAt: CASE WHEN cfRel.validAt IS NULL THEN r.validAt ELSE cfRel.validAt END,
    invalidAt: CASE WHEN cfRel.invalidAt IS NULL THEN r.invalidAt ELSE cfRel.invalidAt END,
    expiredAt: CASE WHEN cfRel.expiredAt IS NULL THEN r.expiredAt ELSE cfRel.expiredAt END
  }

  RETURN 1 AS _
}

RETURN o
          `,
        params
      );

      const record = firstRecordOrNull(result);
      if (!record) throw new Error("Failed to create Organization");

      const node = record.get("o");
      return node?.properties ?? node;
    });

    return organization as Organization;
  } catch (err) {
    logger.error(`createOrganizationWithOptionalRelations failed: ${err}`);
    throw Errors.internalError(
      "Failed to create organization with optional relations"
    );
  }
}

export async function findAllOrganizations(): Promise<Organization[]> {
  try {
    const organizations = await executeRead(async (tx) => {
      const result = await tx.run(
        `
          MATCH (o:Organization)
          RETURN properties(o) AS organization
          ORDER BY o.createdAt DESC
        `
      );

      return result.records.map((r: Record<string, any>) =>
        r.get("organization")
      );
    });

    return organizations as Organization[];
  } catch (err) {
    logger.error(`findAllOrganizations failed: ${err}`);
    throw Errors.internalError("Failed to fetch organizations");
  }
}
