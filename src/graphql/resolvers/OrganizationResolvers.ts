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
};
