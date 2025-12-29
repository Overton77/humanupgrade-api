import mongoose from "mongoose";
import type { GraphQLContext } from "../context.js";

import { withTypename } from "./utils.js";
import { requireSelfOrAdmin } from "../../services/auth.js";

type DashboardItemParent = {
  entityType: string;
  entityId: string;
  score?: number;
  reasons?: string[];
};

type ContinueEpisodeParent = {
  kind: "EPISODE";
  episodeId: string;
  timestamp?: number;
  lastActivityAt: string;
};

type ContinueEntityParent = {
  kind: "ENTITY";
  entityType: string;
  entityId: string;
  lastActivityAt: string;
};

type ContinueNoneParent = { kind: "NONE" };

export const dashboardFieldResolvers = {
  DashboardContinue: {
    __resolveType(obj: any) {
      if (obj?.kind === "EPISODE") return "ContinueEpisode";
      if (obj?.kind === "ENTITY") return "ContinueEntity";
      return "ContinueNone";
    },
  },

  DashboardItem: {
    entity: async (
      parent: DashboardItemParent,
      _: any,
      ctx: GraphQLContext
    ) => {
      requireSelfOrAdmin(ctx, parent.entityId);
      const loaders = ctx.loaders.entities;

      const id = new mongoose.Types.ObjectId(parent.entityId);

      switch (parent.entityType) {
        case "Product": {
          const doc = await loaders.productById.load(id);
          return withTypename(doc, "Product");
        }
        case "Compound": {
          const doc = await loaders.compoundById.load(id);
          return withTypename(doc, "Compound");
        }
        case "Person": {
          const doc = await loaders.personById.load(id);
          return withTypename(doc, "Person");
        }
        case "Business": {
          const doc = await loaders.businessById.load(id);
          return withTypename(doc, "Business");
        }
        case "Protocol": {
          const doc = await loaders.protocolById.load(id);
          return withTypename(doc, "Protocol");
        }
        case "Episode": {
          const doc = await loaders.episodeById.load(id);
          return withTypename(doc, "Episode");
        }
        case "CaseStudy": {
          const doc = await loaders.caseStudyById.load(id);
          return withTypename(doc, "CaseStudy");
        }
        case "Article": {
          const doc = await loaders.articleById.load(id);
          return withTypename(doc, "Article");
        }
        case "UserProtocol": {
          const doc = await loaders.userProtocolById.load(id);
          return withTypename(doc, "UserProtocol");
        }
        // Add User Protocol
        default:
          return null;
      }
    },
  },

  ContinueEpisode: {
    /**
     * Resolve episode doc for continue
     */
    episode: async (
      parent: ContinueEpisodeParent,
      _: unknown,
      ctx: GraphQLContext
    ) => {
      const loaders = ctx.loaders.entities;
      const id = new mongoose.Types.ObjectId(parent.episodeId);
      const doc = await loaders.episodeById.load(id);
      return doc ? withTypename(doc, "Episode") : null;
    },
  },

  ContinueEntity: {
    /**
     * Resolve underlying entity for continue (non-episode)
     */
    entity: async (
      parent: ContinueEntityParent,
      _: unknown,
      ctx: GraphQLContext
    ) => {
      const loaders = ctx.loaders.entities;
      const id = new mongoose.Types.ObjectId(parent.entityId);

      switch (parent.entityType) {
        case "Product": {
          const doc = await loaders.productById.load(id);
          return withTypename(doc, "Product");
        }
        case "Compound": {
          const doc = await loaders.compoundById.load(id);
          return withTypename(doc, "Compound");
        }
        case "Person": {
          const doc = await loaders.personById.load(id);
          return withTypename(doc, "Person");
        }
        case "Business": {
          const doc = await loaders.businessById.load(id);
          return withTypename(doc, "Business");
        }
        case "Protocol": {
          const doc = await loaders.protocolById.load(id);
          return withTypename(doc, "Protocol");
        }
        case "Episode": {
          const doc = await loaders.episodeById.load(id);
          return withTypename(doc, "Episode");
        }
        case "CaseStudy": {
          const doc = await loaders.caseStudyById.load(id);
          return withTypename(doc, "CaseStudy");
        }
        case "Article": {
          const doc = await loaders.articleById.load(id);
          return withTypename(doc, "Article");
        }
        default:
          return null;
      }
    },
  },
};
