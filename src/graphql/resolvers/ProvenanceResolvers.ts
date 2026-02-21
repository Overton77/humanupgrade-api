import { GraphQLContext } from "../context.js";
import { UpsertResearchPlanRefInput } from "../inputs/ResearchPlanRefInputs.js";
import {
  UpsertResearchRunRefInput,
  LinkResearchRunUsesPlanInput,
} from "../inputs/ResearchRunRefInputs.js";
import { ResearchPlanRef } from "../types/ResearchPlanRefModel.js";
import { ResearchRunRef } from "../types/ResearchRunRefModel.js";
import {
  upsertResearchPlanRef,
  upsertResearchRunRef,
  linkResearchRunUsesPlan,
} from "../../services/Provenance/provenanceService.js";

export const ProvenanceMutations = {
  upsertResearchPlanRef: async (
    _parent: unknown,
    args: { input: UpsertResearchPlanRefInput },
    _ctx: GraphQLContext
  ): Promise<ResearchPlanRef> => {
    const researchPlanRef = await upsertResearchPlanRef(args.input);
    return researchPlanRef;
  },

  upsertResearchRunRef: async (
    _parent: unknown,
    args: { input: UpsertResearchRunRefInput },
    _ctx: GraphQLContext
  ): Promise<ResearchRunRef> => {
    const researchRunRef = await upsertResearchRunRef(args.input);
    return researchRunRef;
  },

  linkResearchRunUsesPlan: async (
    _parent: unknown,
    args: { input: LinkResearchRunUsesPlanInput },
    _ctx: GraphQLContext
  ): Promise<ResearchRunRef> => {
    const researchRunRef = await linkResearchRunUsesPlan(args.input);
    return researchRunRef;
  },
};
