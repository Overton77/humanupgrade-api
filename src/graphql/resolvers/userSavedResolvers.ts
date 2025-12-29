import mongoose from "mongoose";
import { Errors } from "../../lib/errors.js";
import type { UserDoc } from "../../models/User.js";
import type { IUserSaved } from "../../models/UserSaved.js";
import type { GraphQLContext } from "../context.js";
import type { HydratedDocument, ToObjectOptions } from "mongoose";

import type {
  SaveEntityInput,
  UnsaveEntityInput,
  SavedEntitiesFilterInput,
  CursorPageInput,
} from "../inputs/userSavedInputs.js";

import {
  saveEntity,
  unsaveEntity,
  getSavedEntities,
} from "../../services/userSavedService.js";
import { requireSelfOrAdmin, requireAuth } from "../../services/auth.js";
import { withTypename, type HasTypename } from "./utils.js";
import { logActivity } from "../../services/activity/logActivity.js";
import { ActivityEntityType } from "../../models/UserActivity.js";

export const userSavedResolvers = {
  Query: {
    savedEntities: async (
      _: unknown,
      args: { filter?: SavedEntitiesFilterInput; page?: CursorPageInput },
      ctx: GraphQLContext
    ) => {
      requireSelfOrAdmin(ctx, ctx.userId!);
      const user = await ctx.loaders.userById.load(ctx.userId!);
      if (!user) throw Errors.internalError("Failed to load user");

      const { nodes, hasNextPage, endCursor } = await getSavedEntities(
        user._id,
        args.filter,
        args.page
      );

      return {
        edges: nodes.map((n) => ({
          cursor: `${n.createdAt!.getTime()}_${(n as any)._id.toHexString()}`,
          node: n,
        })),
        pageInfo: { hasNextPage, endCursor },
      };
    },
  },

  Mutation: {
    saveEntity: async (
      _: unknown,
      args: { input: SaveEntityInput },
      ctx: GraphQLContext
    ) => {
      requireAuth(ctx);
      const user = await ctx.loaders.userById.load(ctx.userId!);
      if (!user) throw Errors.internalError("Failed to load user");

      const updated = await saveEntity(user._id, args.input);

      await logActivity(ctx, {
        eventType: "SAVE_ENTITY",
        entityType: args.input.targetType as ActivityEntityType,
        entityId: updated.targetRef.id as unknown as mongoose.Types.ObjectId,
        surface: "saved",
        metadata: {
          source: args.input.source ?? "unknown",
        },
      });

      return updated;
    },

    unsaveEntity: async (
      _: unknown,
      args: { input: UnsaveEntityInput },
      ctx: GraphQLContext
    ) => {
      requireSelfOrAdmin(ctx, ctx.userId!);
      const user = await ctx.loaders.userById.load(ctx.userId!);
      if (!user) throw Errors.internalError("Failed to load user");
      const deleted = await unsaveEntity(user._id, args.input);

      await logActivity(ctx, {
        eventType: "UNSAVE_ENTITY",
        entityType: args.input.targetType as ActivityEntityType,
        entityId: new mongoose.Types.ObjectId(args.input.targetId),
        surface: "saved",
      });
      return deleted;
    },
  },

  UserSaved: {
    targetType: (parent: IUserSaved) => parent.targetRef.type,
    targetId: (parent: IUserSaved) => parent.targetRef.id.toHexString(),

    target: async (parent: IUserSaved, _: any, ctx: GraphQLContext) => {
      requireSelfOrAdmin(ctx, parent.userId.toHexString());
      const loaders = ctx.loaders.entities;

      const id = parent.targetRef.id as unknown as mongoose.Types.ObjectId;

      switch (parent.targetRef.type) {
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

        case "UserProtocol": {
          const doc = await loaders.userProtocolById.load(id);
          return withTypename(doc, "UserProtocol");
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

  SavedTargetUnion: {
    __resolveType(obj: HasTypename) {
      return obj.__typename;
    },
  },
};
