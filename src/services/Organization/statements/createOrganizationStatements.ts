import { OrgIdentifierKey } from "../types.js";

export function buildOrgUpsertCypher(identifierKey: OrgIdentifierKey) {
  return `
  MERGE (o:Organization { ${identifierKey}: $idValue }) 
 

  ON CREATE SET o.createdAt = datetime() 

  SET o.organizationId = coalesce(o.organizationId, randomUUID()) 
  

SET o += {   
  
  name: CASE WHEN $name IS NULL THEN o.name ELSE $name END,

  aliases: CASE
    WHEN $aliases IS NULL THEN o.aliases
    ELSE apoc.coll.toSet(coalesce(o.aliases, []) + coalesce($aliases, []))
  END,

  orgType: CASE WHEN $orgType IS NULL THEN o.orgType ELSE $orgType END,
  description: CASE WHEN $description IS NULL THEN o.description ELSE $description END,
  businessModel: CASE WHEN $businessModel IS NULL THEN o.businessModel ELSE $businessModel END,

  primaryIndustryTags: CASE
    WHEN $primaryIndustryTags IS NULL THEN o.primaryIndustryTags
    ELSE apoc.coll.toSet(coalesce(o.primaryIndustryTags, []) + coalesce($primaryIndustryTags, []))
  END,
  regionsServed: CASE
    WHEN $regionsServed IS NULL THEN o.regionsServed
    ELSE apoc.coll.toSet(coalesce(o.regionsServed, []) + coalesce($regionsServed, []))
  END,

  legalName: CASE WHEN $legalName IS NULL THEN o.legalName ELSE $legalName END,
  legalStructure: CASE WHEN $legalStructure IS NULL THEN o.legalStructure ELSE $legalStructure END,
  ownershipType: CASE WHEN $ownershipType IS NULL THEN o.ownershipType ELSE $ownershipType END,

  jurisdictionsOfIncorporation: CASE
    WHEN $jurisdictionsOfIncorporation IS NULL THEN o.jurisdictionsOfIncorporation
    ELSE apoc.coll.toSet(coalesce(o.jurisdictionsOfIncorporation, []) + coalesce($jurisdictionsOfIncorporation, []))
  END,

  websiteUrl: CASE WHEN $websiteUrl IS NULL THEN o.websiteUrl ELSE $websiteUrl END,

  defaultCollectionModes: CASE
    WHEN $defaultCollectionModes IS NULL THEN o.defaultCollectionModes
    ELSE apoc.coll.toSet(coalesce(o.defaultCollectionModes, []) + coalesce($defaultCollectionModes, []))
  END,
  defaultRegionsAvailable: CASE
    WHEN $defaultRegionsAvailable IS NULL THEN o.defaultRegionsAvailable
    ELSE apoc.coll.toSet(coalesce(o.defaultRegionsAvailable, []) + coalesce($defaultRegionsAvailable, []))
  END,

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

RETURN o

  `  
}


// NOTE: apoc.util.validate is VOID for you -> NO "YIELD value"
export const organizationHasLocationCypher = `
// ==================================================================
// HAS_LOCATION (create OR connect) (CONNECT = HARD FAIL if missing)
// ==================================================================
MATCH (o:Organization {organizationId: $organizationId})

UNWIND coalesce($hasLocation, []) AS hlRel
CALL {
  // ---- CREATE branch ----
  WITH o, hlRel 
  WITH o, hlRel 
  WHERE hlRel.location.create IS NOT NULL

  MERGE (p:PhysicalLocation {
    locationId: coalesce(hlRel.location.create.locationId, randomUUID())
  })
  ON CREATE SET p.createdAt = datetime()

  SET p += {
    canonicalName: CASE WHEN hlRel.location.create.canonicalName IS NULL THEN p.canonicalName ELSE hlRel.location.create.canonicalName END,
    locationType: CASE WHEN hlRel.location.create.locationType IS NULL THEN p.locationType ELSE hlRel.location.create.locationType END,
    addressLine1: CASE WHEN hlRel.location.create.addressLine1 IS NULL THEN p.addressLine1 ELSE hlRel.location.create.addressLine1 END,
    addressLine2: CASE WHEN hlRel.location.create.addressLine2 IS NULL THEN p.addressLine2 ELSE hlRel.location.create.addressLine2 END,
    city: CASE WHEN hlRel.location.create.city IS NULL THEN p.city ELSE hlRel.location.create.city END,
    region: CASE WHEN hlRel.location.create.region IS NULL THEN p.region ELSE hlRel.location.create.region END,
    postalCode: CASE WHEN hlRel.location.create.postalCode IS NULL THEN p.postalCode ELSE hlRel.location.create.postalCode END,
    countryCode: CASE WHEN hlRel.location.create.countryCode IS NULL THEN p.countryCode ELSE hlRel.location.create.countryCode END,
    geoLat: CASE WHEN hlRel.location.create.geoLat IS NULL THEN p.geoLat ELSE hlRel.location.create.geoLat END,
    geoLon: CASE WHEN hlRel.location.create.geoLon IS NULL THEN p.geoLon ELSE hlRel.location.create.geoLon END,
    timezone: CASE WHEN hlRel.location.create.timezone IS NULL THEN p.timezone ELSE hlRel.location.create.timezone END,
    jurisdiction: CASE WHEN hlRel.location.create.jurisdiction IS NULL THEN p.jurisdiction ELSE hlRel.location.create.jurisdiction END,

    placeTags: CASE
      WHEN hlRel.location.create.placeTags IS NULL THEN p.placeTags
      ELSE apoc.coll.toSet(coalesce(p.placeTags, []) + coalesce(hlRel.location.create.placeTags, []))
    END,

    hoursOfOperation: CASE WHEN hlRel.location.create.hoursOfOperation IS NULL THEN p.hoursOfOperation ELSE hlRel.location.create.hoursOfOperation END,
    contactPhone: CASE WHEN hlRel.location.create.contactPhone IS NULL THEN p.contactPhone ELSE hlRel.location.create.contactPhone END,
    contactEmail: CASE WHEN hlRel.location.create.contactEmail IS NULL THEN p.contactEmail ELSE hlRel.location.create.contactEmail END
  }

  MERGE (o)-[l:HAS_LOCATION]->(p)
  ON CREATE SET l.createdAt = datetime()

  SET l += {
    locationRole: CASE WHEN hlRel.locationRole IS NULL THEN l.locationRole ELSE hlRel.locationRole END,
    isPrimary: CASE WHEN hlRel.isPrimary IS NULL THEN l.isPrimary ELSE hlRel.isPrimary END,
    startDate: CASE WHEN hlRel.startDate IS NULL THEN l.startDate ELSE hlRel.startDate END,
    endDate: CASE WHEN hlRel.endDate IS NULL THEN l.endDate ELSE hlRel.endDate END,

    claimIds: CASE
      WHEN hlRel.claimIds IS NULL THEN l.claimIds
      ELSE apoc.coll.toSet(coalesce(l.claimIds, []) + coalesce(hlRel.claimIds, []))
    END,

    createdAt: CASE WHEN hlRel.createdAt IS NULL THEN l.createdAt ELSE hlRel.createdAt END,
    validAt: CASE WHEN hlRel.validAt IS NULL THEN l.validAt ELSE hlRel.validAt END,
    invalidAt: CASE WHEN hlRel.invalidAt IS NULL THEN l.invalidAt ELSE hlRel.invalidAt END,
    expiredAt: CASE WHEN hlRel.expiredAt IS NULL THEN l.expiredAt ELSE hlRel.expiredAt END
  }

  RETURN 1 AS ok

  UNION

  // ---- CONNECT branch (HARD FAIL if missing) ----
  WITH o, hlRel 
  WITH o, hlRel
  WHERE hlRel.location.connect IS NOT NULL

  OPTIONAL MATCH (p:PhysicalLocation {locationId: hlRel.location.connect.locationId})
  WITH o, hlRel, p

  CALL apoc.util.validate(
    p IS NULL,
    'HAS_LOCATION connect failed: PhysicalLocation not found for locationId %s',
    [hlRel.location.connect.locationId]
  )

  MERGE (o)-[l:HAS_LOCATION]->(p)
  ON CREATE SET l.createdAt = datetime()

  SET l += {
    locationRole: CASE WHEN hlRel.locationRole IS NULL THEN l.locationRole ELSE hlRel.locationRole END,
    isPrimary: CASE WHEN hlRel.isPrimary IS NULL THEN l.isPrimary ELSE hlRel.isPrimary END,
    startDate: CASE WHEN hlRel.startDate IS NULL THEN l.startDate ELSE hlRel.startDate END,
    endDate: CASE WHEN hlRel.endDate IS NULL THEN l.endDate ELSE hlRel.endDate END,

    claimIds: CASE
      WHEN hlRel.claimIds IS NULL THEN l.claimIds
      ELSE apoc.coll.toSet(coalesce(l.claimIds, []) + coalesce(hlRel.claimIds, []))
    END,

    createdAt: CASE WHEN hlRel.createdAt IS NULL THEN l.createdAt ELSE hlRel.createdAt END,
    validAt: CASE WHEN hlRel.validAt IS NULL THEN l.validAt ELSE hlRel.validAt END,
    invalidAt: CASE WHEN hlRel.invalidAt IS NULL THEN l.invalidAt ELSE hlRel.invalidAt END,
    expiredAt: CASE WHEN hlRel.expiredAt IS NULL THEN l.expiredAt ELSE hlRel.expiredAt END
  }

  RETURN 1 AS ok
}

RETURN 1 AS ok
`;

export const organizationOwnsOrControlsCypher = `
// ==================================================================
// OWNS_OR_CONTROLS (create OR connect) (CONNECT = HARD FAIL if missing)
// ==================================================================
MATCH (o:Organization {organizationId: $organizationId})

UNWIND coalesce($ownsOrControls, []) AS ocRel
CALL {
  // ---- CREATE branch ----
  WITH o, ocRel 
  WITH o, ocRel 
  WHERE ocRel.organization.create IS NOT NULL

  MERGE (other:Organization {
    organizationId: coalesce(ocRel.organization.create.organizationId, randomUUID())
  })
  ON CREATE SET other.createdAt = datetime()

  SET other += {
    name: CASE WHEN ocRel.organization.create.name IS NULL THEN other.name ELSE ocRel.organization.create.name END,

    aliases: CASE
      WHEN ocRel.organization.create.aliases IS NULL THEN other.aliases
      ELSE apoc.coll.toSet(coalesce(other.aliases, []) + coalesce(ocRel.organization.create.aliases, []))
    END,

    orgType: CASE WHEN ocRel.organization.create.orgType IS NULL THEN other.orgType ELSE ocRel.organization.create.orgType END,
    description: CASE WHEN ocRel.organization.create.description IS NULL THEN other.description ELSE ocRel.organization.create.description END,
    businessModel: CASE WHEN ocRel.organization.create.businessModel IS NULL THEN other.businessModel ELSE ocRel.organization.create.businessModel END,

    primaryIndustryTags: CASE
      WHEN ocRel.organization.create.primaryIndustryTags IS NULL THEN other.primaryIndustryTags
      ELSE apoc.coll.toSet(coalesce(other.primaryIndustryTags, []) + coalesce(ocRel.organization.create.primaryIndustryTags, []))
    END,
    regionsServed: CASE
      WHEN ocRel.organization.create.regionsServed IS NULL THEN other.regionsServed
      ELSE apoc.coll.toSet(coalesce(other.regionsServed, []) + coalesce(ocRel.organization.create.regionsServed, []))
    END,

    legalName: CASE WHEN ocRel.organization.create.legalName IS NULL THEN other.legalName ELSE ocRel.organization.create.legalName END,
    legalStructure: CASE WHEN ocRel.organization.create.legalStructure IS NULL THEN other.legalStructure ELSE ocRel.organization.create.legalStructure END,
    ownershipType: CASE WHEN ocRel.organization.create.ownershipType IS NULL THEN other.ownershipType ELSE ocRel.organization.create.ownershipType END,

    jurisdictionsOfIncorporation: CASE
      WHEN ocRel.organization.create.jurisdictionsOfIncorporation IS NULL THEN other.jurisdictionsOfIncorporation
      ELSE apoc.coll.toSet(coalesce(other.jurisdictionsOfIncorporation, []) + coalesce(ocRel.organization.create.jurisdictionsOfIncorporation, []))
    END,

    websiteUrl: CASE WHEN ocRel.organization.create.websiteUrl IS NULL THEN other.websiteUrl ELSE ocRel.organization.create.websiteUrl END,

    defaultCollectionModes: CASE
      WHEN ocRel.organization.create.defaultCollectionModes IS NULL THEN other.defaultCollectionModes
      ELSE apoc.coll.toSet(coalesce(other.defaultCollectionModes, []) + coalesce(ocRel.organization.create.defaultCollectionModes, []))
    END,
    defaultRegionsAvailable: CASE
      WHEN ocRel.organization.create.defaultRegionsAvailable IS NULL THEN other.defaultRegionsAvailable
      ELSE apoc.coll.toSet(coalesce(other.defaultRegionsAvailable, []) + coalesce(ocRel.organization.create.defaultRegionsAvailable, []))
    END
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

    claimIds: CASE
      WHEN ocRel.claimIds IS NULL THEN r.claimIds
      ELSE apoc.coll.toSet(coalesce(r.claimIds, []) + coalesce(ocRel.claimIds, []))
    END,

    createdAt: CASE WHEN ocRel.createdAt IS NULL THEN r.createdAt ELSE ocRel.createdAt END,
    validAt: CASE WHEN ocRel.validAt IS NULL THEN r.validAt ELSE ocRel.validAt END,
    invalidAt: CASE WHEN ocRel.invalidAt IS NULL THEN r.invalidAt ELSE ocRel.invalidAt END,
    expiredAt: CASE WHEN ocRel.expiredAt IS NULL THEN r.expiredAt ELSE ocRel.expiredAt END
  }

  RETURN 1 AS ok

  UNION

  // ---- CONNECT branch (HARD FAIL if missing) ----
  WITH o, ocRel 
  WITH o, ocRel 
  WHERE ocRel.organization.connect IS NOT NULL

  OPTIONAL MATCH (other:Organization {organizationId: ocRel.organization.connect.organizationId})
  WITH o, ocRel, other

  CALL apoc.util.validate(
    other IS NULL,
    'OWNS_OR_CONTROLS connect failed: Organization not found for organizationId %s',
    [ocRel.organization.connect.organizationId]
  )

  MERGE (o)-[r:OWNS_OR_CONTROLS]->(other)
  ON CREATE SET r.createdAt = datetime()

  SET r += {
    relationshipType: CASE WHEN ocRel.relationshipType IS NULL THEN r.relationshipType ELSE ocRel.relationshipType END,
    ownershipPercent: CASE WHEN ocRel.ownershipPercent IS NULL THEN r.ownershipPercent ELSE ocRel.ownershipPercent END,
    controlType: CASE WHEN ocRel.controlType IS NULL THEN r.controlType ELSE ocRel.controlType END,
    effectiveFrom: CASE WHEN ocRel.effectiveFrom IS NULL THEN r.effectiveFrom ELSE ocRel.effectiveFrom END,
    effectiveTo: CASE WHEN ocRel.effectiveTo IS NULL THEN r.effectiveTo ELSE ocRel.effectiveTo END,
    isCurrent: CASE WHEN ocRel.isCurrent IS NULL THEN r.isCurrent ELSE ocRel.isCurrent END,

    claimIds: CASE
      WHEN ocRel.claimIds IS NULL THEN r.claimIds
      ELSE apoc.coll.toSet(coalesce(r.claimIds, []) + coalesce(ocRel.claimIds, []))
    END,

    createdAt: CASE WHEN ocRel.createdAt IS NULL THEN r.createdAt ELSE ocRel.createdAt END,
    validAt: CASE WHEN ocRel.validAt IS NULL THEN r.validAt ELSE ocRel.validAt END,
    invalidAt: CASE WHEN ocRel.invalidAt IS NULL THEN r.invalidAt ELSE ocRel.invalidAt END,
    expiredAt: CASE WHEN ocRel.expiredAt IS NULL THEN r.expiredAt ELSE ocRel.expiredAt END
  }

  RETURN 1 AS ok
}

RETURN 1 AS ok
`;

export const organizationListsCypher = `
// ==================================================================
// LISTS (create OR connect) (CONNECT = HARD FAIL if missing)
// ==================================================================
MATCH (o:Organization {organizationId: $organizationId})

UNWIND coalesce($lists, []) AS listRel
CALL {
  // ---- CREATE branch ----
  WITH o, listRel 
  WITH o, listRel 
  WHERE listRel.listing.create IS NOT NULL

  MERGE (lst:Listing { listingId: coalesce(listRel.listing.create.listingId, randomUUID()) })
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

    regionsAvailable: CASE
      WHEN listRel.listing.create.regionsAvailable IS NULL THEN lst.regionsAvailable
      ELSE apoc.coll.toSet(coalesce(lst.regionsAvailable, []) + coalesce(listRel.listing.create.regionsAvailable, []))
    END,

    requiresAppointment: CASE WHEN listRel.listing.create.requiresAppointment IS NULL THEN lst.requiresAppointment ELSE listRel.listing.create.requiresAppointment END,
    collectionMode: CASE WHEN listRel.listing.create.collectionMode IS NULL THEN lst.collectionMode ELSE listRel.listing.create.collectionMode END,
    turnaroundTime: CASE WHEN listRel.listing.create.turnaroundTime IS NULL THEN lst.turnaroundTime ELSE listRel.listing.create.turnaroundTime END
  }

  MERGE (o)-[r:LISTS]->(lst)
  ON CREATE SET r.createdAt = datetime()

  SET r += {
    listRole: CASE WHEN listRel.listRole IS NULL THEN r.listRole ELSE listRel.listRole END,
    channel: CASE WHEN listRel.channel IS NULL THEN r.channel ELSE listRel.channel END,

    regionsOverrides: CASE
      WHEN listRel.regionsOverrides IS NULL THEN r.regionsOverrides
      ELSE apoc.coll.toSet(coalesce(r.regionsOverrides, []) + coalesce(listRel.regionsOverrides, []))
    END,
    collectionModesOverrides: CASE
      WHEN listRel.collectionModesOverrides IS NULL THEN r.collectionModesOverrides
      ELSE apoc.coll.toSet(coalesce(r.collectionModesOverrides, []) + coalesce(listRel.collectionModesOverrides, []))
    END,

    availabilityNotes: CASE WHEN listRel.availabilityNotes IS NULL THEN r.availabilityNotes ELSE listRel.availabilityNotes END,

    claimIds: CASE
      WHEN listRel.claimIds IS NULL THEN r.claimIds
      ELSE apoc.coll.toSet(coalesce(r.claimIds, []) + coalesce(listRel.claimIds, []))
    END,

    createdAt: CASE WHEN listRel.createdAt IS NULL THEN r.createdAt ELSE listRel.createdAt END,
    validAt: CASE WHEN listRel.validAt IS NULL THEN r.validAt ELSE listRel.validAt END,
    invalidAt: CASE WHEN listRel.invalidAt IS NULL THEN r.invalidAt ELSE listRel.invalidAt END,
    expiredAt: CASE WHEN listRel.expiredAt IS NULL THEN r.expiredAt ELSE listRel.expiredAt END
  }

  RETURN 1 AS ok

  UNION

  // ---- CONNECT branch (HARD FAIL if missing) ----
  WITH o, listRel 
  WITH o, listRel 
  WHERE listRel.listing.connect IS NOT NULL

  OPTIONAL MATCH (lst:Listing {listingId: listRel.listing.connect.listingId})
  WITH o, listRel, lst

  CALL apoc.util.validate(
    lst IS NULL,
    'LISTS connect failed: Listing not found for listingId %s',
    [listRel.listing.connect.listingId]
  )

  MERGE (o)-[r:LISTS]->(lst)
  ON CREATE SET r.createdAt = datetime()

  SET r += {
    listRole: CASE WHEN listRel.listRole IS NULL THEN r.listRole ELSE listRel.listRole END,
    channel: CASE WHEN listRel.channel IS NULL THEN r.channel ELSE listRel.channel END,

    regionsOverrides: CASE
      WHEN listRel.regionsOverrides IS NULL THEN r.regionsOverrides
      ELSE apoc.coll.toSet(coalesce(r.regionsOverrides, []) + coalesce(listRel.regionsOverrides, []))
    END,
    collectionModesOverrides: CASE
      WHEN listRel.collectionModesOverrides IS NULL THEN r.collectionModesOverrides
      ELSE apoc.coll.toSet(coalesce(r.collectionModesOverrides, []) + coalesce(listRel.collectionModesOverrides, []))
    END,

    availabilityNotes: CASE WHEN listRel.availabilityNotes IS NULL THEN r.availabilityNotes ELSE listRel.availabilityNotes END,

    claimIds: CASE
      WHEN listRel.claimIds IS NULL THEN r.claimIds
      ELSE apoc.coll.toSet(coalesce(r.claimIds, []) + coalesce(listRel.claimIds, []))
    END,

    createdAt: CASE WHEN listRel.createdAt IS NULL THEN r.createdAt ELSE listRel.createdAt END,
    validAt: CASE WHEN listRel.validAt IS NULL THEN r.validAt ELSE listRel.validAt END,
    invalidAt: CASE WHEN listRel.invalidAt IS NULL THEN r.invalidAt ELSE listRel.invalidAt END,
    expiredAt: CASE WHEN listRel.expiredAt IS NULL THEN r.expiredAt ELSE listRel.expiredAt END
  }

  RETURN 1 AS ok
}

RETURN 1 AS ok
`;

export const organizationOffersProductCypher = `
// ==================================================================
// OFFERS_PRODUCT (create OR connect) (CONNECT = HARD FAIL if missing)
// ==================================================================
MATCH (o:Organization {organizationId: $organizationId})

UNWIND coalesce($offersProduct, []) AS prodRel
CALL {
  // ---- CREATE branch ----
  WITH o, prodRel 
  WITH o, prodRel  
  WHERE prodRel.product.create IS NOT NULL

  MERGE (p:Product { productId: coalesce(prodRel.product.create.productId, randomUUID()) })
  ON CREATE SET p.createdAt = datetime()

  SET p += {
    name: CASE WHEN prodRel.product.create.name IS NULL THEN p.name ELSE prodRel.product.create.name END,
    synonyms: CASE
      WHEN prodRel.product.create.synonyms IS NULL THEN p.synonyms
      ELSE apoc.coll.toSet(coalesce(p.synonyms, []) + coalesce(prodRel.product.create.synonyms, []))
    END,
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
    createdAt: CASE WHEN prodRel.createdAt IS NULL THEN r.createdAt ELSE prodRel.createdAt END,
    validAt: CASE WHEN prodRel.validAt IS NULL THEN r.validAt ELSE prodRel.validAt END,
    invalidAt: CASE WHEN prodRel.invalidAt IS NULL THEN r.invalidAt ELSE prodRel.invalidAt END,
    expiredAt: CASE WHEN prodRel.expiredAt IS NULL THEN r.expiredAt ELSE prodRel.expiredAt END
  }

  RETURN 1 AS ok

  UNION

  // ---- CONNECT branch (HARD FAIL if missing) ----
  WITH o, prodRel  
  WITH o, prodRel  
  WHERE prodRel.product.connect IS NOT NULL

  OPTIONAL MATCH (p:Product {productId: prodRel.product.connect.productId})
  WITH o, prodRel, p

  CALL apoc.util.validate(
    p IS NULL,
    'OFFERS_PRODUCT connect failed: Product not found for productId %s',
    [prodRel.product.connect.productId]
  )

  MERGE (o)-[r:OFFERS_PRODUCT]->(p)
  ON CREATE SET r.createdAt = datetime()

  SET r += {
    createdAt: CASE WHEN prodRel.createdAt IS NULL THEN r.createdAt ELSE prodRel.createdAt END,
    validAt: CASE WHEN prodRel.validAt IS NULL THEN r.validAt ELSE prodRel.validAt END,
    invalidAt: CASE WHEN prodRel.invalidAt IS NULL THEN r.invalidAt ELSE prodRel.invalidAt END,
    expiredAt: CASE WHEN prodRel.expiredAt IS NULL THEN r.expiredAt ELSE prodRel.expiredAt END
  }

  RETURN 1 AS ok
}

RETURN 1 AS ok
`;

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

export const organizationDevelopsPlatformCypher = `
// ==================================================================
// DEVELOPS_PLATFORM (create OR connect)
// (CONNECT = HARD FAIL if missing)
// ==================================================================
MATCH (o:Organization {organizationId: $organizationId})

UNWIND coalesce($developsPlatform, []) AS dpRel
CALL {
  // ---- CREATE branch ----
  WITH o, dpRel  
  WITH o, dpRel  
  WHERE dpRel.technologyPlatform.create IS NOT NULL

  MERGE (tp:TechnologyPlatform {
    platformId: coalesce(dpRel.technologyPlatform.create.platformId, randomUUID())
  })
  ON CREATE SET tp.createdAt = datetime()

  SET tp += {
    canonicalName: CASE WHEN dpRel.technologyPlatform.create.canonicalName IS NULL THEN tp.canonicalName ELSE dpRel.technologyPlatform.create.canonicalName END,
    aliases: CASE
      WHEN dpRel.technologyPlatform.create.aliases IS NULL THEN tp.aliases
      ELSE apoc.coll.toSet(coalesce(tp.aliases, []) + coalesce(dpRel.technologyPlatform.create.aliases, []))
    END,
    platformType: CASE WHEN dpRel.technologyPlatform.create.platformType IS NULL THEN tp.platformType ELSE dpRel.technologyPlatform.create.platformType END,
    description: CASE WHEN dpRel.technologyPlatform.create.description IS NULL THEN tp.description ELSE dpRel.technologyPlatform.create.description END
  }

  MERGE (o)-[r:DEVELOPS_PLATFORM]->(tp)
  ON CREATE SET r.createdAt = datetime()

  SET r += {
    relationshipRole: CASE WHEN dpRel.relationshipRole IS NULL THEN r.relationshipRole ELSE dpRel.relationshipRole END,
    notes: CASE WHEN dpRel.notes IS NULL THEN r.notes ELSE dpRel.notes END,
    source: CASE WHEN dpRel.source IS NULL THEN r.source ELSE dpRel.source END,
    claimIds: CASE
      WHEN dpRel.claimIds IS NULL THEN r.claimIds
      ELSE apoc.coll.toSet(coalesce(r.claimIds, []) + coalesce(dpRel.claimIds, []))
    END,
    createdAt: CASE WHEN dpRel.createdAt IS NULL THEN r.createdAt ELSE dpRel.createdAt END,
    validAt: CASE WHEN dpRel.validAt IS NULL THEN r.validAt ELSE dpRel.validAt END,
    invalidAt: CASE WHEN dpRel.invalidAt IS NULL THEN r.invalidAt ELSE dpRel.invalidAt END,
    expiredAt: CASE WHEN dpRel.expiredAt IS NULL THEN r.expiredAt ELSE dpRel.expiredAt END
  }

  RETURN 1 AS ok

  UNION

  // ---- CONNECT branch (HARD FAIL if missing) ----
  WITH o, dpRel  
  WITH o, dpRel  
  WHERE dpRel.technologyPlatform.connect IS NOT NULL

  OPTIONAL MATCH (tp:TechnologyPlatform {platformId: dpRel.technologyPlatform.connect.platformId})
  WITH o, dpRel, tp

  CALL apoc.util.validate(
    tp IS NULL,
    'DEVELOPS_PLATFORM connect failed: TechnologyPlatform not found for platformId %s',
    [dpRel.technologyPlatform.connect.platformId]
  )

  MERGE (o)-[r:DEVELOPS_PLATFORM]->(tp)
  ON CREATE SET r.createdAt = datetime()

  SET r += {
    relationshipRole: CASE WHEN dpRel.relationshipRole IS NULL THEN r.relationshipRole ELSE dpRel.relationshipRole END,
    notes: CASE WHEN dpRel.notes IS NULL THEN r.notes ELSE dpRel.notes END,
    source: CASE WHEN dpRel.source IS NULL THEN r.source ELSE dpRel.source END,
    claimIds: CASE
      WHEN dpRel.claimIds IS NULL THEN r.claimIds
      ELSE apoc.coll.toSet(coalesce(r.claimIds, []) + coalesce(dpRel.claimIds, []))
    END,
    createdAt: CASE WHEN dpRel.createdAt IS NULL THEN r.createdAt ELSE dpRel.createdAt END,
    validAt: CASE WHEN dpRel.validAt IS NULL THEN r.validAt ELSE dpRel.validAt END,
    invalidAt: CASE WHEN dpRel.invalidAt IS NULL THEN r.invalidAt ELSE dpRel.invalidAt END,
    expiredAt: CASE WHEN dpRel.expiredAt IS NULL THEN r.expiredAt ELSE dpRel.expiredAt END
  }

  RETURN 1 AS ok
}

RETURN 1 AS ok
`;

export const organizationUsesPlatformCypher = `
// ==================================================================
// USES_PLATFORM (create OR connect)
// (CONNECT = HARD FAIL if missing)
// ==================================================================
MATCH (o:Organization {organizationId: $organizationId})

UNWIND coalesce($usesPlatform, []) AS upRel
CALL {
  // ---- CREATE branch ----
  WITH o, upRel  
  WITH o, upRel  
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
    description: CASE WHEN upRel.technologyPlatform.create.description IS NULL THEN tp.description ELSE upRel.technologyPlatform.create.description END
  }

  MERGE (o)-[r:USES_PLATFORM]->(tp)
  ON CREATE SET r.createdAt = datetime()

  SET r += {
    usageContext: CASE WHEN upRel.usageContext IS NULL THEN r.usageContext ELSE upRel.usageContext END,
    isPrimary: CASE WHEN upRel.isPrimary IS NULL THEN r.isPrimary ELSE upRel.isPrimary END,
    notes: CASE WHEN upRel.notes IS NULL THEN r.notes ELSE upRel.notes END,
    source: CASE WHEN upRel.source IS NULL THEN r.source ELSE upRel.source END,
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
  WITH o, upRel  
  WITH o, upRel  
  WHERE upRel.technologyPlatform.connect IS NOT NULL

  OPTIONAL MATCH (tp:TechnologyPlatform {platformId: upRel.technologyPlatform.connect.platformId})
  WITH o, upRel, tp

  CALL apoc.util.validate(
    tp IS NULL,
    'USES_PLATFORM connect failed: TechnologyPlatform not found for platformId %s',
    [upRel.technologyPlatform.connect.platformId]
  )

  MERGE (o)-[r:USES_PLATFORM]->(tp)
  ON CREATE SET r.createdAt = datetime()

  SET r += {
    usageContext: CASE WHEN upRel.usageContext IS NULL THEN r.usageContext ELSE upRel.usageContext END,
    isPrimary: CASE WHEN upRel.isPrimary IS NULL THEN r.isPrimary ELSE upRel.isPrimary END,
    notes: CASE WHEN upRel.notes IS NULL THEN r.notes ELSE upRel.notes END,
    source: CASE WHEN upRel.source IS NULL THEN r.source ELSE upRel.source END,
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

export const returnOrganizationsCypher = `
MATCH (o:Organization {organizationId: $organizationId})
RETURN o
`;

export const createOrganizationStatements = {
  buildOrgUpsertCypher,
  organizationHasLocationCypher,
  organizationOwnsOrControlsCypher,
  organizationListsCypher,
  organizationOffersProductCypher,
  organizationSuppliesCompoundFormCypher,
  organizationManufacturesCompoundFormCypher,
  organizationManufacturesProductCypher,
  organizationContractManufacturerForOrganizationCypher,
  organizationContractManufacturerForProductCypher,
  organizationContractManufacturerForCompoundFormCypher,
  organizationPerformsManufacturingProcessCypher,
  organizationDevelopsPlatformCypher,
  organizationUsesPlatformCypher,
  returnOrganizationsCypher,
};
