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
  EmploysEdge,
  FoundedByEdge,
  HasBoardMemberEdge,
  HasScientificAdvisorEdge,
  HasExecutiveRoleEdge,
} from "../types/OrganizationModel.js";
import type {
  DeliversLabTestEdge,
  ImplementsPanelEdge,
  ContainsCompoundFormEdge,
  FollowsPathwayEdge,
} from "../types/ProductModel.js";
import { OrganizationEdgeStatements } from "./statements/organizationEdgeStatements.js";

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
    organizationEmploysEdges: DataLoader<string, EmploysEdge[]>;
    organizationFoundedByEdges: DataLoader<string, FoundedByEdge[]>;
    organizationHasBoardMemberEdges: DataLoader<string, HasBoardMemberEdge[]>;
    organizationHasScientificAdvisorEdges: DataLoader<
      string,
      HasScientificAdvisorEdge[]
    >;
    organizationHasExecutiveRoleEdges: DataLoader<
      string,
      HasExecutiveRoleEdge[]
    >;
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
              `${OrganizationEdgeStatements.organizationHasLocationEdgesCypher}`,
              { organizationIds },
            );

            return res.records.map((r) => ({
              organizationId: r.get("organizationId"),
              edges: r.get("edges"),
            }));
          });

          return mapOrganizationResultsToKeys(organizationIds, rows);
        },
        { cacheKeyFn: (k) => k },
      ),

      organizationOwnsOrControlsEdges: new DataLoader<
        string,
        OwnsOrControlsEdge[]
      >(
        async (organizationIds) => {
          const rows = await executeRead(async (tx) => {
            const res = await tx.run(
              `${OrganizationEdgeStatements.organizationOwnsOrControlsEdgesCypher}`,
              { organizationIds },
            );

            return res.records.map((r) => ({
              organizationId: r.get("organizationId"),
              edges: r.get("edges"),
            }));
          });

          return mapOrganizationResultsToKeys(organizationIds, rows);
        },
        { cacheKeyFn: (k) => k },
      ),

      organizationListsEdges: new DataLoader<string, ListsEdge[]>(
        async (organizationIds) => {
          const rows = await executeRead(async (tx) => {
            const res = await tx.run(
              `${OrganizationEdgeStatements.organizationListsListingEdgesCypher}`,
              { organizationIds },
            );

            return res.records.map((r) => ({
              organizationId: r.get("organizationId"),
              edges: r.get("edges"),
            }));
          });

          return mapOrganizationResultsToKeys(organizationIds, rows);
        },
        { cacheKeyFn: (k) => k },
      ),

      organizationOffersProductEdges: new DataLoader<
        string,
        OffersProductEdge[]
      >(
        async (organizationIds) => {
          const rows = await executeRead(async (tx) => {
            const res = await tx.run(
              `${OrganizationEdgeStatements.organizationOffersProductEdgesCypher}`,
              { organizationIds },
            );

            return res.records.map((r) => ({
              organizationId: r.get("organizationId"),
              edges: r.get("edges"),
            }));
          });

          return mapOrganizationResultsToKeys(organizationIds, rows);
        },
        { cacheKeyFn: (k) => k },
      ),

      organizationSuppliesCompoundFormEdges: new DataLoader<
        string,
        SuppliesCompoundFormEdge[]
      >(async (organizationIds) => {
        const rows = await executeRead(async (tx) => {
          const res = await tx.run(
            `${OrganizationEdgeStatements.organizationSuppliesCompoundFormEdgesCypher}`,
            { organizationIds },
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
              `${OrganizationEdgeStatements.organizationManufacturesEdgesCypher}`,
              { organizationIds },
            );

            return res.records.map((r) => ({
              organizationId: r.get("organizationId"),
              edges: r.get("edges"),
            }));
          });

          return mapOrganizationResultsToKeys(organizationIds, rows);
        },
        { cacheKeyFn: (k) => k },
      ),

      organizationManufacturesProductEdges: new DataLoader<
        string,
        ManufacturesProductEdge[]
      >(
        async (organizationIds) => {
          const rows = await executeRead(async (tx) => {
            const res = await tx.run(
              `${OrganizationEdgeStatements.organizationManufacturesProductEdgesCypher}`,
              { organizationIds },
            );

            return res.records.map((r) => ({
              organizationId: r.get("organizationId"),
              edges: r.get("edges"),
            }));
          });

          return mapOrganizationResultsToKeys(organizationIds, rows);
        },
        { cacheKeyFn: (k) => k },
      ),
      // TODO: Keeping explicit contract manufacturer FOR Model for now.

      organizationContractManufacturerForOrganizationEdges: new DataLoader<
        string,
        ContractManufacturerForOrganizationEdge[]
      >(
        async (organizationIds) => {
          const rows = await executeRead(async (tx) => {
            const res = await tx.run(
              `${OrganizationEdgeStatements.organizationContractManufacturerForOrganizationEdgesCypher}`,
              { organizationIds },
            );

            return res.records.map((r) => ({
              organizationId: r.get("organizationId"),
              edges: r.get("edges"),
            }));
          });

          return mapOrganizationResultsToKeys(organizationIds, rows);
        },
        { cacheKeyFn: (k) => k },
      ),

      organizationContractManufacturerForProductEdges: new DataLoader<
        string,
        ContractManufacturerForProductEdge[]
      >(
        async (organizationIds) => {
          const rows = await executeRead(async (tx) => {
            const res = await tx.run(
              `${OrganizationEdgeStatements.organizationContractManufacturerForProductEdgesCypher}`,
              { organizationIds },
            );

            return res.records.map((r) => ({
              organizationId: r.get("organizationId"),
              edges: r.get("edges"),
            }));
          });

          return mapOrganizationResultsToKeys(organizationIds, rows);
        },
        { cacheKeyFn: (k) => k },
      ),

      organizationContractManufacturerForCompoundFormEdges: new DataLoader<
        string,
        ContractManufacturerForCompoundFormEdge[]
      >(
        async (organizationIds) => {
          const rows = await executeRead(async (tx) => {
            const res = await tx.run(
              `${OrganizationEdgeStatements.organizationContractManufacturerForCompoundFormEdgesCypher}`,
              { organizationIds },
            );

            return res.records.map((r) => ({
              organizationId: r.get("organizationId"),
              edges: r.get("edges"),
            }));
          });

          return mapOrganizationResultsToKeys(organizationIds, rows);
        },
        { cacheKeyFn: (k) => k },
      ),

      organizationPerformsManufacturingProcessEdges: new DataLoader<
        string,
        PerformsManufacturingProcessEdge[]
      >(
        async (organizationIds) => {
          const rows = await executeRead(async (tx) => {
            const res = await tx.run(
              `${OrganizationEdgeStatements.organizationPerformsManufacturingProcessEdgesCypher}`,
              { organizationIds },
            );

            return res.records.map((r) => ({
              organizationId: r.get("organizationId"),
              edges: r.get("edges"),
            }));
          });

          return mapOrganizationResultsToKeys(organizationIds, rows);
        },
        { cacheKeyFn: (k) => k },
      ),

      organizationDevelopsPlatformEdges: new DataLoader<
        string,
        DevelopsPlatformEdge[]
      >(
        async (organizationIds) => {
          const rows = await executeRead(async (tx) => {
            const res = await tx.run(
              `${OrganizationEdgeStatements.organizationDevelopsPlatformEdgesCypher}`,
              { organizationIds },
            );

            return res.records.map((r) => ({
              organizationId: r.get("organizationId"),
              edges: r.get("edges"),
            }));
          });

          return mapOrganizationResultsToKeys(organizationIds, rows);
        },
        { cacheKeyFn: (k) => k },
      ),

      organizationUsesPlatformEdges: new DataLoader<string, UsesPlatformEdge[]>(
        async (organizationIds) => {
          const rows = await executeRead(async (tx) => {
            const res = await tx.run(
              `${OrganizationEdgeStatements.organizationUsesPlatformEdgesCypher}`,

              { organizationIds },
            );

            return res.records.map((r) => ({
              organizationId: r.get("organizationId"),
              edges: r.get("edges"),
            }));
          });

          return mapOrganizationResultsToKeys(organizationIds, rows);
        },
        { cacheKeyFn: (k) => k },
      ),

      organizationEmploysEdges: new DataLoader<string, EmploysEdge[]>(
        async (organizationIds) => {
          const rows = await executeRead(async (tx) => {
            const res = await tx.run(
              `${OrganizationEdgeStatements.organizationEmploysEdgesCypher}`,
              { organizationIds },
            );
            return res.records.map((r) => ({
              organizationId: r.get("organizationId"),
              edges: r.get("edges"),
            }));
          });
          return mapOrganizationResultsToKeys(organizationIds, rows);
        },
        { cacheKeyFn: (k) => k },
      ),

      organizationFoundedByEdges: new DataLoader<string, FoundedByEdge[]>(
        async (organizationIds) => {
          const rows = await executeRead(async (tx) => {
            const res = await tx.run(
              `${OrganizationEdgeStatements.organizationFoundedByEdgesCypher}`,
              { organizationIds },
            );
            return res.records.map((r) => ({
              organizationId: r.get("organizationId"),
              edges: r.get("edges"),
            }));
          });
          return mapOrganizationResultsToKeys(organizationIds, rows);
        },
        { cacheKeyFn: (k) => k },
      ),

      organizationHasBoardMemberEdges: new DataLoader<
        string,
        HasBoardMemberEdge[]
      >(
        async (organizationIds) => {
          const rows = await executeRead(async (tx) => {
            const res = await tx.run(
              `${OrganizationEdgeStatements.organizationHasBoardMemberEdgesCypher}`,
              { organizationIds },
            );
            return res.records.map((r) => ({
              organizationId: r.get("organizationId"),
              edges: r.get("edges"),
            }));
          });
          return mapOrganizationResultsToKeys(organizationIds, rows);
        },
        { cacheKeyFn: (k) => k },
      ),

      organizationHasScientificAdvisorEdges: new DataLoader<
        string,
        HasScientificAdvisorEdge[]
      >(
        async (organizationIds) => {
          const rows = await executeRead(async (tx) => {
            const res = await tx.run(
              `${OrganizationEdgeStatements.organizationHasScientificAdvisorEdgesCypher}`,
              { organizationIds },
            );
            return res.records.map((r) => ({
              organizationId: r.get("organizationId"),
              edges: r.get("edges"),
            }));
          });
          return mapOrganizationResultsToKeys(organizationIds, rows);
        },
        { cacheKeyFn: (k) => k },
      ),

      organizationHasExecutiveRoleEdges: new DataLoader<
        string,
        HasExecutiveRoleEdge[]
      >(
        async (organizationIds) => {
          const rows = await executeRead(async (tx) => {
            const res = await tx.run(
              `${OrganizationEdgeStatements.organizationHasExecutiveRoleEdgesCypher}`,
              { organizationIds },
            );
            return res.records.map((r) => ({
              organizationId: r.get("organizationId"),
              edges: r.get("edges"),
            }));
          });
          return mapOrganizationResultsToKeys(organizationIds, rows);
        },
        { cacheKeyFn: (k) => k },
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
              { productIds },
            );

            return res.records.map((r) => ({
              productId: r.get("productId"),
              edges: r.get("edges"),
            }));
          });

          return mapProductResultsToKeys(productIds, rows);
        },
        { cacheKeyFn: (k) => k },
      ),

      productImplementsPanelEdges: new DataLoader<
        string,
        ImplementsPanelEdge[]
      >(
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
              { productIds },
            );

            return res.records.map((r) => ({
              productId: r.get("productId"),
              edges: r.get("edges"),
            }));
          });

          return mapProductResultsToKeys(productIds, rows);
        },
        { cacheKeyFn: (k) => k },
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
              { productIds },
            );

            return res.records.map((r) => ({
              productId: r.get("productId"),
              edges: r.get("edges"),
            }));
          });

          return mapProductResultsToKeys(productIds, rows);
        },
        { cacheKeyFn: (k) => k },
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
              { productIds },
            );

            return res.records.map((r) => ({
              productId: r.get("productId"),
              edges: r.get("edges"),
            }));
          });

          return mapProductResultsToKeys(productIds, rows);
        },
        { cacheKeyFn: (k) => k },
      ),
    },
  };
}
