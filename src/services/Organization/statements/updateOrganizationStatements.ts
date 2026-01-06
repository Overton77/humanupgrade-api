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

export const updateOrganizationOwnsOrControlsCypher = `
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
            `;
export const updateOrganizationListsCypher = `
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
            `;

export const updateOrganizationOffersProductCypher = `
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
            `;

export const updateOrganizationSuppliesCompoundFormCypher = `
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

export const updateOrganizationDevelopsPlatformCypher = `
  MATCH (o:Organization {organizationId: $organizationId})
  UNWIND $developsPlatform AS rel
  CALL {
    // ---------------- CREATE ----------------
    WITH o, rel
    WITH o, rel WHERE rel.technologyPlatform.create IS NOT NULL
  
    MERGE (tp:TechnologyPlatform {platformId: coalesce(rel.technologyPlatform.create.platformId, randomUUID())})
    ON CREATE SET tp.createdAt = datetime()
  
    SET tp += {
      canonicalName: CASE WHEN rel.technologyPlatform.create.canonicalName IS NULL THEN tp.canonicalName ELSE rel.technologyPlatform.create.canonicalName END,
      aliases: CASE
        WHEN rel.technologyPlatform.create.aliases IS NULL THEN tp.aliases
        ELSE apoc.coll.toSet(coalesce(tp.aliases, []) + coalesce(rel.technologyPlatform.create.aliases, []))
      END,
      platformType: CASE WHEN rel.technologyPlatform.create.platformType IS NULL THEN tp.platformType ELSE rel.technologyPlatform.create.platformType END,
      description: CASE WHEN rel.technologyPlatform.create.description IS NULL THEN tp.description ELSE rel.technologyPlatform.create.description END
    }
  
    MERGE (o)-[r:DEVELOPS_PLATFORM]->(tp)
    ON CREATE SET r.createdAt = datetime()
  
    SET r += {
      relationshipRole: CASE WHEN rel.relationshipRole IS NULL THEN r.relationshipRole ELSE rel.relationshipRole END,
      notes: CASE WHEN rel.notes IS NULL THEN r.notes ELSE rel.notes END,
      source: CASE WHEN rel.source IS NULL THEN r.source ELSE rel.source END,
      claimIds: CASE
        WHEN rel.claimIds IS NULL THEN r.claimIds
        ELSE apoc.coll.toSet(coalesce(r.claimIds, []) + coalesce(rel.claimIds, []))
      END,
      createdAt: CASE WHEN rel.createdAt IS NULL THEN r.createdAt ELSE rel.createdAt END,
      validAt: CASE WHEN rel.validAt IS NULL THEN r.validAt ELSE rel.validAt END,
      invalidAt: CASE WHEN rel.invalidAt IS NULL THEN r.invalidAt ELSE rel.invalidAt END,
      expiredAt: CASE WHEN rel.expiredAt IS NULL THEN r.expiredAt ELSE rel.expiredAt END
    }
  
    RETURN 1 AS okDP
  
    UNION
  
    // ---------------- CONNECT (strict) ----------------
    WITH o, rel
    WITH o, rel WHERE rel.technologyPlatform.connect IS NOT NULL
  
    OPTIONAL MATCH (tp2:TechnologyPlatform {platformId: rel.technologyPlatform.connect.platformId})
    CALL apoc.util.validate(
      tp2 IS NULL,
      'DEVELOPS_PLATFORM connect failed: TechnologyPlatform not found for platformId %s',
      [rel.technologyPlatform.connect.platformId]
    )
  
    MERGE (o)-[r2:DEVELOPS_PLATFORM]->(tp2)
    ON CREATE SET r2.createdAt = datetime()
  
    SET r2 += {
      relationshipRole: CASE WHEN rel.relationshipRole IS NULL THEN r2.relationshipRole ELSE rel.relationshipRole END,
      notes: CASE WHEN rel.notes IS NULL THEN r2.notes ELSE rel.notes END,
      source: CASE WHEN rel.source IS NULL THEN r2.source ELSE rel.source END,
      claimIds: CASE
        WHEN rel.claimIds IS NULL THEN r2.claimIds
        ELSE apoc.coll.toSet(coalesce(r2.claimIds, []) + coalesce(rel.claimIds, []))
      END,
      createdAt: CASE WHEN rel.createdAt IS NULL THEN r2.createdAt ELSE rel.createdAt END,
      validAt: CASE WHEN rel.validAt IS NULL THEN r2.validAt ELSE rel.validAt END,
      invalidAt: CASE WHEN rel.invalidAt IS NULL THEN r2.invalidAt ELSE rel.invalidAt END,
      expiredAt: CASE WHEN rel.expiredAt IS NULL THEN r2.expiredAt ELSE rel.expiredAt END
    }
  
    RETURN 1 AS okDP
  
    UNION
  
    // ---------------- UPDATE (strict: rel must already exist) ----------------
    WITH o, rel
    WITH o, rel WHERE rel.technologyPlatform.update IS NOT NULL
  
    CALL apoc.util.validate(
      rel.technologyPlatform.update.platformId IS NULL,
      'DEVELOPS_PLATFORM update failed: technologyPlatform.update.platformId is required',
      []
    )
  
    OPTIONAL MATCH (tp3:TechnologyPlatform {platformId: rel.technologyPlatform.update.platformId})
    OPTIONAL MATCH (o)-[r3:DEVELOPS_PLATFORM]->(tp3)
  
    CALL apoc.util.validate(
      tp3 IS NULL,
      'DEVELOPS_PLATFORM update failed: TechnologyPlatform not found for platformId %s',
      [rel.technologyPlatform.update.platformId]
    )
    CALL apoc.util.validate(
      r3 IS NULL,
      'DEVELOPS_PLATFORM update failed: relationship not found for org %s -> platform %s',
      [$organizationId, rel.technologyPlatform.update.platformId]
    )
  
    SET tp3 += {
      canonicalName: CASE WHEN rel.technologyPlatform.update.canonicalName IS NULL THEN tp3.canonicalName ELSE rel.technologyPlatform.update.canonicalName END,
      aliases: CASE
        WHEN rel.technologyPlatform.update.aliases IS NULL THEN tp3.aliases
        ELSE apoc.coll.toSet(coalesce(tp3.aliases, []) + coalesce(rel.technologyPlatform.update.aliases, []))
      END,
      platformType: CASE WHEN rel.technologyPlatform.update.platformType IS NULL THEN tp3.platformType ELSE rel.technologyPlatform.update.platformType END,
      description: CASE WHEN rel.technologyPlatform.update.description IS NULL THEN tp3.description ELSE rel.technologyPlatform.update.description END
    }
  
    SET r3 += {
      relationshipRole: CASE WHEN rel.relationshipRole IS NULL THEN r3.relationshipRole ELSE rel.relationshipRole END,
      notes: CASE WHEN rel.notes IS NULL THEN r3.notes ELSE rel.notes END,
      source: CASE WHEN rel.source IS NULL THEN r3.source ELSE rel.source END,
      claimIds: CASE
        WHEN rel.claimIds IS NULL THEN r3.claimIds
        ELSE apoc.coll.toSet(coalesce(r3.claimIds, []) + coalesce(rel.claimIds, []))
      END,
      createdAt: CASE WHEN rel.createdAt IS NULL THEN r3.createdAt ELSE rel.createdAt END,
      validAt: CASE WHEN rel.validAt IS NULL THEN r3.validAt ELSE rel.validAt END,
      invalidAt: CASE WHEN rel.invalidAt IS NULL THEN r3.invalidAt ELSE rel.invalidAt END,
      expiredAt: CASE WHEN rel.expiredAt IS NULL THEN r3.expiredAt ELSE rel.expiredAt END
    }
  
    RETURN 1 AS okDP
  }
  RETURN count(*) AS _developsPlatformProcessed
            `;

export const updateOrganizationUsesPlatformCypher = `
  MATCH (o:Organization {organizationId: $organizationId})
  UNWIND $usesPlatform AS rel
  CALL {
    // ---------------- CREATE ----------------
    WITH o, rel
    WITH o, rel WHERE rel.technologyPlatform.create IS NOT NULL
  
    MERGE (tp:TechnologyPlatform {platformId: coalesce(rel.technologyPlatform.create.platformId, randomUUID())})
    ON CREATE SET tp.createdAt = datetime()
  
    SET tp += {
      canonicalName: CASE WHEN rel.technologyPlatform.create.canonicalName IS NULL THEN tp.canonicalName ELSE rel.technologyPlatform.create.canonicalName END,
      aliases: CASE
        WHEN rel.technologyPlatform.create.aliases IS NULL THEN tp.aliases
        ELSE apoc.coll.toSet(coalesce(tp.aliases, []) + coalesce(rel.technologyPlatform.create.aliases, []))
      END,
      platformType: CASE WHEN rel.technologyPlatform.create.platformType IS NULL THEN tp.platformType ELSE rel.technologyPlatform.create.platformType END,
      description: CASE WHEN rel.technologyPlatform.create.description IS NULL THEN tp.description ELSE rel.technologyPlatform.create.description END
    }
  
    MERGE (o)-[r:USES_PLATFORM]->(tp)
    ON CREATE SET r.createdAt = datetime()
  
    SET r += {
      usageContext: CASE WHEN rel.usageContext IS NULL THEN r.usageContext ELSE rel.usageContext END,
      isPrimary: CASE WHEN rel.isPrimary IS NULL THEN r.isPrimary ELSE rel.isPrimary END,
      notes: CASE WHEN rel.notes IS NULL THEN r.notes ELSE rel.notes END,
      source: CASE WHEN rel.source IS NULL THEN r.source ELSE rel.source END,
      claimIds: CASE
        WHEN rel.claimIds IS NULL THEN r.claimIds
        ELSE apoc.coll.toSet(coalesce(r.claimIds, []) + coalesce(rel.claimIds, []))
      END,
      createdAt: CASE WHEN rel.createdAt IS NULL THEN r.createdAt ELSE rel.createdAt END,
      validAt: CASE WHEN rel.validAt IS NULL THEN r.validAt ELSE rel.validAt END,
      invalidAt: CASE WHEN rel.invalidAt IS NULL THEN r.invalidAt ELSE rel.invalidAt END,
      expiredAt: CASE WHEN rel.expiredAt IS NULL THEN r.expiredAt ELSE rel.expiredAt END
    }
  
    RETURN 1 AS okUP
  
    UNION
  
    // ---------------- CONNECT (strict) ----------------
    WITH o, rel
    WITH o, rel WHERE rel.technologyPlatform.connect IS NOT NULL
  
    OPTIONAL MATCH (tp2:TechnologyPlatform {platformId: rel.technologyPlatform.connect.platformId})
    CALL apoc.util.validate(
      tp2 IS NULL,
      'USES_PLATFORM connect failed: TechnologyPlatform not found for platformId %s',
      [rel.technologyPlatform.connect.platformId]
    )
  
    MERGE (o)-[r2:USES_PLATFORM]->(tp2)
    ON CREATE SET r2.createdAt = datetime()
  
    SET r2 += {
      usageContext: CASE WHEN rel.usageContext IS NULL THEN r2.usageContext ELSE rel.usageContext END,
      isPrimary: CASE WHEN rel.isPrimary IS NULL THEN r2.isPrimary ELSE rel.isPrimary END,
      notes: CASE WHEN rel.notes IS NULL THEN r2.notes ELSE rel.notes END,
      source: CASE WHEN rel.source IS NULL THEN r2.source ELSE rel.source END,
      claimIds: CASE
        WHEN rel.claimIds IS NULL THEN r2.claimIds
        ELSE apoc.coll.toSet(coalesce(r2.claimIds, []) + coalesce(rel.claimIds, []))
      END,
      createdAt: CASE WHEN rel.createdAt IS NULL THEN r2.createdAt ELSE rel.createdAt END,
      validAt: CASE WHEN rel.validAt IS NULL THEN r2.validAt ELSE rel.validAt END,
      invalidAt: CASE WHEN rel.invalidAt IS NULL THEN r2.invalidAt ELSE rel.invalidAt END,
      expiredAt: CASE WHEN rel.expiredAt IS NULL THEN r2.expiredAt ELSE rel.expiredAt END
    }
  
    RETURN 1 AS okUP
  
    UNION
  
    // ---------------- UPDATE (strict: rel must already exist) ----------------
    WITH o, rel
    WITH o, rel WHERE rel.technologyPlatform.update IS NOT NULL
  
    CALL apoc.util.validate(
      rel.technologyPlatform.update.platformId IS NULL,
      'USES_PLATFORM update failed: technologyPlatform.update.platformId is required',
      []
    )
  
    OPTIONAL MATCH (tp3:TechnologyPlatform {platformId: rel.technologyPlatform.update.platformId})
    OPTIONAL MATCH (o)-[r3:USES_PLATFORM]->(tp3)
  
    CALL apoc.util.validate(
      tp3 IS NULL,
      'USES_PLATFORM update failed: TechnologyPlatform not found for platformId %s',
      [rel.technologyPlatform.update.platformId]
    )
    CALL apoc.util.validate(
      r3 IS NULL,
      'USES_PLATFORM update failed: relationship not found for org %s -> platform %s',
      [$organizationId, rel.technologyPlatform.update.platformId]
    )
  
    SET tp3 += {
      canonicalName: CASE WHEN rel.technologyPlatform.update.canonicalName IS NULL THEN tp3.canonicalName ELSE rel.technologyPlatform.update.canonicalName END,
      aliases: CASE
        WHEN rel.technologyPlatform.update.aliases IS NULL THEN tp3.aliases
        ELSE apoc.coll.toSet(coalesce(tp3.aliases, []) + coalesce(rel.technologyPlatform.update.aliases, []))
      END,
      platformType: CASE WHEN rel.technologyPlatform.update.platformType IS NULL THEN tp3.platformType ELSE rel.technologyPlatform.update.platformType END,
      description: CASE WHEN rel.technologyPlatform.update.description IS NULL THEN tp3.description ELSE rel.technologyPlatform.update.description END
    }
  
    SET r3 += {
      usageContext: CASE WHEN rel.usageContext IS NULL THEN r3.usageContext ELSE rel.usageContext END,
      isPrimary: CASE WHEN rel.isPrimary IS NULL THEN r3.isPrimary ELSE rel.isPrimary END,
      notes: CASE WHEN rel.notes IS NULL THEN r3.notes ELSE rel.notes END,
      source: CASE WHEN rel.source IS NULL THEN r3.source ELSE rel.source END,
      claimIds: CASE
        WHEN rel.claimIds IS NULL THEN r3.claimIds
        ELSE apoc.coll.toSet(coalesce(r3.claimIds, []) + coalesce(rel.claimIds, []))
      END,
      createdAt: CASE WHEN rel.createdAt IS NULL THEN r3.createdAt ELSE rel.createdAt END,
      validAt: CASE WHEN rel.validAt IS NULL THEN r3.validAt ELSE rel.validAt END,
      invalidAt: CASE WHEN rel.invalidAt IS NULL THEN r3.invalidAt ELSE rel.invalidAt END,
      expiredAt: CASE WHEN rel.expiredAt IS NULL THEN r3.expiredAt ELSE rel.expiredAt END
    }
  
    RETURN 1 AS okUP
  }
  RETURN count(*) AS _usesPlatformProcessed
            `;

export const returnUpdatedOrganizationCypher = `
  MATCH (o:Organization {organizationId: $organizationId})
  RETURN o
          `;

export const updateOrganizationStatements = {
  updateOrganizationCypher,
  updateOrganizationHasLocationCypher,
  updateOrganizationOwnsOrControlsCypher,
  updateOrganizationListsCypher,
  updateOrganizationOffersProductCypher,
  updateOrganizationSuppliesCompoundFormCypher,
  updateOrganizationManufacturesCompoundFormCypher,
  updateOrganizationManufacturesProductCypher,
  updateOrganizationContractManufacturerForOrganizationCypher,
  updateOrganizationContractManufacturerForProductCypher,
  updateOrganizationContractManufacturerForCompoundFormCypher,
  updateOrganizationPerformsManufacturingProcessCypher,
  updateOrganizationDevelopsPlatformCypher,
  updateOrganizationUsesPlatformCypher,
  returnUpdatedOrganizationCypher,
};
