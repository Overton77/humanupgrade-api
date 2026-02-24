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
