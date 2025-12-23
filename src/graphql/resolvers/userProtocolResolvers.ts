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
};
