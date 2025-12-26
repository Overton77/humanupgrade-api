import {
  deleteUserProtocol,
  updateUserProtocol,
  getUserProtocolsConnection,
} from "../../services/userProtocolService.js";
import {
  requireSelfOrAdmin,
  requireAuth,
  requireUser,
  requireAdmin,
} from "../../services/auth.js";
import mongoose from "mongoose";
import type { GraphQLContext } from "../context.js";

import {
  UserProtocolCreateInput,
  UserProtocolsFilterInput,
  UserProtocolUpdateInput,
} from "../inputs/userProtocolInputs.js";
import { Errors } from "../../lib/errors.js";
import { createUserProtocol } from "../../services/userProtocolService.js";
import { CursorPageInput } from "../inputs/userSavedInputs.js";
import { encodeCursor } from "../../services/utils/cursor.js";
import { UserProtocolDoc } from "../../models/UserProtocol.js";
import { withTypename, HasTypename } from "./utils.js";
import {
  EvidenceRefType,
  IEvidenceRef,
  IProtocolStepItem,
  ProtocolStepItemType,
} from "../../models/ProtocolParts.js";

export const userProtocolResolvers = {
  Mutation: {
    createUserProtocol: async (
      _: unknown,
      args: { input: UserProtocolCreateInput },
      ctx: GraphQLContext
    ) => {
      requireAuth(ctx);
      const user = await requireUser(ctx);

      if (!user)
        throw Errors.forbidden(
          "Must be authenticated as a user to create a user protocol"
        );
      const protocol = await createUserProtocol(user._id, args.input);

      return protocol;
    },

    updateUserProtocol: async (
      _: unknown,
      args: { input: UserProtocolUpdateInput },
      ctx: GraphQLContext
    ) => {
      requireAuth(ctx);
      const user = await requireUser(ctx);
      if (!user)
        throw Errors.forbidden(
          "Must be authenticated as a user to update a user protocol"
        );
      const protocol = await updateUserProtocol(user._id, args.input);
      return protocol;
    },

    deleteUserProtocol: async (
      _: unknown,
      args: { id: string },
      ctx: GraphQLContext
    ) => {
      requireAuth(ctx);
      const user = await requireUser(ctx);
      if (!user)
        throw Errors.forbidden(
          "Must be authenticated as a user to delete a user protocol"
        );
      const protocol = await deleteUserProtocol(user._id, args.id);
      return protocol;
    },
  },
  Query: {
    myUserProtocols: async (
      _: unknown,
      args: { filter?: UserProtocolsFilterInput; page?: CursorPageInput },
      ctx: GraphQLContext
    ) => {
      const user = await requireUser(ctx);

      const userId = new mongoose.Types.ObjectId(user.id);

      const { nodes, hasNextPage, endCursor } =
        await getUserProtocolsConnection({
          userId,
          filter: args.filter,
          page: args.page,
        });

      return {
        edges: nodes.map((n) => ({
          cursor: `${n.lastEditedAt?.getTime()}_${n._id.toHexString()}`,
          node: n,
        })),
        pageInfo: { hasNextPage, endCursor },
      };
    },
  },
  EvidenceRef: {
    evidenceRefEntity: async (
      parent:
        | IEvidenceRef
        | {
            type: string;
            refId?: string | mongoose.Types.ObjectId;
            episodeId?: string | mongoose.Types.ObjectId;
            url?: string;
            label?: string;
          },
      _: any,
      ctx: GraphQLContext
    ) => {
      const evidenceType = parent.type;
      const loaders = ctx.loaders.entities;

      switch (evidenceType) {
        case "article": {
          if (!parent.refId) return null;
          // Convert string to ObjectId if needed
          const refId =
            typeof parent.refId === "string"
              ? new mongoose.Types.ObjectId(parent.refId)
              : parent.refId;
          const doc = await loaders.articleById.load(refId);
          return withTypename(doc, "Article");
        }
        case "caseStudy": {
          if (!parent.refId) return null;
          // Convert string to ObjectId if needed
          const refId =
            typeof parent.refId === "string"
              ? new mongoose.Types.ObjectId(parent.refId)
              : parent.refId;
          const doc = await loaders.caseStudyById.load(refId);
          return withTypename(doc, "CaseStudy");
        }
        case "episode": {
          // For episodes, use episodeId if available, otherwise refId
          const episodeIdRaw = parent.episodeId || parent.refId;
          if (!episodeIdRaw) return null;
          // Convert string to ObjectId if needed
          const episodeId =
            typeof episodeIdRaw === "string"
              ? new mongoose.Types.ObjectId(episodeIdRaw)
              : episodeIdRaw;
          const doc = await loaders.episodeById.load(episodeId);
          return withTypename(doc, "Episode");
        }
        case "external": {
          // For external, return a simple object with __typename
          return {
            __typename: "External",
            url: parent.url || null,
            label: parent.label || null,
          };
        }
        default:
          return null;
      }
    },
  },
  EvidenceRefEntity: {
    __resolveType: (obj: HasTypename) => {
      return obj.__typename;
    },
  },
  ProtocolStepItem: {
    itemEntity: async (
      parent:
        | IProtocolStepItem
        | {
            type: ProtocolStepItemType;
            refId?: string | mongoose.Types.ObjectId;
          },
      _: any,
      ctx: GraphQLContext
    ) => {
      // ACTION type doesn't have an entity
      if (parent.type === "ACTION" || !parent.refId) {
        return null;
      }

      const loaders = ctx.loaders.entities;
      // Convert string to ObjectId if needed
      const refId =
        typeof parent.refId === "string"
          ? new mongoose.Types.ObjectId(parent.refId)
          : parent.refId;

      switch (parent.type) {
        case "PRODUCT": {
          const doc = await loaders.productById.load(refId);
          return withTypename(doc, "Product");
        }
        case "COMPOUND": {
          const doc = await loaders.compoundById.load(refId);
          return withTypename(doc, "Compound");
        }
        default:
          return null;
      }
    },
  },
  ProtocolStepItemEntity: {
    __resolveType: (obj: HasTypename) => {
      return obj.__typename;
    },
  },
};
