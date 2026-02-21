import DataLoader from "dataloader";
import { executeRead } from "../../db/neo4j/executor.js";
import {
  mapOrganizationResultsToKeys,
  mapProductResultsToKeys,
} from "./utils.js";

import type {
  HasLocationEdge,
  OwnsOrControlsEdge,
  ListsEdge,
  OffersProductEdge,
  SuppliesCompoundFormEdge,
  ManufacturesCompoundFormEdge,
  ManufacturesProductEdge,
  ContractManufacturerForOrganizationEdge,
  ContractManufacturerForCompoundFormEdge,
  ContractManufacturerForProductEdge,
  PerformsManufacturingProcessEdge,
  UsesPlatformEdge,
  DevelopsPlatformEdge,
} from "../types/OrganizationModel.js";
import type {
  DeliversLabTestEdge,
  ImplementsPanelEdge,
  ContainsCompoundFormEdge,
  FollowsPathwayEdge,
} from "../types/ProductModel.js";

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
    organizationManufacturesEdges: DataLoader<
      string,
      ManufacturesCompoundFormEdge[]
    >;
    organizationManufacturesProductEdges: DataLoader<
      string,
      ManufacturesProductEdge[]
    >;
    organizationContractManufacturerForOrganizationEdges: DataLoader<
      string,
      ContractManufacturerForOrganizationEdge[]
    >;
    organizationContractManufacturerForCompoundFormEdges: DataLoader<
      string,
      ContractManufacturerForCompoundFormEdge[]
    >;
    organizationContractManufacturerForProductEdges: DataLoader<
      string,
      ContractManufacturerForProductEdge[]
    >;
    organizationPerformsManufacturingProcessEdges: DataLoader<
      string,
      PerformsManufacturingProcessEdge[]
    >;
    organizationDevelopsPlatformEdges: DataLoader<
      string,
      DevelopsPlatformEdge[]
    >;
    organizationUsesPlatformEdges: DataLoader<string, UsesPlatformEdge[]>;
  };
  Product: {
    productDeliversLabTestEdges: DataLoader<string, DeliversLabTestEdge[]>;
    productImplementsPanelEdges: DataLoader<string, ImplementsPanelEdge[]>;
    productContainsCompoundFormEdges: DataLoader<
      string,
      ContainsCompoundFormEdge[]
    >;
    productFollowsPathwayEdges: DataLoader<string, FollowsPathwayEdge[]>;
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

          return mapOrganizationResultsToKeys(organizationIds, rows);
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

          return mapOrganizationResultsToKeys(organizationIds, rows);
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

          return mapOrganizationResultsToKeys(organizationIds, rows);
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

          return mapOrganizationResultsToKeys(organizationIds, rows);
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

        return mapOrganizationResultsToKeys(organizationIds, rows);
      }),

      organizationManufacturesEdges: new DataLoader<
        string,
        ManufacturesCompoundFormEdge[]
      >(
        async (organizationIds) => {
          const rows = await executeRead(async (tx) => {
            const res = await tx.run(
              `
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
              `,
              { organizationIds }
            );

            return res.records.map((r) => ({
              organizationId: r.get("organizationId"),
              edges: r.get("edges"),
            }));
          });

          return mapOrganizationResultsToKeys(organizationIds, rows);
        },
        { cacheKeyFn: (k) => k }
      ),

      organizationManufacturesProductEdges: new DataLoader<
        string,
        ManufacturesProductEdge[]
      >(
        async (organizationIds) => {
          const rows = await executeRead(async (tx) => {
            const res = await tx.run(
              `
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
              `,
              { organizationIds }
            );

            return res.records.map((r) => ({
              organizationId: r.get("organizationId"),
              edges: r.get("edges"),
            }));
          });

          return mapOrganizationResultsToKeys(organizationIds, rows);
        },
        { cacheKeyFn: (k) => k }
      ),
      // TODO: It is supposed to be CONTRACT_MANUFACTURER_FOR (CompoundForm | Product | Organization).
      // TODO: This requires differentiating in mutations and also returning a Union type

      organizationContractManufacturerForOrganizationEdges: new DataLoader<
        string,
        ContractManufacturerForOrganizationEdge[]
      >(
        async (organizationIds) => {
          const rows = await executeRead(async (tx) => {
            const res = await tx.run(
              `
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
              `,
              { organizationIds }
            );

            return res.records.map((r) => ({
              organizationId: r.get("organizationId"),
              edges: r.get("edges"),
            }));
          });

          return mapOrganizationResultsToKeys(organizationIds, rows);
        },
        { cacheKeyFn: (k) => k }
      ),

      organizationContractManufacturerForProductEdges: new DataLoader<
        string,
        ContractManufacturerForProductEdge[]
      >(
        async (organizationIds) => {
          const rows = await executeRead(async (tx) => {
            const res = await tx.run(
              `
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
              `,
              { organizationIds }
            );

            return res.records.map((r) => ({
              organizationId: r.get("organizationId"),
              edges: r.get("edges"),
            }));
          });

          return mapOrganizationResultsToKeys(organizationIds, rows);
        },
        { cacheKeyFn: (k) => k }
      ),

      organizationContractManufacturerForCompoundFormEdges: new DataLoader<
        string,
        ContractManufacturerForCompoundFormEdge[]
      >(
        async (organizationIds) => {
          const rows = await executeRead(async (tx) => {
            const res = await tx.run(
              `
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
              `,
              { organizationIds }
            );

            return res.records.map((r) => ({
              organizationId: r.get("organizationId"),
              edges: r.get("edges"),
            }));
          });

          return mapOrganizationResultsToKeys(organizationIds, rows);
        },
        { cacheKeyFn: (k) => k }
      ),

      organizationPerformsManufacturingProcessEdges: new DataLoader<
        string,
        PerformsManufacturingProcessEdge[]
      >(
        async (organizationIds) => {
          const rows = await executeRead(async (tx) => {
            const res = await tx.run(
              `
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
              `,
              { organizationIds }
            );

            return res.records.map((r) => ({
              organizationId: r.get("organizationId"),
              edges: r.get("edges"),
            }));
          });

          return mapOrganizationResultsToKeys(organizationIds, rows);
        },
        { cacheKeyFn: (k) => k }
      ),

      organizationDevelopsPlatformEdges: new DataLoader<
        string,
        DevelopsPlatformEdge[]
      >(
        async (organizationIds) => {
          const rows = await executeRead(async (tx) => {
            const res = await tx.run(
              `
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
              `,
              { organizationIds }
            );

            return res.records.map((r) => ({
              organizationId: r.get("organizationId"),
              edges: r.get("edges"),
            }));
          });

          return mapOrganizationResultsToKeys(organizationIds, rows);
        },
        { cacheKeyFn: (k) => k }
      ),

      organizationUsesPlatformEdges: new DataLoader<string, UsesPlatformEdge[]>(
        async (organizationIds) => {
          const rows = await executeRead(async (tx) => {
            const res = await tx.run(
              `
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
              `,
              { organizationIds }
            );

            return res.records.map((r) => ({
              organizationId: r.get("organizationId"),
              edges: r.get("edges"),
            }));
          });

          return mapOrganizationResultsToKeys(organizationIds, rows);
        },
        { cacheKeyFn: (k) => k }
      ),
    },
    Product: {
      productDeliversLabTestEdges: new DataLoader<
        string,
        DeliversLabTestEdge[]
      >(
        async (productIds) => {
          const rows = await executeRead(async (tx) => {
            const res = await tx.run(
              `
              UNWIND $productIds AS productId

              OPTIONAL MATCH (p:Product {productId: productId})
                OPTIONAL MATCH (p)-[dlt:DELIVERS_LAB_TEST]->(lt:LabTest)

              WITH productId,
                collect(
                  CASE WHEN lt IS NULL THEN NULL ELSE {
                    labTest: properties(lt),
                    role: dlt.role,
                    quantity: dlt.quantity,
                    componentName: dlt.componentName,
                    claimIds: coalesce(dlt.claimIds, []),
                    // DATETIME -> string
                    validAt: toString(dlt.validAt),
                    invalidAt: toString(dlt.invalidAt),
                    expiredAt: toString(dlt.expiredAt),
                    createdAt: toString(dlt.createdAt)
                  } END
                ) AS edges

              RETURN productId, [e IN edges WHERE e IS NOT NULL] AS edges
              `,
              { productIds }
            );

            return res.records.map((r) => ({
              productId: r.get("productId"),
              edges: r.get("edges"),
            }));
          });

          return mapProductResultsToKeys(productIds, rows);
        },
        { cacheKeyFn: (k) => k }
      ),

      productImplementsPanelEdges: new DataLoader<string, ImplementsPanelEdge[]>(
        async (productIds) => {
          const rows = await executeRead(async (tx) => {
            const res = await tx.run(
              `
              UNWIND $productIds AS productId

              OPTIONAL MATCH (p:Product {productId: productId})
                OPTIONAL MATCH (p)-[ip:IMPLEMENTS_PANEL]->(pd:PanelDefinition)

              WITH productId,
                collect(
                  CASE WHEN pd IS NULL THEN NULL ELSE {
                    panelDefinition: properties(pd),
                    panelRole: ip.panelRole,
                    versionLabel: ip.versionLabel,
                    claimIds: coalesce(ip.claimIds, []),
                    // DATETIME -> string
                    validAt: toString(ip.validAt),
                    invalidAt: toString(ip.invalidAt),
                    expiredAt: toString(ip.expiredAt),
                    createdAt: toString(ip.createdAt)
                  } END
                ) AS edges

              RETURN productId, [e IN edges WHERE e IS NOT NULL] AS edges
              `,
              { productIds }
            );

            return res.records.map((r) => ({
              productId: r.get("productId"),
              edges: r.get("edges"),
            }));
          });

          return mapProductResultsToKeys(productIds, rows);
        },
        { cacheKeyFn: (k) => k }
      ),

      productContainsCompoundFormEdges: new DataLoader<
        string,
        ContainsCompoundFormEdge[]
      >(
        async (productIds) => {
          const rows = await executeRead(async (tx) => {
            const res = await tx.run(
              `
              UNWIND $productIds AS productId

              OPTIONAL MATCH (p:Product {productId: productId})
                OPTIONAL MATCH (p)-[ccf:CONTAINS_COMPOUND_FORM]->(cf:CompoundForm)

              WITH productId,
                collect(
                  CASE WHEN cf IS NULL THEN NULL ELSE {
                    compoundForm: properties(cf),
                    dose: ccf.dose,
                    doseUnit: ccf.doseUnit,
                    role: ccf.role,
                    standardizedTo: ccf.standardizedTo,
                    claimIds: coalesce(ccf.claimIds, []),
                    // DATETIME -> string
                    validAt: toString(ccf.validAt),
                    invalidAt: toString(ccf.invalidAt),
                    expiredAt: toString(ccf.expiredAt),
                    createdAt: toString(ccf.createdAt)
                  } END
                ) AS edges

              RETURN productId, [e IN edges WHERE e IS NOT NULL] AS edges
              `,
              { productIds }
            );

            return res.records.map((r) => ({
              productId: r.get("productId"),
              edges: r.get("edges"),
            }));
          });

          return mapProductResultsToKeys(productIds, rows);
        },
        { cacheKeyFn: (k) => k }
      ),

      productFollowsPathwayEdges: new DataLoader<string, FollowsPathwayEdge[]>(
        async (productIds) => {
          const rows = await executeRead(async (tx) => {
            const res = await tx.run(
              `
              UNWIND $productIds AS productId

              OPTIONAL MATCH (p:Product {productId: productId})
                OPTIONAL MATCH (p)-[fp:FOLLOWS_PATHWAY]->(rp:RegulatoryPathway)

              WITH productId,
                collect(
                  CASE WHEN rp IS NULL THEN NULL ELSE {
                    regulatoryPathway: properties(rp),
                    jurisdictionId: fp.jurisdictionId,
                    claimIds: coalesce(fp.claimIds, []),
                    // DATETIME -> string
                    validAt: toString(fp.validAt),
                    invalidAt: toString(fp.invalidAt),
                    expiredAt: toString(fp.expiredAt),
                    createdAt: toString(fp.createdAt)
                  } END
                ) AS edges

              RETURN productId, [e IN edges WHERE e IS NOT NULL] AS edges
              `,
              { productIds }
            );

            return res.records.map((r) => ({
              productId: r.get("productId"),
              edges: r.get("edges"),
            }));
          });

          return mapProductResultsToKeys(productIds, rows);
        },
        { cacheKeyFn: (k) => k }
      ),
    },
  };
}
