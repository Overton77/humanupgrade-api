import { env } from "../../config/env.js";
import {
  OrganizationInput,
  UpdateOrganizationInput,
} from "../inputs/OrganizationInputs.js";
import {
  createOrganizationWithOptionalRelations,
  updateOrganizationWithOptionalRelations,
} from "../../services/Organization/organizationService.js";
import { GraphQLContext } from "../context.js";

const SALT_ROUNDS = 10;

export const Mutation = {
  createOrganization: async (
    _parent: any,
    args: { input: OrganizationInput },
    ctx: GraphQLContext
  ) => {
    const organization = await createOrganizationWithOptionalRelations(
      args.input
    );
    return organization;
  },
  updateOrganization: async (
    _parent: any,
    args: { input: UpdateOrganizationInput },
    _ctx: GraphQLContext
  ) => {
    const organization = await updateOrganizationWithOptionalRelations(
      args.input
    );
    return organization;
  },
};
