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
