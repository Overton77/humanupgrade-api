export const organizationHasLocationEdgesCypher = `
              UNWIND $organizationIds AS organizationId
  
              OPTIONAL MATCH (o:Organization {organizationId: organizationId})
                OPTIONAL MATCH (o)-[hl:HAS_LOCATION]->(pl:PhysicalLocation)
  
              WITH organizationId,
                collect(
                  CASE WHEN pl IS NULL THEN NULL ELSE {
                    // node
                    location: properties(pl),
  
                    // relationship props
                    locationRole: hl.locationRole,
                    isPrimary: hl.isPrimary,
  
                    // DATE-only -> string
                    startDate: toString(hl.startDate),
                    endDate: toString(hl.endDate),
  
                    claimIds: coalesce(hl.claimIds, []),
  
                    // DATETIME -> string
                    validAt: toString(hl.validAt),
                    invalidAt: toString(hl.invalidAt),
                    expiredAt: toString(hl.expiredAt),
                    createdAt: toString(hl.createdAt)
                  } END
                ) AS edges
  
              RETURN organizationId, [e IN edges WHERE e IS NOT NULL] AS edges
              `;

const organizationOwnsOrControlsEdgesCypher = `
UNWIND $organizationIds AS organizationId

OPTIONAL MATCH (o:Organization {organizationId: organizationId})
  OPTIONAL MATCH (o)-[oc:OWNS_OR_CONTROLS]->(other:Organization)

WITH organizationId,
  collect(
    CASE WHEN other IS NULL THEN NULL ELSE {
      organization: properties(other),

      relationshipType: oc.relationshipType,
      ownershipPercent: oc.ownershipPercent,
      controlType: oc.controlType,

      // DATE-only -> string
      effectiveFrom: toString(oc.effectiveFrom),
      effectiveTo: toString(oc.effectiveTo),

      isCurrent: oc.isCurrent,
      claimIds: coalesce(oc.claimIds, []),

      // DATETIME -> string
      validAt: toString(oc.validAt),
      invalidAt: toString(oc.invalidAt),
      expiredAt: toString(oc.expiredAt),
      createdAt: toString(oc.createdAt)
    } END
  ) AS edges

RETURN organizationId, [e IN edges WHERE e IS NOT NULL] AS edges
`;

export const organizationListsListingEdgesCypher = `
UNWIND $organizationIds AS organizationId

OPTIONAL MATCH (o:Organization {organizationId: organizationId})
  OPTIONAL MATCH (o)-[li:LISTS]->(listing:Listing)

WITH organizationId,
  collect(
    CASE WHEN listing IS NULL THEN NULL ELSE {
      listing: properties(listing),

      listRole: li.listRole,
      channel: li.channel,

      regionsOverrides: li.regionsOverrides,
      collectionModesOverrides: li.collectionModesOverrides,
      availabilityNotes: li.availabilityNotes,

      claimIds: coalesce(li.claimIds, []),

      // DATETIME -> string
      validAt: toString(li.validAt),
      invalidAt: toString(li.invalidAt),
      expiredAt: toString(li.expiredAt),
      createdAt: toString(li.createdAt)
    } END
  ) AS edges

RETURN organizationId, [e IN edges WHERE e IS NOT NULL] AS edges
`;

export const organizationOffersProductEdgesCypher = `
UNWIND $organizationIds AS organizationId

OPTIONAL MATCH (o:Organization {organizationId: organizationId})
  OPTIONAL MATCH (o)-[op:OFFERS_PRODUCT]->(p:Product)

WITH organizationId,
  collect(
    CASE WHEN p IS NULL THEN NULL ELSE {
      product: properties(p),

      // DATETIME -> string
      validAt: toString(op.validAt),
      invalidAt: toString(op.invalidAt),
      expiredAt: toString(op.expiredAt),
      createdAt: toString(op.createdAt)
    } END
  ) AS edges

RETURN organizationId, [e IN edges WHERE e IS NOT NULL] AS edges
`;

export const organizationSuppliesCompoundFormEdgesCypher = `
UNWIND $organizationIds AS organizationId

OPTIONAL MATCH (o:Organization {organizationId: organizationId})
  OPTIONAL MATCH (o)-[scf:SUPPLIES_COMPOUND_FORM]->(cf:CompoundForm)

WITH organizationId,
  collect(
    CASE WHEN cf IS NULL THEN NULL ELSE {
      compoundForm: properties(cf),

      // DATETIME -> string
      validAt: toString(scf.validAt),
      invalidAt: toString(scf.invalidAt),
      expiredAt: toString(scf.expiredAt),
      createdAt: toString(scf.createdAt)
    } END
  ) AS edges

RETURN organizationId, [e IN edges WHERE e IS NOT NULL] AS edges
`;

export const organizationManufacturesEdgesCypher = `
              UNWIND $organizationIds AS organizationId
  
              OPTIONAL MATCH (o:Organization {organizationId: organizationId})
                OPTIONAL MATCH (o)-[m:MANUFACTURES]->(cf:CompoundForm)
  
              WITH organizationId,
                collect(
                  CASE WHEN cf IS NULL THEN NULL ELSE {
                    compoundForm: properties(cf),
                    claimIds: coalesce(m.claimIds, []),
                    // DATETIME -> string
                    validAt: toString(m.validAt),
                    invalidAt: toString(m.invalidAt),
                    expiredAt: toString(m.expiredAt),
                    createdAt: toString(m.createdAt)
                  } END
                ) AS edges
  
              RETURN organizationId, [e IN edges WHERE e IS NOT NULL] AS edges
              `;

export const organizationManufacturesProductEdgesCypher = `
UNWIND $organizationIds AS organizationId

OPTIONAL MATCH (o:Organization {organizationId: organizationId})
  OPTIONAL MATCH (o)-[mp:MANUFACTURES_PRODUCT]->(p:Product)

WITH organizationId,
  collect(
    CASE WHEN p IS NULL THEN NULL ELSE {
      product: properties(p),
      claimIds: coalesce(mp.claimIds, []),
      // DATETIME -> string
      validAt: toString(mp.validAt),
      invalidAt: toString(mp.invalidAt),
      expiredAt: toString(mp.expiredAt),
      createdAt: toString(mp.createdAt)
    } END
  ) AS edges

RETURN organizationId, [e IN edges WHERE e IS NOT NULL] AS edges
`;

export const organizationContractManufacturerForOrganizationEdgesCypher = `
UNWIND $organizationIds AS organizationId

OPTIONAL MATCH (o:Organization {organizationId: organizationId})
  OPTIONAL MATCH (o)-[cm:CONTRACT_MANUFACTURER_FOR_ORGANIZATION]->(other:Organization)

WITH organizationId,
  collect(
    CASE WHEN other IS NULL THEN NULL ELSE {
      organization: properties(other),
      claimIds: coalesce(cm.claimIds, []),
      // DATETIME -> string
      validAt: toString(cm.validAt),
      invalidAt: toString(cm.invalidAt),
      expiredAt: toString(cm.expiredAt),
      createdAt: toString(cm.createdAt)
    } END
  ) AS edges

RETURN organizationId, [e IN edges WHERE e IS NOT NULL] AS edges
`;

export const organizationContractManufacturerForProductEdgesCypher = `
UNWIND $organizationIds AS organizationId

OPTIONAL MATCH (o:Organization {organizationId: organizationId})
  OPTIONAL MATCH (o)-[cmp:CONTRACT_MANUFACTURER_FOR_PRODUCT]->(p:Product)

WITH organizationId,
  collect(
    CASE WHEN p IS NULL THEN NULL ELSE {
      product: properties(p),
      claimIds: coalesce(cmp.claimIds, []),
      // DATETIME -> string
      validAt: toString(cmp.validAt),
      invalidAt: toString(cmp.invalidAt),
      expiredAt: toString(cmp.expiredAt),
      createdAt: toString(cmp.createdAt)
    } END
  ) AS edges

RETURN organizationId, [e IN edges WHERE e IS NOT NULL] AS edges
`;

export const organizationContractManufacturerForCompoundFormEdgesCypher = `
UNWIND $organizationIds AS organizationId

OPTIONAL MATCH (o:Organization {organizationId: organizationId})
  OPTIONAL MATCH (o)-[cmcf:CONTRACT_MANUFACTURER_FOR_COMPOUND_FORM]->(cf:CompoundForm)

WITH organizationId,
  collect(
    CASE WHEN cf IS NULL THEN NULL ELSE {
      compoundForm: properties(cf),
      claimIds: coalesce(cmcf.claimIds, []),
      // DATETIME -> string
      validAt: toString(cmcf.validAt),
      invalidAt: toString(cmcf.invalidAt),
      expiredAt: toString(cmcf.expiredAt),
      createdAt: toString(cmcf.createdAt)
    } END
  ) AS edges

RETURN organizationId, [e IN edges WHERE e IS NOT NULL] AS edges
`;

export const organizationPerformsManufacturingProcessEdgesCypher = `
UNWIND $organizationIds AS organizationId

OPTIONAL MATCH (o:Organization {organizationId: organizationId})
  OPTIONAL MATCH (o)-[pmp:PERFORMS_MANUFACTURING_PROCESS]->(mp:ManufacturingProcess)

WITH organizationId,
  collect(
    CASE WHEN mp IS NULL THEN NULL ELSE {
      manufacturingProcess: properties(mp),
      role: pmp.role,
      claimIds: coalesce(pmp.claimIds, []),
      // DATETIME -> string
      validAt: toString(pmp.validAt),
      invalidAt: toString(pmp.invalidAt),
      expiredAt: toString(pmp.expiredAt),
      createdAt: toString(pmp.createdAt)
    } END
  ) AS edges

RETURN organizationId, [e IN edges WHERE e IS NOT NULL] AS edges
`;

export const organizationDevelopsPlatformEdgesCypher = `
UNWIND $organizationIds AS organizationId

OPTIONAL MATCH (o:Organization {organizationId: organizationId})
  OPTIONAL MATCH (o)-[dp:DEVELOPS_PLATFORM]->(tp:TechnologyPlatform)

WITH organizationId,
  collect(
    CASE WHEN tp IS NULL THEN NULL ELSE {
      technologyPlatform: properties(tp),
      relationshipRole: dp.relationshipRole,
      notes: dp.notes,
      source: dp.source,
      claimIds: coalesce(dp.claimIds, []),
      // DATETIME -> string
      validAt: toString(dp.validAt),
      invalidAt: toString(dp.invalidAt),
      expiredAt: toString(dp.expiredAt),
      createdAt: toString(dp.createdAt)
    } END
  ) AS edges

RETURN organizationId, [e IN edges WHERE e IS NOT NULL] AS edges
`;

export const organizationUsesPlatformEdgesCypher = `
UNWIND $organizationIds AS organizationId

OPTIONAL MATCH (o:Organization {organizationId: organizationId})
  OPTIONAL MATCH (o)-[up:USES_PLATFORM]->(tp:TechnologyPlatform)

WITH organizationId,
  collect(
    CASE WHEN tp IS NULL THEN NULL ELSE {
      technologyPlatform: properties(tp),
      usageContext: up.usageContext,
      isPrimary: up.isPrimary,
      notes: up.notes,
      source: up.source,
      claimIds: coalesce(up.claimIds, []),
      // DATETIME -> string
      validAt: toString(up.validAt),
      invalidAt: toString(up.invalidAt),
      expiredAt: toString(up.expiredAt),
      createdAt: toString(up.createdAt)
    } END
  ) AS edges

RETURN organizationId, [e IN edges WHERE e IS NOT NULL] AS edges
`;

// Organization -> Person edges (EMPLOYS, FOUNDED_BY, HAS_SCIENTIFIC_ADVISOR, HAS_BOARD_MEMBER, HAS_EXECUTIVE_ROLE)

export const organizationEmploysEdgesCypher = `
UNWIND $organizationIds AS organizationId

OPTIONAL MATCH (o:Organization {organizationId: organizationId})
  OPTIONAL MATCH (o)-[emp:EMPLOYS]->(p:Person)

WITH organizationId,
  collect(
    CASE WHEN p IS NULL THEN NULL ELSE {
      person: properties(p),
      roleTitle: emp.roleTitle,
      department: emp.department,
      roleFunction: emp.roleFunction,
      seniority: emp.seniority,
      employmentType: emp.employmentType,
      startDate: toString(emp.startDate),
      endDate: toString(emp.endDate),
      isCurrent: emp.isCurrent,
      claimIds: coalesce(emp.claimIds, []),
      validAt: toString(emp.validAt),
      invalidAt: toString(emp.invalidAt),
      expiredAt: toString(emp.expiredAt),
      createdAt: toString(emp.createdAt)
    } END
  ) AS edges

RETURN organizationId, [e IN edges WHERE e IS NOT NULL] AS edges
`;

export const organizationFoundedByEdgesCypher = `
UNWIND $organizationIds AS organizationId

OPTIONAL MATCH (o:Organization {organizationId: organizationId})
  OPTIONAL MATCH (o)-[fb:FOUNDED_BY]->(p:Person)

WITH organizationId,
  collect(
    CASE WHEN p IS NULL THEN NULL ELSE {
      person: properties(p),
      founderRole: fb.founderRole,
      foundingDate: toString(fb.foundingDate),
      claimIds: coalesce(fb.claimIds, []),
      validAt: toString(fb.validAt),
      invalidAt: toString(fb.invalidAt),
      expiredAt: toString(fb.expiredAt),
      createdAt: toString(fb.createdAt)
    } END
  ) AS edges

RETURN organizationId, [e IN edges WHERE e IS NOT NULL] AS edges
`;

export const organizationHasBoardMemberEdgesCypher = `
UNWIND $organizationIds AS organizationId

OPTIONAL MATCH (o:Organization {organizationId: organizationId})
  OPTIONAL MATCH (o)-[hbm:HAS_BOARD_MEMBER]->(p:Person)

WITH organizationId,
  collect(
    CASE WHEN p IS NULL THEN NULL ELSE {
      person: properties(p),
      boardRole: hbm.boardRole,
      committee: hbm.committee,
      startDate: toString(hbm.startDate),
      endDate: toString(hbm.endDate),
      isCurrent: hbm.isCurrent,
      claimIds: coalesce(hbm.claimIds, []),
      validAt: toString(hbm.validAt),
      invalidAt: toString(hbm.invalidAt),
      expiredAt: toString(hbm.expiredAt),
      createdAt: toString(hbm.createdAt)
    } END
  ) AS edges

RETURN organizationId, [e IN edges WHERE e IS NOT NULL] AS edges
`;

export const organizationHasScientificAdvisorEdgesCypher = `
UNWIND $organizationIds AS organizationId

OPTIONAL MATCH (o:Organization {organizationId: organizationId})
  OPTIONAL MATCH (o)-[hsa:HAS_SCIENTIFIC_ADVISOR]->(p:Person)

WITH organizationId,
  collect(
    CASE WHEN p IS NULL THEN NULL ELSE {
      person: properties(p),
      advisorType: hsa.advisorType,
      focusAreas: coalesce(hsa.focusAreas, []),
      startDate: toString(hsa.startDate),
      endDate: toString(hsa.endDate),
      isCurrent: hsa.isCurrent,
      claimIds: coalesce(hsa.claimIds, []),
      validAt: toString(hsa.validAt),
      invalidAt: toString(hsa.invalidAt),
      expiredAt: toString(hsa.expiredAt),
      createdAt: toString(hsa.createdAt)
    } END
  ) AS edges

RETURN organizationId, [x IN edges WHERE x IS NOT NULL] AS edges
`;

export const organizationHasExecutiveRoleEdgesCypher = `
UNWIND $organizationIds AS organizationId

OPTIONAL MATCH (o:Organization {organizationId: organizationId})
  OPTIONAL MATCH (o)-[her:HAS_EXECUTIVE_ROLE]->(p:Person)

WITH organizationId,
  collect(
    CASE WHEN p IS NULL THEN NULL ELSE {
      person: properties(p),
      executiveRole: her.executiveRole,
      startDate: toString(her.startDate),
      endDate: toString(her.endDate),
      isCurrent: her.isCurrent,
      claimIds: coalesce(her.claimIds, []),
      validAt: toString(her.validAt),
      invalidAt: toString(her.invalidAt),
      expiredAt: toString(her.expiredAt),
      createdAt: toString(her.createdAt)
    } END
  ) AS edges

RETURN organizationId, [e IN edges WHERE e IS NOT NULL] AS edges
`;

export const OrganizationEdgeStatements = {
  organizationHasLocationEdgesCypher,
  organizationOwnsOrControlsEdgesCypher,
  organizationListsListingEdgesCypher,
  organizationOffersProductEdgesCypher,
  organizationSuppliesCompoundFormEdgesCypher,
  organizationManufacturesEdgesCypher,
  organizationManufacturesProductEdgesCypher,
  organizationContractManufacturerForOrganizationEdgesCypher,
  organizationContractManufacturerForProductEdgesCypher,
  organizationContractManufacturerForCompoundFormEdgesCypher,
  organizationPerformsManufacturingProcessEdgesCypher,
  organizationDevelopsPlatformEdgesCypher,
  organizationUsesPlatformEdgesCypher,
  organizationEmploysEdgesCypher,
  organizationFoundedByEdgesCypher,
  organizationHasBoardMemberEdgesCypher,
  organizationHasScientificAdvisorEdgesCypher,
  organizationHasExecutiveRoleEdgesCypher,
};
