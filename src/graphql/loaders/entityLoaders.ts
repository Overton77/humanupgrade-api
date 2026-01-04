import DataLoader from "dataloader";
import { executeRead } from "../../db/neo4j/query.js";
import { mapResultsToKeys } from "./utils.js";

import type {
  HasLocationEdge,
  OwnsOrControlsEdge,
  ListsEdge,
  OffersProductEdge,
  SuppliesCompoundFormEdge,
} from "../types/OrganizationModel.js";

export interface EntityLoaders {
  Organization: {
    organizationHasLocationEdges: DataLoader<string, HasLocationEdge[]>;
    organizationOwnsOrControlsEdges: DataLoader<string, OwnsOrControlsEdge[]>;
    organizationListsEdges: DataLoader<string, ListsEdge[]>;
    organizationOffersProductEdges: DataLoader<string, OffersProductEdge[]>;
    organizationSuppliesCompoundFormEdges: DataLoader<
      string,
      SuppliesCompoundFormEdge[]
    >;
  };
}

export function createEntityLoaders(): EntityLoaders {
  return {
    Organization: {
      organizationHasLocationEdges: new DataLoader<string, HasLocationEdge[]>(
        async (organizationIds) => {
          const rows = await executeRead(async (tx) => {
            const res = await tx.run(
              `
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
              `,
              { organizationIds }
            );

            return res.records.map((r) => ({
              organizationId: r.get("organizationId"),
              edges: r.get("edges"),
            }));
          });

          return mapResultsToKeys(organizationIds, rows);
        },
        { cacheKeyFn: (k) => k }
      ),

      organizationOwnsOrControlsEdges: new DataLoader<
        string,
        OwnsOrControlsEdge[]
      >(
        async (organizationIds) => {
          const rows = await executeRead(async (tx) => {
            const res = await tx.run(
              `
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
              `,
              { organizationIds }
            );

            return res.records.map((r) => ({
              organizationId: r.get("organizationId"),
              edges: r.get("edges"),
            }));
          });

          return mapResultsToKeys(organizationIds, rows);
        },
        { cacheKeyFn: (k) => k }
      ),

      organizationListsEdges: new DataLoader<string, ListsEdge[]>(
        async (organizationIds) => {
          const rows = await executeRead(async (tx) => {
            const res = await tx.run(
              `
              UNWIND $organizationIds AS organizationId
  
              OPTIONAL MATCH (o:Organization {organizationId: organizationId})
                OPTIONAL MATCH (o)-[li:LIST]->(listing:Listing)
  
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
              `,
              { organizationIds }
            );

            return res.records.map((r) => ({
              organizationId: r.get("organizationId"),
              edges: r.get("edges"),
            }));
          });

          return mapResultsToKeys(organizationIds, rows);
        },
        { cacheKeyFn: (k) => k }
      ),

      organizationOffersProductEdges: new DataLoader<
        string,
        OffersProductEdge[]
      >(
        async (organizationIds) => {
          const rows = await executeRead(async (tx) => {
            const res = await tx.run(
              `
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
              `,
              { organizationIds }
            );

            return res.records.map((r) => ({
              organizationId: r.get("organizationId"),
              edges: r.get("edges"),
            }));
          });

          return mapResultsToKeys(organizationIds, rows);
        },
        { cacheKeyFn: (k) => k }
      ),

      organizationSuppliesCompoundFormEdges: new DataLoader<
        string,
        SuppliesCompoundFormEdge[]
      >(async (organizationIds) => {
        const rows = await executeRead(async (tx) => {
          const res = await tx.run(
            `
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
            `,
            { organizationIds }
          );

          return res.records.map((r) => ({
            organizationId: r.get("organizationId"),
            edges: r.get("edges"),
          }));
        });

        return mapResultsToKeys(organizationIds, rows);
      }),
    },
  };
}
