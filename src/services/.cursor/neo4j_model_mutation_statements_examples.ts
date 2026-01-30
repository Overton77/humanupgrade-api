export const updateOrganizationCypher = `
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
            `;
export const updateOrganizationHasLocationCypher = `       
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
            `; 


