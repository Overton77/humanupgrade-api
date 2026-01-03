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

const NEO4J_STRUCTURAL_KEYS = new Set([
  // relationship arrays on Organization input
  "hasLocation",
  "ownsOrControls",
  "lists",
  "offersProduct",
  "suppliesCompoundForm",

  // relate wrappers
  "location",
  "organization",
  "listing",
  "product",
  "compoundForm",

  // relate operations
  "create",
  "connect",
  "update",
]);

function toJsonString(value: unknown): string {
  return JSON.stringify(value, (_k, v) => {
    if (v instanceof Date) return v.toISOString();
    return v;
  });
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return (
    typeof v === "object" &&
    v !== null &&
    !Array.isArray(v) &&
    !(v instanceof Date)
  );
}

/**
 * Makes params safe for Cypher patterns like:
 *   SET n += { someProp: $someProp }
 * by ensuring no Neo4j property receives a Map.
 *
 * Strategy:
 * - preserve structural relationship nesting objects so Cypher can access fields
 * - stringify any other plain object encountered
 */
function normalizeParamsForNeo4j(input: any): any {
  const seen = new WeakMap<object, any>();

  const walk = (v: any, keyHint?: string): any => {
    if (v === null || v === undefined) return v;
    if (typeof v !== "object") return v;
    if (v instanceof Date) return v;

    if (seen.has(v)) return seen.get(v);

    if (Array.isArray(v)) {
      const arr: any[] = [];
      seen.set(v, arr);
      for (const item of v) arr.push(walk(item));
      return arr;
    }

    // Plain object
    const obj = v as Record<string, any>;

    // If this object is *not* a structural container, stringify it.
    // keyHint is the parent key name that contained this object.
    if (keyHint && !NEO4J_STRUCTURAL_KEYS.has(keyHint)) {
      return toJsonString(obj);
    }

    // Otherwise recurse and decide per child key.
    const out: Record<string, any> = {};
    seen.set(v, out);

    for (const [k, child] of Object.entries(obj)) {
      out[k] = walk(child, k);
    }

    return out;
  };

  return walk(input);
}

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

  // Ensure invalidAt and expiredAt are always present in parameters (even if undefined)
  // to avoid Neo4j "Expected parameter" errors
  const params = normalizeParamsForNeo4j({
    ...validated,
    invalidAt: validated.invalidAt ?? null,
    expiredAt: validated.expiredAt ?? null,
  });

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
  employeeCountRange: CASE WHEN $employeeCountRange IS NULL THEN o.employeeCountRange ELSE $employeeCountRange END,
  revenueRangeAnnual: CASE WHEN $revenueRangeAnnual IS NULL THEN o.revenueRangeAnnual ELSE $revenueRangeAnnual END,
  valuationRange: CASE WHEN $valuationRange IS NULL THEN o.valuationRange ELSE $valuationRange END,
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
    canonicalName: rel.location.create.canonicalName,
    locationType: rel.location.create.locationType,
    addressLine1: rel.location.create.addressLine1,
    addressLine2: rel.location.create.addressLine2,
    city: rel.location.create.city,
    region: rel.location.create.region,
    postalCode: rel.location.create.postalCode,
    countryCode: rel.location.create.countryCode,
    geo: rel.location.create.geo,
    timezone: rel.location.create.timezone,
    jurisdiction: rel.location.create.jurisdiction,
    placeTags: rel.location.create.placeTags,
    hoursOfOperation: rel.location.create.hoursOfOperation,
    contact: rel.location.create.contact
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
    name: ocRel.organization.create.name,
    aliases: ocRel.organization.create.aliases,
    orgType: ocRel.organization.create.orgType,
    description: ocRel.organization.create.description,
    businessModel: ocRel.organization.create.businessModel,
    primaryIndustryTags: ocRel.organization.create.primaryIndustryTags,
    regionsServed: ocRel.organization.create.regionsServed,
    legalName: ocRel.organization.create.legalName,
    legalStructure: ocRel.organization.create.legalStructure,
    ownershipType: ocRel.organization.create.ownershipType,
    jurisdictionsOfIncorporation: ocRel.organization.create.jurisdictionsOfIncorporation,
    websiteUrl: ocRel.organization.create.websiteUrl,
    defaultCollectionModes: ocRel.organization.create.defaultCollectionModes,
    defaultRegionsAvailable: ocRel.organization.create.defaultRegionsAvailable,
    publicTicker: ocRel.organization.create.publicTicker,
    fundingStage: ocRel.organization.create.fundingStage,
    employeeCountRange: ocRel.organization.create.employeeCountRange,
    revenueRangeAnnual: ocRel.organization.create.revenueRangeAnnual,
    valuationRange: ocRel.organization.create.valuationRange,
    validAt: ocRel.organization.create.validAt,
    invalidAt: ocRel.organization.create.invalidAt,
    expiredAt: ocRel.organization.create.expiredAt
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
    listingDomain: listRel.listing.create.listingDomain,
    title: listRel.listing.create.title,
    description: listRel.listing.create.description,
    sku: listRel.listing.create.sku,
    url: listRel.listing.create.url,
    brandName: listRel.listing.create.brandName,
    currency: listRel.listing.create.currency,
    priceAmount: listRel.listing.create.priceAmount,
    priceType: listRel.listing.create.priceType,
    pricingNotes: listRel.listing.create.pricingNotes,
    constraints: listRel.listing.create.constraints,
    regionsAvailable: listRel.listing.create.regionsAvailable,
    requiresAppointment: listRel.listing.create.requiresAppointment,
    collectionMode: listRel.listing.create.collectionMode,
    turnaroundTime: listRel.listing.create.turnaroundTime
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
    name: prodRel.product.create.name,
    synonyms: prodRel.product.create.synonyms,
    productDomain: prodRel.product.create.productDomain,
    productType: prodRel.product.create.productType,
    intendedUse: prodRel.product.create.intendedUse,
    description: prodRel.product.create.description,
    brandName: prodRel.product.create.brandName,
    modelNumber: prodRel.product.create.modelNumber,
    ndcCode: prodRel.product.create.ndcCode,
    upc: prodRel.product.create.upc,
    gtin: prodRel.product.create.gtin,
    riskClass: prodRel.product.create.riskClass,
    currency: prodRel.product.create.currency,
    priceAmount: prodRel.product.create.priceAmount
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
    canonicalName: cfRel.compoundForm.create.canonicalName,
    formType: cfRel.compoundForm.create.formType,
    chemicalDifferences: cfRel.compoundForm.create.chemicalDifferences,
    stabilityProfile: cfRel.compoundForm.create.stabilityProfile,
    solubilityProfile: cfRel.compoundForm.create.solubilityProfile,
    bioavailabilityNotes: cfRel.compoundForm.create.bioavailabilityNotes,
    regulatoryStatusSummary: cfRel.compoundForm.create.regulatoryStatusSummary
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
  const parseJsonOrNull = <T>(value: unknown, label: string): T | null => {
    if (value === null || value === undefined) return null;

    // Already parsed (in case some nodes were created before the JSON-string migration)
    if (typeof value === "object") return value as T;

    if (typeof value !== "string") return null;

    const s = value.trim();
    if (s.length === 0) return null;

    try {
      return JSON.parse(s) as T;
    } catch (e) {
      logger.warn(`findAllOrganizations: failed to parse JSON for ${label}`);
      return null;
    }
  };

  const hydrateOrganization = (org: any): any => {
    if (!org || typeof org !== "object") return org;

    // Top-level Organization JSON-string fields
    org.employeeCountRange = parseJsonOrNull(
      org.employeeCountRange,
      "Organization.employeeCountRange"
    );
    org.revenueRangeAnnual = parseJsonOrNull(
      org.revenueRangeAnnual,
      "Organization.revenueRangeAnnual"
    );
    org.valuationRange = parseJsonOrNull(
      org.valuationRange,
      "Organization.valuationRange"
    );

    // Nested: hasLocation[].location.geo/contact may be JSON strings
    if (Array.isArray(org.hasLocation)) {
      org.hasLocation = org.hasLocation.map((edge: any) => {
        if (!edge || typeof edge !== "object") return edge;
        if (edge.location && typeof edge.location === "object") {
          edge.location.geo = parseJsonOrNull(
            edge.location.geo,
            "PhysicalLocation.geo"
          );
          edge.location.contact = parseJsonOrNull(
            edge.location.contact,
            "PhysicalLocation.contact"
          );
        }
        return edge;
      });
    }

    // Nested orgs inside ownsOrControls may also have JSON-string fields
    if (Array.isArray(org.ownsOrControls)) {
      org.ownsOrControls = org.ownsOrControls.map((edge: any) => {
        if (!edge || typeof edge !== "object") return edge;
        if (edge.organization && typeof edge.organization === "object") {
          edge.organization.employeeCountRange = parseJsonOrNull(
            edge.organization.employeeCountRange,
            "Organization(employeeCountRange) in ownsOrControls.organization"
          );
          edge.organization.revenueRangeAnnual = parseJsonOrNull(
            edge.organization.revenueRangeAnnual,
            "Organization(revenueRangeAnnual) in ownsOrControls.organization"
          );
          edge.organization.valuationRange = parseJsonOrNull(
            edge.organization.valuationRange,
            "Organization(valuationRange) in ownsOrControls.organization"
          );
        }
        return edge;
      });
    }

    return org;
  };

  try {
    const organizations = await executeRead(async (tx) => {
      const result = await tx.run(
        `
            MATCH (o:Organization)
  
            OPTIONAL MATCH (o)-[hl:HAS_LOCATION]->(pl:PhysicalLocation)
            WITH o,
                collect(
                  DISTINCT {
                    location: properties(pl),
                    locationRole: hl.locationRole,
                    isPrimary: hl.isPrimary,
                    startDate: hl.startDate,
                    endDate: hl.endDate,
                    claimIds: coalesce(hl.claimIds, []),
                    validAt: hl.validAt,
                    invalidAt: hl.invalidAt,
                    expiredAt: hl.expiredAt,
                    createdAt: hl.createdAt
                  }
                ) AS hasLocationEdges
  
            OPTIONAL MATCH (o)-[oc:OWNS_OR_CONTROLS]->(otherOrg:Organization)
            WITH o, hasLocationEdges,
                collect(
                  DISTINCT {
                    organization: properties(otherOrg),
                    relationshipType: oc.relationshipType,
                    ownershipPercent: oc.ownershipPercent,
                    controlType: oc.controlType,
                    effectiveFrom: oc.effectiveFrom,
                    effectiveTo: oc.effectiveTo,
                    isCurrent: oc.isCurrent,
                    claimIds: coalesce(oc.claimIds, []),
                    validAt: oc.validAt,
                    invalidAt: oc.invalidAt,
                    expiredAt: oc.expiredAt,
                    createdAt: oc.createdAt
                  }
                ) AS ownsOrControlsEdges
  
            OPTIONAL MATCH (o)-[li:LIST]->(listing:Listing)
            WITH o, hasLocationEdges, ownsOrControlsEdges,
                collect(
                  DISTINCT {
                    listing: properties(listing),
                    listRole: li.listRole,
                    channel: li.channel,
                    regionsOverrides: li.regionsOverrides,
                    collectionModesOverrides: li.collectionModesOverrides,
                    availabilityNotes: li.availabilityNotes,
                    claimIds: coalesce(li.claimIds, []),
                    validAt: li.validAt,
                    invalidAt: li.invalidAt,
                    expiredAt: li.expiredAt,
                    createdAt: li.createdAt
                  }
                ) AS listsEdges
  
            OPTIONAL MATCH (o)-[op:OFFERS_PRODUCT]->(product:Product)
            WITH o, hasLocationEdges, ownsOrControlsEdges, listsEdges,
                collect(
                  DISTINCT {
                    product: properties(product),
                    validAt: op.validAt,
                    invalidAt: op.invalidAt,
                    expiredAt: op.expiredAt,
                    createdAt: op.createdAt
                  }
                ) AS offersProductEdges
  
            OPTIONAL MATCH (o)-[scf:SUPPLIES_COMPOUND_FORM]->(cf:CompoundForm)
            WITH o, hasLocationEdges, ownsOrControlsEdges, listsEdges, offersProductEdges,
                collect(
                  DISTINCT {
                    compoundForm: properties(cf),
                    validAt: scf.validAt,
                    invalidAt: scf.invalidAt,
                    expiredAt: scf.expiredAt,
                    createdAt: scf.createdAt
                  }
                ) AS suppliesCompoundFormEdges
  
            RETURN {
              organizationId: o.organizationId,
              name: o.name,
              aliases: o.aliases,
              orgType: o.orgType,
              description: o.description,
              businessModel: o.businessModel,
              primaryIndustryTags: o.primaryIndustryTags,
              regionsServed: o.regionsServed,
              legalName: o.legalName,
              legalStructure: o.legalStructure,
              ownershipType: o.ownershipType,
              jurisdictionsOfIncorporation: o.jurisdictionsOfIncorporation,
              websiteUrl: o.websiteUrl,
              defaultCollectionModes: o.defaultCollectionModes,
              defaultRegionsAvailable: o.defaultRegionsAvailable,
              publicTicker: o.publicTicker,
              fundingStage: o.fundingStage,
              employeeCountRange: o.employeeCountRange,
              revenueRangeAnnual: o.revenueRangeAnnual,
              valuationRange: o.valuationRange,
              validAt: o.validAt,
              invalidAt: o.invalidAt,
              expiredAt: o.expiredAt,
              createdAt: o.createdAt,
  
              hasLocation: [e IN hasLocationEdges WHERE e.location IS NOT NULL],
              ownsOrControls: [e IN ownsOrControlsEdges WHERE e.organization IS NOT NULL],
              lists: [e IN listsEdges WHERE e.listing IS NOT NULL],
              offersProduct: [e IN offersProductEdges WHERE e.product IS NOT NULL],
              suppliesCompoundForm: [e IN suppliesCompoundFormEdges WHERE e.compoundForm IS NOT NULL]
            } AS organization
            ORDER BY o.createdAt DESC
          `
      );

      return result.records.map((r: Record<string, any>) =>
        hydrateOrganization(r.get("organization"))
      );
    });

    return organizations as Organization[];
  } catch (err) {
    logger.error(`findAllOrganizations failed: ${err}`);
    throw Errors.internalError("Failed to fetch organizations");
  }
}
