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
      return saveEntity(user._id, args.input);
    },

    unsaveEntity: async (
      _: unknown,
      args: { input: UnsaveEntityInput },
      ctx: GraphQLContext
    ) => {
      requireSelfOrAdmin(ctx, ctx.userId!);
      const user = await ctx.loaders.userById.load(ctx.userId!);
      if (!user) throw Errors.internalError("Failed to load user");
      return unsaveEntity(user._id, args.input);
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
        case "product": {
          const doc = await loaders.productById.load(id);
          return withTypename(doc, "Product");
        }
        case "compound": {
          const doc = await loaders.compoundById.load(id);
          return withTypename(doc, "Compound");
        }
        case "person": {
          const doc = await loaders.personById.load(id);
          return withTypename(doc, "Person");
        }
        case "business": {
          const doc = await loaders.businessById.load(id);
          return withTypename(doc, "Business");
        }
        case "protocol": {
          const doc = await loaders.protocolById.load(id);
          return withTypename(doc, "Protocol");
        }
        case "episode": {
          const doc = await loaders.episodeById.load(id);
          return withTypename(doc, "Episode");
        }
        case "caseStudy": {
          const doc = await loaders.caseStudyById.load(id);
          return withTypename(doc, "CaseStudy");
        }
        case "article": {
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
