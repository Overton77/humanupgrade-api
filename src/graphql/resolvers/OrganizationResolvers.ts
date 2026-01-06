import type { Organization } from "../types/OrganizationModel.js";
import { GraphQLContext } from "../context.js";

type ParentOrg = Partial<Organization> & { organizationId: string };

export const OrganizationResolvers = {
  hasLocation: (parent: ParentOrg, _args: unknown, ctx: GraphQLContext) =>
    ctx.loaders.entities.Organization.organizationHasLocationEdges.load(
      parent.organizationId
    ),

  ownsOrControls: (parent: ParentOrg, _args: unknown, ctx: GraphQLContext) =>
    ctx.loaders.entities.Organization.organizationOwnsOrControlsEdges.load(
      parent.organizationId
    ),

  lists: (parent: ParentOrg, _args: unknown, ctx: GraphQLContext) =>
    ctx.loaders.entities.Organization.organizationListsEdges.load(
      parent.organizationId
    ),

  offersProduct: (parent: ParentOrg, _args: unknown, ctx: GraphQLContext) =>
    ctx.loaders.entities.Organization.organizationOffersProductEdges.load(
      parent.organizationId
    ),

  suppliesCompoundForm: (
    parent: ParentOrg,
    _args: unknown,
    ctx: GraphQLContext
  ) =>
    ctx.loaders.entities.Organization.organizationSuppliesCompoundFormEdges.load(
      parent.organizationId
    ),

  manufactures: (parent: ParentOrg, _args: unknown, ctx: GraphQLContext) =>
    ctx.loaders.entities.Organization.organizationManufacturesEdges.load(
      parent.organizationId
    ),

  manufacturesProduct: (
    parent: ParentOrg,
    _args: unknown,
    ctx: GraphQLContext
  ) =>
    ctx.loaders.entities.Organization.organizationManufacturesProductEdges.load(
      parent.organizationId
    ),

  contractManufacturerForOrganization: (
    parent: ParentOrg,
    _args: unknown,
    ctx: GraphQLContext
  ) =>
    ctx.loaders.entities.Organization.organizationContractManufacturerForOrganizationEdges.load(
      parent.organizationId
    ),

  contractManufacturerForProduct: (
    parent: ParentOrg,
    _args: unknown,
    ctx: GraphQLContext
  ) =>
    ctx.loaders.entities.Organization.organizationContractManufacturerForProductEdges.load(
      parent.organizationId
    ),

  contractManufacturerForCompoundForm: (
    parent: ParentOrg,
    _args: unknown,
    ctx: GraphQLContext
  ) =>
    ctx.loaders.entities.Organization.organizationContractManufacturerForCompoundFormEdges.load(
      parent.organizationId
    ),

  performsManufacturingProcess: (
    parent: ParentOrg,
    _args: unknown,
    ctx: GraphQLContext
  ) =>
    ctx.loaders.entities.Organization.organizationPerformsManufacturingProcessEdges.load(
      parent.organizationId
    ),

  developsPlatform: (parent: ParentOrg, _args: unknown, ctx: GraphQLContext) =>
    ctx.loaders.entities.Organization.organizationDevelopsPlatformEdges.load(
      parent.organizationId
    ),

  usesPlatform: (parent: ParentOrg, _args: unknown, ctx: GraphQLContext) =>
    ctx.loaders.entities.Organization.organizationUsesPlatformEdges.load(
      parent.organizationId
    ),
};
