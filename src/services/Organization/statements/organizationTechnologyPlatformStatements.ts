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
