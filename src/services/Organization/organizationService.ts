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
  UpdateOrganizationInput,
  UpdateOrganizationInputSchema,
} from "../../graphql/inputs/OrganizationInputs.js";
import { Organization } from "../../graphql/types/OrganizationModel.js";

const HAS_LOCATION_RELATIONSHIP_LABEL = "HAS_LOCATION";
const OWNS_OR_CONTROLS_RELATIONSHIP_LABEL = "OWNS_OR_CONTROLS";
const LIST_RELATIONSHIP_LABEL = "LIST";
const OFFERS_PRODUCT_RELATIONSHIP_LABEL = "OFFERS_PRODUCT";
const SUPPLIES_COMPOUND_FORM_RELATIONSHIP_LABEL = "SUPPLIES_COMPOUND_FORM";

export async function updateOrganizationWithOptionalRelations(
  input: UpdateOrganizationInput
): Promise<Organization> {
  const validated = validateInput(
    UpdateOrganizationInputSchema,
    input,
    "UpdateOrganizationInputWithOptionalRelations"
  );

  // Keep params as primitives/arrays; each tx.run block plucks what it needs.
  const params = {
    organizationId: validated.organizationId,

    // node fields
    name: validated.name ?? null,
    aliases: validated.aliases ?? null,
    orgType: validated.orgType ?? null,
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

    // relation arrays (we only run a block if array.length)
    hasLocation: validated.hasLocation ?? [],
    ownsOrControls: validated.ownsOrControls ?? [],
    lists: validated.lists ?? [],
    offersProduct: validated.offersProduct ?? [],
    suppliesCompoundForm: validated.suppliesCompoundForm ?? [],
    manufactures: validated.manufactures ?? [],
    manufacturesProduct: validated.manufacturesProduct ?? [],
    contractManufacturerForOrganization:
      validated.contractManufacturerForOrganization ?? [],
  };

  try {
    const organization = await executeWrite(async (tx) => {
      // ------------------------------------------------------------
      // 0) Ensure org exists + update its scalar fields
      // ------------------------------------------------------------
      {
        const res = await tx.run(
          `
OPTIONAL MATCH (o:Organization {organizationId: $organizationId})
CALL apoc.util.validate(
  o IS NULL,
  'updateOrganization failed: Organization not found for organizationId %s',
  [$organizationId]
)
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
          `,
          params
        );

        const record = firstRecordOrNull(res);
        if (!record) throw new Error("updateOrganization: no record returned");
      }

      // ------------------------------------------------------------
      // 1) HAS_LOCATION (create / connect / update) — strict semantics
      // ------------------------------------------------------------
      if (params.hasLocation.length) {
        await tx.run(
          `
MATCH (o:Organization {organizationId: $organizationId})
UNWIND $hasLocation AS rel
CALL {
  // ---------------- CREATE ----------------
  WITH o, rel
  WITH o, rel WHERE rel.location.create IS NOT NULL

  MERGE (p:PhysicalLocation { locationId: coalesce(rel.location.create.locationId, randomUUID()) })
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
    placeTags: CASE
      WHEN rel.location.create.placeTags IS NULL THEN p.placeTags
      ELSE apoc.coll.toSet(coalesce(p.placeTags, []) + coalesce(rel.location.create.placeTags, []))
    END,
    hoursOfOperation: CASE WHEN rel.location.create.hoursOfOperation IS NULL THEN p.hoursOfOperation ELSE rel.location.create.hoursOfOperation END,
    contactPhone: CASE WHEN rel.location.create.contactPhone IS NULL THEN p.contactPhone ELSE rel.location.create.contactPhone END,
    contactEmail: CASE WHEN rel.location.create.contactEmail IS NULL THEN p.contactEmail ELSE rel.location.create.contactEmail END
  }

  MERGE (o)-[r:HAS_LOCATION]->(p)
  ON CREATE SET r.createdAt = datetime()

  SET r += {
    locationRole: CASE WHEN rel.locationRole IS NULL THEN r.locationRole ELSE rel.locationRole END,
    isPrimary: CASE WHEN rel.isPrimary IS NULL THEN r.isPrimary ELSE rel.isPrimary END,
    startDate: CASE WHEN rel.startDate IS NULL THEN r.startDate ELSE rel.startDate END,
    endDate: CASE WHEN rel.endDate IS NULL THEN r.endDate ELSE rel.endDate END,
    claimIds: CASE
      WHEN rel.claimIds IS NULL THEN r.claimIds
      ELSE apoc.coll.toSet(coalesce(r.claimIds, []) + coalesce(rel.claimIds, []))
    END,
    createdAt: CASE WHEN rel.createdAt IS NULL THEN r.createdAt ELSE rel.createdAt END,
    validAt: CASE WHEN rel.validAt IS NULL THEN r.validAt ELSE rel.validAt END,
    invalidAt: CASE WHEN rel.invalidAt IS NULL THEN r.invalidAt ELSE rel.invalidAt END,
    expiredAt: CASE WHEN rel.expiredAt IS NULL THEN r.expiredAt ELSE rel.expiredAt END
  }

  RETURN 1 AS okHL

  UNION

  // ---------------- CONNECT (strict: target must exist) ----------------
  WITH o, rel
  WITH o, rel WHERE rel.location.connect IS NOT NULL

  OPTIONAL MATCH (p2:PhysicalLocation {locationId: rel.location.connect.locationId})
  CALL apoc.util.validate(
    p2 IS NULL,
    'HAS_LOCATION connect failed: PhysicalLocation not found for locationId %s',
    [rel.location.connect.locationId]
  )

  MERGE (o)-[r2:HAS_LOCATION]->(p2)
  ON CREATE SET r2.createdAt = datetime()

  SET r2 += {
    locationRole: CASE WHEN rel.locationRole IS NULL THEN r2.locationRole ELSE rel.locationRole END,
    isPrimary: CASE WHEN rel.isPrimary IS NULL THEN r2.isPrimary ELSE rel.isPrimary END,
    startDate: CASE WHEN rel.startDate IS NULL THEN r2.startDate ELSE rel.startDate END,
    endDate: CASE WHEN rel.endDate IS NULL THEN r2.endDate ELSE rel.endDate END,
    claimIds: CASE
      WHEN rel.claimIds IS NULL THEN r2.claimIds
      ELSE apoc.coll.toSet(coalesce(r2.claimIds, []) + coalesce(rel.claimIds, []))
    END,
    createdAt: CASE WHEN rel.createdAt IS NULL THEN r2.createdAt ELSE rel.createdAt END,
    validAt: CASE WHEN rel.validAt IS NULL THEN r2.validAt ELSE rel.validAt END,
    invalidAt: CASE WHEN rel.invalidAt IS NULL THEN r2.invalidAt ELSE rel.invalidAt END,
    expiredAt: CASE WHEN rel.expiredAt IS NULL THEN r2.expiredAt ELSE rel.expiredAt END
  }

  RETURN 1 AS okHL

  UNION

  // ---------------- UPDATE (strict: node + relationship must exist) ----------------
  WITH o, rel
  WITH o, rel WHERE rel.location.update IS NOT NULL

  CALL apoc.util.validate(
    rel.location.update.locationId IS NULL,
    'HAS_LOCATION update failed: location.update.locationId is required',
    []
  )

  OPTIONAL MATCH (p3:PhysicalLocation {locationId: rel.location.update.locationId})
  OPTIONAL MATCH (o)-[r3:HAS_LOCATION]->(p3)

  CALL apoc.util.validate(
    p3 IS NULL,
    'HAS_LOCATION update failed: PhysicalLocation not found for locationId %s',
    [rel.location.update.locationId]
  )
  CALL apoc.util.validate(
    r3 IS NULL,
    'HAS_LOCATION update failed: HAS_LOCATION relationship not found for org %s -> location %s',
    [$organizationId, rel.location.update.locationId]
  )

  SET p3 += {
    canonicalName: CASE WHEN rel.location.update.canonicalName IS NULL THEN p3.canonicalName ELSE rel.location.update.canonicalName END,
    locationType: CASE WHEN rel.location.update.locationType IS NULL THEN p3.locationType ELSE rel.location.update.locationType END,
    addressLine1: CASE WHEN rel.location.update.addressLine1 IS NULL THEN p3.addressLine1 ELSE rel.location.update.addressLine1 END,
    addressLine2: CASE WHEN rel.location.update.addressLine2 IS NULL THEN p3.addressLine2 ELSE rel.location.update.addressLine2 END,
    city: CASE WHEN rel.location.update.city IS NULL THEN p3.city ELSE rel.location.update.city END,
    region: CASE WHEN rel.location.update.region IS NULL THEN p3.region ELSE rel.location.update.region END,
    postalCode: CASE WHEN rel.location.update.postalCode IS NULL THEN p3.postalCode ELSE rel.location.update.postalCode END,
    countryCode: CASE WHEN rel.location.update.countryCode IS NULL THEN p3.countryCode ELSE rel.location.update.countryCode END,
    geoLat: CASE WHEN rel.location.update.geoLat IS NULL THEN p3.geoLat ELSE rel.location.update.geoLat END,
    geoLon: CASE WHEN rel.location.update.geoLon IS NULL THEN p3.geoLon ELSE rel.location.update.geoLon END,
    timezone: CASE WHEN rel.location.update.timezone IS NULL THEN p3.timezone ELSE rel.location.update.timezone END,
    jurisdiction: CASE WHEN rel.location.update.jurisdiction IS NULL THEN p3.jurisdiction ELSE rel.location.update.jurisdiction END,
    placeTags: CASE
      WHEN rel.location.update.placeTags IS NULL THEN p3.placeTags
      ELSE apoc.coll.toSet(coalesce(p3.placeTags, []) + coalesce(rel.location.update.placeTags, []))
    END,
    hoursOfOperation: CASE WHEN rel.location.update.hoursOfOperation IS NULL THEN p3.hoursOfOperation ELSE rel.location.update.hoursOfOperation END,
    contactPhone: CASE WHEN rel.location.update.contactPhone IS NULL THEN p3.contactPhone ELSE rel.location.update.contactPhone END,
    contactEmail: CASE WHEN rel.location.update.contactEmail IS NULL THEN p3.contactEmail ELSE rel.location.update.contactEmail END
  }

  SET r3 += {
    locationRole: CASE WHEN rel.locationRole IS NULL THEN r3.locationRole ELSE rel.locationRole END,
    isPrimary: CASE WHEN rel.isPrimary IS NULL THEN r3.isPrimary ELSE rel.isPrimary END,
    startDate: CASE WHEN rel.startDate IS NULL THEN r3.startDate ELSE rel.startDate END,
    endDate: CASE WHEN rel.endDate IS NULL THEN r3.endDate ELSE rel.endDate END,
    claimIds: CASE
      WHEN rel.claimIds IS NULL THEN r3.claimIds
      ELSE apoc.coll.toSet(coalesce(r3.claimIds, []) + coalesce(rel.claimIds, []))
    END,
    createdAt: CASE WHEN rel.createdAt IS NULL THEN r3.createdAt ELSE rel.createdAt END,
    validAt: CASE WHEN rel.validAt IS NULL THEN r3.validAt ELSE rel.validAt END,
    invalidAt: CASE WHEN rel.invalidAt IS NULL THEN r3.invalidAt ELSE rel.invalidAt END,
    expiredAt: CASE WHEN rel.expiredAt IS NULL THEN r3.expiredAt ELSE rel.expiredAt END
  }

  RETURN 1 AS okHL
}
RETURN count(*) AS _hasLocationProcessed
          `,
          params
        );
      }

      // ------------------------------------------------------------
      // 2) OWNS_OR_CONTROLS (create / connect / update strict)
      // ------------------------------------------------------------
      if (params.ownsOrControls.length) {
        await tx.run(
          `
MATCH (o:Organization {organizationId: $organizationId})
UNWIND $ownsOrControls AS rel
CALL {
  // ---------------- CREATE ----------------
  WITH o, rel
  WITH o, rel WHERE rel.organization.create IS NOT NULL

  MERGE (other:Organization {organizationId: coalesce(rel.organization.create.organizationId, randomUUID())})
  ON CREATE SET other.createdAt = datetime()

  SET other += {
    name: CASE WHEN rel.organization.create.name IS NULL THEN other.name ELSE rel.organization.create.name END,
    aliases: CASE
      WHEN rel.organization.create.aliases IS NULL THEN other.aliases
      ELSE apoc.coll.toSet(coalesce(other.aliases, []) + coalesce(rel.organization.create.aliases, []))
    END,
    orgType: CASE WHEN rel.organization.create.orgType IS NULL THEN other.orgType ELSE rel.organization.create.orgType END,
    description: CASE WHEN rel.organization.create.description IS NULL THEN other.description ELSE rel.organization.create.description END,
    businessModel: CASE WHEN rel.organization.create.businessModel IS NULL THEN other.businessModel ELSE rel.organization.create.businessModel END,
    primaryIndustryTags: CASE
      WHEN rel.organization.create.primaryIndustryTags IS NULL THEN other.primaryIndustryTags
      ELSE apoc.coll.toSet(coalesce(other.primaryIndustryTags, []) + coalesce(rel.organization.create.primaryIndustryTags, []))
    END,
    regionsServed: CASE
      WHEN rel.organization.create.regionsServed IS NULL THEN other.regionsServed
      ELSE apoc.coll.toSet(coalesce(other.regionsServed, []) + coalesce(rel.organization.create.regionsServed, []))
    END,
    legalName: CASE WHEN rel.organization.create.legalName IS NULL THEN other.legalName ELSE rel.organization.create.legalName END,
    legalStructure: CASE WHEN rel.organization.create.legalStructure IS NULL THEN other.legalStructure ELSE rel.organization.create.legalStructure END,
    ownershipType: CASE WHEN rel.organization.create.ownershipType IS NULL THEN other.ownershipType ELSE rel.organization.create.ownershipType END,
    jurisdictionsOfIncorporation: CASE
      WHEN rel.organization.create.jurisdictionsOfIncorporation IS NULL THEN other.jurisdictionsOfIncorporation
      ELSE apoc.coll.toSet(coalesce(other.jurisdictionsOfIncorporation, []) + coalesce(rel.organization.create.jurisdictionsOfIncorporation, []))
    END,
    websiteUrl: CASE WHEN rel.organization.create.websiteUrl IS NULL THEN other.websiteUrl ELSE rel.organization.create.websiteUrl END,
    defaultCollectionModes: CASE
      WHEN rel.organization.create.defaultCollectionModes IS NULL THEN other.defaultCollectionModes
      ELSE apoc.coll.toSet(coalesce(other.defaultCollectionModes, []) + coalesce(rel.organization.create.defaultCollectionModes, []))
    END,
    defaultRegionsAvailable: CASE
      WHEN rel.organization.create.defaultRegionsAvailable IS NULL THEN other.defaultRegionsAvailable
      ELSE apoc.coll.toSet(coalesce(other.defaultRegionsAvailable, []) + coalesce(rel.organization.create.defaultRegionsAvailable, []))
    END
  }

  MERGE (o)-[r:OWNS_OR_CONTROLS]->(other)
  ON CREATE SET r.createdAt = datetime()

  SET r += {
    relationshipType: CASE WHEN rel.relationshipType IS NULL THEN r.relationshipType ELSE rel.relationshipType END,
    ownershipPercent: CASE WHEN rel.ownershipPercent IS NULL THEN r.ownershipPercent ELSE rel.ownershipPercent END,
    controlType: CASE WHEN rel.controlType IS NULL THEN r.controlType ELSE rel.controlType END,
    effectiveFrom: CASE WHEN rel.effectiveFrom IS NULL THEN r.effectiveFrom ELSE rel.effectiveFrom END,
    effectiveTo: CASE WHEN rel.effectiveTo IS NULL THEN r.effectiveTo ELSE rel.effectiveTo END,
    isCurrent: CASE WHEN rel.isCurrent IS NULL THEN r.isCurrent ELSE rel.isCurrent END,
    claimIds: CASE
      WHEN rel.claimIds IS NULL THEN r.claimIds
      ELSE apoc.coll.toSet(coalesce(r.claimIds, []) + coalesce(rel.claimIds, []))
    END,
    createdAt: CASE WHEN rel.createdAt IS NULL THEN r.createdAt ELSE rel.createdAt END,
    validAt: CASE WHEN rel.validAt IS NULL THEN r.validAt ELSE rel.validAt END,
    invalidAt: CASE WHEN rel.invalidAt IS NULL THEN r.invalidAt ELSE rel.invalidAt END,
    expiredAt: CASE WHEN rel.expiredAt IS NULL THEN r.expiredAt ELSE rel.expiredAt END
  }

  RETURN 1 AS okOC

  UNION

  // ---------------- CONNECT (strict) ----------------
  WITH o, rel
  WITH o, rel WHERE rel.organization.connect IS NOT NULL

  OPTIONAL MATCH (other2:Organization {organizationId: rel.organization.connect.organizationId})
  CALL apoc.util.validate(
    other2 IS NULL,
    'OWNS_OR_CONTROLS connect failed: Organization not found for organizationId %s',
    [rel.organization.connect.organizationId]
  )

  MERGE (o)-[r2:OWNS_OR_CONTROLS]->(other2)
  ON CREATE SET r2.createdAt = datetime()

  SET r2 += {
    relationshipType: CASE WHEN rel.relationshipType IS NULL THEN r2.relationshipType ELSE rel.relationshipType END,
    ownershipPercent: CASE WHEN rel.ownershipPercent IS NULL THEN r2.ownershipPercent ELSE rel.ownershipPercent END,
    controlType: CASE WHEN rel.controlType IS NULL THEN r2.controlType ELSE rel.controlType END,
    effectiveFrom: CASE WHEN rel.effectiveFrom IS NULL THEN r2.effectiveFrom ELSE rel.effectiveFrom END,
    effectiveTo: CASE WHEN rel.effectiveTo IS NULL THEN r2.effectiveTo ELSE rel.effectiveTo END,
    isCurrent: CASE WHEN rel.isCurrent IS NULL THEN r2.isCurrent ELSE rel.isCurrent END,
    claimIds: CASE
      WHEN rel.claimIds IS NULL THEN r2.claimIds
      ELSE apoc.coll.toSet(coalesce(r2.claimIds, []) + coalesce(rel.claimIds, []))
    END,
    createdAt: CASE WHEN rel.createdAt IS NULL THEN r2.createdAt ELSE rel.createdAt END,
    validAt: CASE WHEN rel.validAt IS NULL THEN r2.validAt ELSE rel.validAt END,
    invalidAt: CASE WHEN rel.invalidAt IS NULL THEN r2.invalidAt ELSE rel.invalidAt END,
    expiredAt: CASE WHEN rel.expiredAt IS NULL THEN r2.expiredAt ELSE rel.expiredAt END
  }

  RETURN 1 AS okOC

  UNION

  // ---------------- UPDATE (strict: node + relationship exist) ----------------
  WITH o, rel
  WITH o, rel WHERE rel.organization.update IS NOT NULL

  CALL apoc.util.validate(
    rel.organization.update.organizationId IS NULL,
    'OWNS_OR_CONTROLS update failed: organization.update.organizationId is required',
    []
  )

  OPTIONAL MATCH (other3:Organization {organizationId: rel.organization.update.organizationId})
  OPTIONAL MATCH (o)-[r3:OWNS_OR_CONTROLS]->(other3)

  CALL apoc.util.validate(
    other3 IS NULL,
    'OWNS_OR_CONTROLS update failed: Organization not found for organizationId %s',
    [rel.organization.update.organizationId]
  )
  CALL apoc.util.validate(
    r3 IS NULL,
    'OWNS_OR_CONTROLS update failed: relationship not found for org %s -> org %s',
    [$organizationId, rel.organization.update.organizationId]
  )

  SET other3 += {
    name: CASE WHEN rel.organization.update.name IS NULL THEN other3.name ELSE rel.organization.update.name END,
    aliases: CASE
      WHEN rel.organization.update.aliases IS NULL THEN other3.aliases
      ELSE apoc.coll.toSet(coalesce(other3.aliases, []) + coalesce(rel.organization.update.aliases, []))
    END,
    orgType: CASE WHEN rel.organization.update.orgType IS NULL THEN other3.orgType ELSE rel.organization.update.orgType END,
    description: CASE WHEN rel.organization.update.description IS NULL THEN other3.description ELSE rel.organization.update.description END,
    businessModel: CASE WHEN rel.organization.update.businessModel IS NULL THEN other3.businessModel ELSE rel.organization.update.businessModel END
  }

  SET r3 += {
    relationshipType: CASE WHEN rel.relationshipType IS NULL THEN r3.relationshipType ELSE rel.relationshipType END,
    ownershipPercent: CASE WHEN rel.ownershipPercent IS NULL THEN r3.ownershipPercent ELSE rel.ownershipPercent END,
    controlType: CASE WHEN rel.controlType IS NULL THEN r3.controlType ELSE rel.controlType END,
    effectiveFrom: CASE WHEN rel.effectiveFrom IS NULL THEN r3.effectiveFrom ELSE rel.effectiveFrom END,
    effectiveTo: CASE WHEN rel.effectiveTo IS NULL THEN r3.effectiveTo ELSE rel.effectiveTo END,
    isCurrent: CASE WHEN rel.isCurrent IS NULL THEN r3.isCurrent ELSE rel.isCurrent END,
    claimIds: CASE
      WHEN rel.claimIds IS NULL THEN r3.claimIds
      ELSE apoc.coll.toSet(coalesce(r3.claimIds, []) + coalesce(rel.claimIds, []))
    END,
    createdAt: CASE WHEN rel.createdAt IS NULL THEN r3.createdAt ELSE rel.createdAt END,
    validAt: CASE WHEN rel.validAt IS NULL THEN r3.validAt ELSE rel.validAt END,
    invalidAt: CASE WHEN rel.invalidAt IS NULL THEN r3.invalidAt ELSE rel.invalidAt END,
    expiredAt: CASE WHEN rel.expiredAt IS NULL THEN r3.expiredAt ELSE rel.expiredAt END
  }

  RETURN 1 AS okOC
}
RETURN count(*) AS _ownsOrControlsProcessed
          `,
          params
        );
      }

      // ------------------------------------------------------------
      // 3) LISTS (create / connect / update strict)
      // ------------------------------------------------------------
      if (params.lists.length) {
        await tx.run(
          `
MATCH (o:Organization {organizationId: $organizationId})
UNWIND $lists AS rel
CALL {
  // ---------------- CREATE ----------------
  WITH o, rel
  WITH o, rel WHERE rel.listing.create IS NOT NULL

  MERGE (lst:Listing {listingId: coalesce(rel.listing.create.listingId, randomUUID())})
  ON CREATE SET lst.createdAt = datetime()

  SET lst += {
    listingDomain: CASE WHEN rel.listing.create.listingDomain IS NULL THEN lst.listingDomain ELSE rel.listing.create.listingDomain END,
    title: CASE WHEN rel.listing.create.title IS NULL THEN lst.title ELSE rel.listing.create.title END,
    description: CASE WHEN rel.listing.create.description IS NULL THEN lst.description ELSE rel.listing.create.description END,
    sku: CASE WHEN rel.listing.create.sku IS NULL THEN lst.sku ELSE rel.listing.create.sku END,
    url: CASE WHEN rel.listing.create.url IS NULL THEN lst.url ELSE rel.listing.create.url END,
    brandName: CASE WHEN rel.listing.create.brandName IS NULL THEN lst.brandName ELSE rel.listing.create.brandName END,
    currency: CASE WHEN rel.listing.create.currency IS NULL THEN lst.currency ELSE rel.listing.create.currency END,
    priceAmount: CASE WHEN rel.listing.create.priceAmount IS NULL THEN lst.priceAmount ELSE rel.listing.create.priceAmount END,
    priceType: CASE WHEN rel.listing.create.priceType IS NULL THEN lst.priceType ELSE rel.listing.create.priceType END,
    pricingNotes: CASE WHEN rel.listing.create.pricingNotes IS NULL THEN lst.pricingNotes ELSE rel.listing.create.pricingNotes END,
    constraints: CASE WHEN rel.listing.create.constraints IS NULL THEN lst.constraints ELSE rel.listing.create.constraints END,
    regionsAvailable: CASE
      WHEN rel.listing.create.regionsAvailable IS NULL THEN lst.regionsAvailable
      ELSE apoc.coll.toSet(coalesce(lst.regionsAvailable, []) + coalesce(rel.listing.create.regionsAvailable, []))
    END,
    requiresAppointment: CASE WHEN rel.listing.create.requiresAppointment IS NULL THEN lst.requiresAppointment ELSE rel.listing.create.requiresAppointment END,
    collectionMode: CASE WHEN rel.listing.create.collectionMode IS NULL THEN lst.collectionMode ELSE rel.listing.create.collectionMode END,
    turnaroundTime: CASE WHEN rel.listing.create.turnaroundTime IS NULL THEN lst.turnaroundTime ELSE rel.listing.create.turnaroundTime END
  }

  MERGE (o)-[r:LISTS]->(lst)
  ON CREATE SET r.createdAt = datetime()

  SET r += {
    listRole: CASE WHEN rel.listRole IS NULL THEN r.listRole ELSE rel.listRole END,
    channel: CASE WHEN rel.channel IS NULL THEN r.channel ELSE rel.channel END,
    regionsOverrides: CASE
      WHEN rel.regionsOverrides IS NULL THEN r.regionsOverrides
      ELSE apoc.coll.toSet(coalesce(r.regionsOverrides, []) + coalesce(rel.regionsOverrides, []))
    END,
    collectionModesOverrides: CASE
      WHEN rel.collectionModesOverrides IS NULL THEN r.collectionModesOverrides
      ELSE apoc.coll.toSet(coalesce(r.collectionModesOverrides, []) + coalesce(rel.collectionModesOverrides, []))
    END,
    availabilityNotes: CASE WHEN rel.availabilityNotes IS NULL THEN r.availabilityNotes ELSE rel.availabilityNotes END,
    claimIds: CASE
      WHEN rel.claimIds IS NULL THEN r.claimIds
      ELSE apoc.coll.toSet(coalesce(r.claimIds, []) + coalesce(rel.claimIds, []))
    END,
    createdAt: CASE WHEN rel.createdAt IS NULL THEN r.createdAt ELSE rel.createdAt END,
    validAt: CASE WHEN rel.validAt IS NULL THEN r.validAt ELSE rel.validAt END,
    invalidAt: CASE WHEN rel.invalidAt IS NULL THEN r.invalidAt ELSE rel.invalidAt END,
    expiredAt: CASE WHEN rel.expiredAt IS NULL THEN r.expiredAt ELSE rel.expiredAt END
  }

  RETURN 1 AS okL

  UNION

  // ---------------- CONNECT (strict) ----------------
  WITH o, rel
  WITH o, rel WHERE rel.listing.connect IS NOT NULL

  OPTIONAL MATCH (lst2:Listing {listingId: rel.listing.connect.listingId})
  CALL apoc.util.validate(
    lst2 IS NULL,
    'LISTS connect failed: Listing not found for listingId %s',
    [rel.listing.connect.listingId]
  )

  MERGE (o)-[r2:LISTS]->(lst2)
  ON CREATE SET r2.createdAt = datetime()

  SET r2 += {
    listRole: CASE WHEN rel.listRole IS NULL THEN r2.listRole ELSE rel.listRole END,
    channel: CASE WHEN rel.channel IS NULL THEN r2.channel ELSE rel.channel END,
    regionsOverrides: CASE
      WHEN rel.regionsOverrides IS NULL THEN r2.regionsOverrides
      ELSE apoc.coll.toSet(coalesce(r2.regionsOverrides, []) + coalesce(rel.regionsOverrides, []))
    END,
    collectionModesOverrides: CASE
      WHEN rel.collectionModesOverrides IS NULL THEN r2.collectionModesOverrides
      ELSE apoc.coll.toSet(coalesce(r2.collectionModesOverrides, []) + coalesce(rel.collectionModesOverrides, []))
    END,
    availabilityNotes: CASE WHEN rel.availabilityNotes IS NULL THEN r2.availabilityNotes ELSE rel.availabilityNotes END,
    claimIds: CASE
      WHEN rel.claimIds IS NULL THEN r2.claimIds
      ELSE apoc.coll.toSet(coalesce(r2.claimIds, []) + coalesce(rel.claimIds, []))
    END,
    createdAt: CASE WHEN rel.createdAt IS NULL THEN r2.createdAt ELSE rel.createdAt END,
    validAt: CASE WHEN rel.validAt IS NULL THEN r2.validAt ELSE rel.validAt END,
    invalidAt: CASE WHEN rel.invalidAt IS NULL THEN r2.invalidAt ELSE rel.invalidAt END,
    expiredAt: CASE WHEN rel.expiredAt IS NULL THEN r2.expiredAt ELSE rel.expiredAt END
  }

  RETURN 1 AS okL

  UNION

  // ---------------- UPDATE (strict) ----------------
  WITH o, rel
  WITH o, rel WHERE rel.listing.update IS NOT NULL

  CALL apoc.util.validate(
    rel.listing.update.listingId IS NULL,
    'LISTS update failed: listing.update.listingId is required',
    []
  )

  OPTIONAL MATCH (lst3:Listing {listingId: rel.listing.update.listingId})
  OPTIONAL MATCH (o)-[r3:LISTS]->(lst3)

  CALL apoc.util.validate(
    lst3 IS NULL,
    'LISTS update failed: Listing not found for listingId %s',
    [rel.listing.update.listingId]
  )
  CALL apoc.util.validate(
    r3 IS NULL,
    'LISTS update failed: relationship not found for org %s -> listing %s',
    [$organizationId, rel.listing.update.listingId]
  )

  SET lst3 += {
    listingDomain: CASE WHEN rel.listing.update.listingDomain IS NULL THEN lst3.listingDomain ELSE rel.listing.update.listingDomain END,
    title: CASE WHEN rel.listing.update.title IS NULL THEN lst3.title ELSE rel.listing.update.title END,
    description: CASE WHEN rel.listing.update.description IS NULL THEN lst3.description ELSE rel.listing.update.description END,
    sku: CASE WHEN rel.listing.update.sku IS NULL THEN lst3.sku ELSE rel.listing.update.sku END,
    url: CASE WHEN rel.listing.update.url IS NULL THEN lst3.url ELSE rel.listing.update.url END,
    brandName: CASE WHEN rel.listing.update.brandName IS NULL THEN lst3.brandName ELSE rel.listing.update.brandName END,
    currency: CASE WHEN rel.listing.update.currency IS NULL THEN lst3.currency ELSE rel.listing.update.currency END,
    priceAmount: CASE WHEN rel.listing.update.priceAmount IS NULL THEN lst3.priceAmount ELSE rel.listing.update.priceAmount END,
    priceType: CASE WHEN rel.listing.update.priceType IS NULL THEN lst3.priceType ELSE rel.listing.update.priceType END,
    pricingNotes: CASE WHEN rel.listing.update.pricingNotes IS NULL THEN lst3.pricingNotes ELSE rel.listing.update.pricingNotes END,
    constraints: CASE WHEN rel.listing.update.constraints IS NULL THEN lst3.constraints ELSE rel.listing.update.constraints END,
    regionsAvailable: CASE
      WHEN rel.listing.update.regionsAvailable IS NULL THEN lst3.regionsAvailable
      ELSE apoc.coll.toSet(coalesce(lst3.regionsAvailable, []) + coalesce(rel.listing.update.regionsAvailable, []))
    END,
    requiresAppointment: CASE WHEN rel.listing.update.requiresAppointment IS NULL THEN lst3.requiresAppointment ELSE rel.listing.update.requiresAppointment END,
    collectionMode: CASE WHEN rel.listing.update.collectionMode IS NULL THEN lst3.collectionMode ELSE rel.listing.update.collectionMode END,
    turnaroundTime: CASE WHEN rel.listing.update.turnaroundTime IS NULL THEN lst3.turnaroundTime ELSE rel.listing.update.turnaroundTime END
  }

  SET r3 += {
    listRole: CASE WHEN rel.listRole IS NULL THEN r3.listRole ELSE rel.listRole END,
    channel: CASE WHEN rel.channel IS NULL THEN r3.channel ELSE rel.channel END,
    regionsOverrides: CASE
      WHEN rel.regionsOverrides IS NULL THEN r3.regionsOverrides
      ELSE apoc.coll.toSet(coalesce(r3.regionsOverrides, []) + coalesce(rel.regionsOverrides, []))
    END,
    collectionModesOverrides: CASE
      WHEN rel.collectionModesOverrides IS NULL THEN r3.collectionModesOverrides
      ELSE apoc.coll.toSet(coalesce(r3.collectionModesOverrides, []) + coalesce(rel.collectionModesOverrides, []))
    END,
    availabilityNotes: CASE WHEN rel.availabilityNotes IS NULL THEN r3.availabilityNotes ELSE rel.availabilityNotes END,
    claimIds: CASE
      WHEN rel.claimIds IS NULL THEN r3.claimIds
      ELSE apoc.coll.toSet(coalesce(r3.claimIds, []) + coalesce(rel.claimIds, []))
    END,
    createdAt: CASE WHEN rel.createdAt IS NULL THEN r3.createdAt ELSE rel.createdAt END,
    validAt: CASE WHEN rel.validAt IS NULL THEN r3.validAt ELSE rel.validAt END,
    invalidAt: CASE WHEN rel.invalidAt IS NULL THEN r3.invalidAt ELSE rel.invalidAt END,
    expiredAt: CASE WHEN rel.expiredAt IS NULL THEN r3.expiredAt ELSE rel.expiredAt END
  }

  RETURN 1 AS okL
}
RETURN count(*) AS _listsProcessed
          `,
          params
        );
      }

      // ------------------------------------------------------------
      // 4) OFFERS_PRODUCT (create / connect / update strict)
      // ------------------------------------------------------------
      if (params.offersProduct.length) {
        await tx.run(
          `
MATCH (o:Organization {organizationId: $organizationId})
UNWIND $offersProduct AS rel
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

  MERGE (o)-[r:OFFERS_PRODUCT]->(p)
  ON CREATE SET r.createdAt = datetime()

  SET r += {
    createdAt: CASE WHEN rel.createdAt IS NULL THEN r.createdAt ELSE rel.createdAt END,
    validAt: CASE WHEN rel.validAt IS NULL THEN r.validAt ELSE rel.validAt END,
    invalidAt: CASE WHEN rel.invalidAt IS NULL THEN r.invalidAt ELSE rel.invalidAt END,
    expiredAt: CASE WHEN rel.expiredAt IS NULL THEN r.expiredAt ELSE rel.expiredAt END
  }

  RETURN 1 AS okOP

  UNION

  // ---------------- CONNECT (strict) ----------------
  WITH o, rel
  WITH o, rel WHERE rel.product.connect IS NOT NULL

  OPTIONAL MATCH (p2:Product {productId: rel.product.connect.productId})
  CALL apoc.util.validate(
    p2 IS NULL,
    'OFFERS_PRODUCT connect failed: Product not found for productId %s',
    [rel.product.connect.productId]
  )

  MERGE (o)-[r2:OFFERS_PRODUCT]->(p2)
  ON CREATE SET r2.createdAt = datetime()

  SET r2 += {
    createdAt: CASE WHEN rel.createdAt IS NULL THEN r2.createdAt ELSE rel.createdAt END,
    validAt: CASE WHEN rel.validAt IS NULL THEN r2.validAt ELSE rel.validAt END,
    invalidAt: CASE WHEN rel.invalidAt IS NULL THEN r2.invalidAt ELSE rel.invalidAt END,
    expiredAt: CASE WHEN rel.expiredAt IS NULL THEN r2.expiredAt ELSE rel.expiredAt END
  }

  RETURN 1 AS okOP

  UNION

  // ---------------- UPDATE (strict) ----------------
  WITH o, rel
  WITH o, rel WHERE rel.product.update IS NOT NULL

  CALL apoc.util.validate(
    rel.product.update.productId IS NULL,
    'OFFERS_PRODUCT update failed: product.update.productId is required',
    []
  )

  OPTIONAL MATCH (p3:Product {productId: rel.product.update.productId})
  OPTIONAL MATCH (o)-[r3:OFFERS_PRODUCT]->(p3)

  CALL apoc.util.validate(
    p3 IS NULL,
    'OFFERS_PRODUCT update failed: Product not found for productId %s',
    [rel.product.update.productId]
  )
  CALL apoc.util.validate(
    r3 IS NULL,
    'OFFERS_PRODUCT update failed: relationship not found for org %s -> product %s',
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
    createdAt: CASE WHEN rel.createdAt IS NULL THEN r3.createdAt ELSE rel.createdAt END,
    validAt: CASE WHEN rel.validAt IS NULL THEN r3.validAt ELSE rel.validAt END,
    invalidAt: CASE WHEN rel.invalidAt IS NULL THEN r3.invalidAt ELSE rel.invalidAt END,
    expiredAt: CASE WHEN rel.expiredAt IS NULL THEN r3.expiredAt ELSE rel.expiredAt END
  }

  RETURN 1 AS okOP
}
RETURN count(*) AS _offersProductProcessed
          `,
          params
        );
      }

      // ------------------------------------------------------------
      // 5) SUPPLIES_COMPOUND_FORM (create / connect / update strict)
      // ------------------------------------------------------------
      if (params.suppliesCompoundForm.length) {
        await tx.run(
          `
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
          `,
          params
        );
      }

      // ------------------------------------------------------------
      // 6) MANUFACTURES (create / connect / update strict)
      // NOTE: update must NOT create missing relationship.
      // ------------------------------------------------------------
      if (params.manufactures.length) {
        await tx.run(
          `
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
          `,
          params
        );
      }

      // ------------------------------------------------------------
      // 7) MANUFACTURES_PRODUCT (create / connect / update strict)
      // ------------------------------------------------------------
      if (params.manufacturesProduct.length) {
        await tx.run(
          `
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
          `,
          params
        );
      }

      // ------------------------------------------------------------
      // 8) CONTRACT_MANUFACTURER_FOR_ORGANIZATION (create / connect / update strict)
      // ------------------------------------------------------------
      if (params.contractManufacturerForOrganization.length) {
        await tx.run(
          `
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
          `,
          params
        );
      }

      // ------------------------------------------------------------
      // 9) Return updated org
      // ------------------------------------------------------------
      const final = await tx.run(
        `
MATCH (o:Organization {organizationId: $organizationId})
RETURN o
        `,
        { organizationId: params.organizationId }
      );

      const record = firstRecordOrNull(final);
      if (!record) throw new Error("updateOrganization: no record returned");
      const node = record.get("o");
      return node?.properties ?? node;
    });

    return organization as Organization;
  } catch (err: any) {
    logger.error("Neo4j write failed", {
      message: err?.message,
      code: err?.code,
      name: err?.name,
      stack: err?.stack,
    });
    throw err;
  }
}

export async function createOrganizationWithOptionalRelations(
  input: OrganizationInput
): Promise<Organization> {
  const validated = validateInput(
    OrganizationInputSchema,
    input,
    "OrganizationInputWithOptionalRelations"
  );

  // IMPORTANT:
  // - For relationship arrays, prefer [] (not null) so UNWIND is predictable.
  // - For scalar/primitive arrays (aliases, tags), your existing null/merge behavior is fine.
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

    // Relationship arrays — ALWAYS arrays
    hasLocation: validated.hasLocation ?? [],
    ownsOrControls: validated.ownsOrControls ?? [],
    lists: validated.lists ?? [],
    offersProduct: validated.offersProduct ?? [],
    suppliesCompoundForm: validated.suppliesCompoundForm ?? [],

    manufactures: validated.manufactures ?? [],
    manufacturesProduct: validated.manufacturesProduct ?? [],
    contractManufacturerForOrganization:
      validated.contractManufacturerForOrganization ?? [],
  };

  const upsertOrgCypher = `
MERGE (o:Organization {organizationId: $organizationId})
ON CREATE SET o.createdAt = datetime()

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
`;

  // NOTE: apoc.util.validate is VOID for you -> NO "YIELD value"
  const hasLocationCypher = `
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

  const ownsOrControlsCypher = `
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

  const listsCypher = `
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

  const offersProductCypher = `
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

  const suppliesCompoundFormCypher = `
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

  const manufacturesCypher = `
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

  const manufacturesProductCypher = `
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

  const contractManufacturerForOrganizationCypher = `
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

  const returnOrgCypher = `
MATCH (o:Organization {organizationId: $organizationId})
RETURN o
`;

  try {
    const organization = await executeWrite(async (tx) => {
      // 1) Upsert org
      const upsertRes = await tx.run(upsertOrgCypher, params);
      const upsertRecord = firstRecordOrNull(upsertRes);
      if (!upsertRecord)
        throw new Error("createOrganization: no record returned from upsert");

      // 2) Relationship statements (each its own Cypher statement, still same TX)
      if (params.hasLocation.length) {
        await tx.run(hasLocationCypher, params);
      }
      if (params.ownsOrControls.length) {
        await tx.run(ownsOrControlsCypher, params);
      }
      if (params.lists.length) {
        await tx.run(listsCypher, params);
      }
      if (params.offersProduct.length) {
        await tx.run(offersProductCypher, params);
      }
      if (params.suppliesCompoundForm.length) {
        await tx.run(suppliesCompoundFormCypher, params);
      }
      if (params.manufactures.length) {
        await tx.run(manufacturesCypher, params);
      }
      if (params.manufacturesProduct.length) {
        await tx.run(manufacturesProductCypher, params);
      }
      if (params.contractManufacturerForOrganization.length) {
        await tx.run(contractManufacturerForOrganizationCypher, params);
      }

      // 3) Return org at end
      const finalRes = await tx.run(returnOrgCypher, params);
      const finalRecord = firstRecordOrNull(finalRes);
      if (!finalRecord)
        throw new Error("createOrganization: org not found after writes");

      const node = finalRecord.get("o");
      return node?.properties ?? node;
    });

    return organization as Organization;
  } catch (err: any) {
    logger.error("Neo4j write failed", {
      message: err?.message,
      code: err?.code,
      name: err?.name,
      stack: err?.stack,
    });
    throw err;
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
