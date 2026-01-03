import { findAllOrganizations } from "../../services/Organization/organizationService.js";

export const Query = {
  organizations: async (_parent: any, _args: any, _ctx: any) => {
    const organizations = await findAllOrganizations();
    return organizations;
  },
};
