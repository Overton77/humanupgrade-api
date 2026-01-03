import { env } from "../../config/env.js";
import { OrganizationInput } from "../inputs/OrganizationInputs.js";
import { createOrganizationWithOptionalRelations } from "../../services/Organization/organizationService.js";

const SALT_ROUNDS = 10;

export const Mutation = {
  createOrganization: async (
    _parent: any,
    args: { input: OrganizationInput },
    _ctx: any
  ) => {
    const organization = await createOrganizationWithOptionalRelations(
      args.input
    );
    return organization;
  },
};
