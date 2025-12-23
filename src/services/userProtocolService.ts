import mongoose from "mongoose";
import { withTransaction } from "../lib/transactions.js";
import { validateInput } from "../lib/validation.js";
import { Errors } from "../lib/errors.js";

import {
  UserProtocol,
  type IUserProtocol,
  type UserProtocolDoc,
  type UserProtocolModel,
} from "../models/UserProtocol.js";

import { Protocol } from "../models/Protocol.js";
import { BaseProtocolService } from "./BaseProtocolService.js";

import type {
  UserProtocolCreateInput,
  UserProtocolUpdateInput,
  UserProtocolsFilterInput,
} from "../graphql/inputs/userProtocolInputs.js";

import {
  UserProtocolCreateInputSchema,
  UserProtocolUpdateInputSchema,
  UserProtocolsFilterInputSchema,
} from "../graphql/inputs/schemas/userProtocolSchemas.js";

import type { CursorPageInput } from "../graphql/inputs/userSavedInputs.js"; // reuse if you want cursor paging style
import { decodeCursor, encodeCursor } from "./utils/cursor.js";

/**
 * UserProtocolService:
 * - user-owned protocols
 * - overwrite structured arrays from client form
 * - validate refs exist
 */
class UserProtocolService extends BaseProtocolService<
  IUserProtocol,
  UserProtocolDoc,
  UserProtocolModel
> {
  constructor() {
    super(UserProtocol, "userProtocolService", "UserProtocol");
  }

  async createUserProtocol(
    userId: mongoose.Types.ObjectId,
    input: UserProtocolCreateInput
  ): Promise<IUserProtocol> {
    const v = validateInput(
      UserProtocolCreateInputSchema,
      input,
      "UserProtocolCreateInput"
    );

    return withTransaction(
      async (session) => {
        // Validate sourceProtocolId if present
        if (v.sourceProtocolId) {
          await this.validateEntities(
            Protocol,
            [v.sourceProtocolId],
            "Protocol",
            {
              session,
            }
          );
        }

        // Validate referenced entities inside steps/evidence
        await this.validateStepsStructured(v.stepsStructured, session);
        await this.validateEvidenceRefs(v.evidenceRefs, session);

        const stepsStructured = this.normalizeStepsStructured(
          v.stepsStructured
        );
        const evidenceRefs = this.normalizeEvidenceRefs(v.evidenceRefs);
        const safety = this.normalizeSafetyBucket(v.safety);

        const doc = new UserProtocol({
          userId,
          title: v.title,
          goalType: v.goalType,
          status: v.status ?? "draft",
          sourceProtocolId: v.sourceProtocolId
            ? new mongoose.Types.ObjectId(v.sourceProtocolId)
            : undefined,

          stepsStructured,
          evidenceRefs,
          safety,

          lastEditedAt: new Date(),
        });

        await doc.save({ session });
        return doc;
      },
      { operation: "createUserProtocol", userId: userId.toHexString() }
    );
  }

  async updateUserProtocol(
    userId: mongoose.Types.ObjectId,
    input: UserProtocolUpdateInput
  ): Promise<IUserProtocol> {
    const v = validateInput(
      UserProtocolUpdateInputSchema,
      input,
      "UserProtocolUpdateInput"
    );

    return withTransaction(
      async (session) => {
        const doc = await UserProtocol.findById(v.id).session(session);
        if (!doc) throw Errors.notFound("UserProtocol", v.id);

        // Ownership
        if (doc.userId.toHexString() !== userId.toHexString()) {
          throw Errors.forbidden("Not allowed to edit this protocol");
        }

        // Scalars
        if (v.title !== undefined) doc.title = v.title;
        if (v.goalType !== undefined) doc.goalType = v.goalType;
        if (v.status !== undefined) doc.status = v.status;

        if (v.sourceProtocolId !== undefined) {
          if (!v.sourceProtocolId) {
            // allow clearing by passing null? (schema currently ObjectId optional, so clearing requires separate flag)
            // If you want clearing, change schema to z.union([ObjectIdSchema, z.literal(null)])
            // For now, treat undefined as no-op; any string as set.
            doc.sourceProtocolId = undefined;
          } else {
            await this.validateEntities(
              Protocol,
              [v.sourceProtocolId],
              "Protocol",
              { session }
            );
            doc.sourceProtocolId = new mongoose.Types.ObjectId(
              v.sourceProtocolId
            );
          }
        }

        // Overwrite structured arrays if provided (client form is source of truth)
        if (v.stepsStructured !== undefined) {
          await this.validateStepsStructured(v.stepsStructured, session);
          doc.stepsStructured = this.normalizeStepsStructured(
            v.stepsStructured
          );
        }

        if (v.evidenceRefs !== undefined) {
          await this.validateEvidenceRefs(v.evidenceRefs, session);
          doc.evidenceRefs = this.normalizeEvidenceRefs(v.evidenceRefs);
        }

        if (v.safety !== undefined) {
          doc.safety = this.normalizeSafetyBucket(v.safety);
        }

        doc.lastEditedAt = new Date();

        await doc.save({ session });
        return doc;
      },
      {
        operation: "updateUserProtocol",
        userId: userId.toHexString(),
        protocolId: v.id,
      }
    );
  }

  async deleteUserProtocol(
    userId: mongoose.Types.ObjectId,
    protocolId: string
  ): Promise<boolean> {
    return withTransaction(
      async (session) => {
        const doc = await UserProtocol.findById(protocolId).session(session);
        if (!doc) throw Errors.notFound("UserProtocol", protocolId);

        if (doc.userId.toHexString() !== userId.toHexString()) {
          throw Errors.forbidden("Not allowed to delete this protocol");
        }

        await UserProtocol.deleteOne({ _id: doc._id }).session(session);
        return true;
      },
      {
        operation: "deleteUserProtocol",
        userId: userId.toHexString(),
        protocolId,
      }
    );
  }
  async getUserProtocolsConnection(params: {
    userId: mongoose.Types.ObjectId;
    filter?: UserProtocolsFilterInput;
    page?: CursorPageInput;
  }): Promise<{
    nodes: UserProtocolDoc[];
    hasNextPage: boolean;
    endCursor: string | null;
  }> {
    const { userId, filter, page } = params;

    const f = filter
      ? validateInput(
          UserProtocolsFilterInputSchema,
          filter,
          "UserProtocolsFilterInput"
        )
      : undefined;

    const firstRaw = page?.first ?? 20;
    const first = Math.min(Math.max(firstRaw, 1), 50);
    const after = page?.after ?? null;

    const baseQuery: Record<string, unknown> = { userId };

    if (f?.status) baseQuery.status = f.status;
    if (f?.goalType) baseQuery.goalType = f.goalType;
    if (f?.search) baseQuery.title = { $regex: f.search, $options: "i" };

    // Cursor condition
    // Sort: lastEditedAt desc, _id desc
    // After cursor means: (lastEditedAt < t) OR (lastEditedAt == t AND _id < id)
    let cursorQuery: Record<string, unknown> = {};
    if (after) {
      const { t, id } = decodeCursor(after);

      cursorQuery = {
        $or: [
          { lastEditedAt: { $lt: t } },
          { lastEditedAt: t, _id: { $lt: id } },
        ],
      };
    }

    // We need lastEditedAt to be non-null for stable cursor.
    // Ensure on create/update you always set it.
    // Also guard in query just in case legacy rows exist.
    const finalQuery: Record<string, unknown> = {
      ...baseQuery,
      lastEditedAt: { $ne: null },
      ...(after ? cursorQuery : {}),
    };

    const docs = await UserProtocol.find(finalQuery)
      .sort({ lastEditedAt: -1, _id: -1 })
      .limit(first + 1) // fetch one extra to compute hasNextPage
      .exec();

    const hasNextPage = docs.length > first;
    const nodes = hasNextPage ? docs.slice(0, first) : docs;

    const endCursor =
      nodes.length > 0
        ? encodeCursor(
            nodes[nodes.length - 1].lastEditedAt!,
            nodes[nodes.length - 1]._id
          )
        : null;

    return { nodes, hasNextPage, endCursor };
  }
}

export const userProtocolService = new UserProtocolService();

export const createUserProtocol = (
  userId: mongoose.Types.ObjectId,
  input: UserProtocolCreateInput
) => userProtocolService.createUserProtocol(userId, input);

export const updateUserProtocol = (
  userId: mongoose.Types.ObjectId,
  input: UserProtocolUpdateInput
) => userProtocolService.updateUserProtocol(userId, input);

export const deleteUserProtocol = (
  userId: mongoose.Types.ObjectId,
  protocolId: string
) => userProtocolService.deleteUserProtocol(userId, protocolId);

export const getUserProtocolsConnection = (params: {
  userId: mongoose.Types.ObjectId;
  filter?: UserProtocolsFilterInput;
  page?: CursorPageInput;
}) => userProtocolService.getUserProtocolsConnection(params);
