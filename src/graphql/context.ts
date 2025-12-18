import DataLoader from "dataloader";
import mongoose from "mongoose";
import type { IUser } from "../models/User.js";
import { getUserByIdCached, type Role } from "../services/auth.js";

export interface GraphQLContext {
  userId: string | null;
  role: Role | null;

  loaders: {
    userById: DataLoader<string, IUser | null>;
  };

  requestId?: string;
}

export function createContext(params: {
  userId: string | null;
  role: Role | null;
  requestId?: string;
}): GraphQLContext {
  const { userId, role, requestId } = params;

  const userById = new DataLoader<string, IUser | null>(
    async (ids) => {
      const results = await Promise.all(ids.map((id) => getUserByIdCached(id)));
      return results;
    },
    {
      cacheKeyFn: (key) => key.toString(),
    }
  );

  return {
    userId,
    role,
    loaders: { userById },
    requestId,
  };
}

export function isAuthenticated(ctx: GraphQLContext): boolean {
  return !!ctx.userId;
}
export function isAdmin(ctx: GraphQLContext): boolean {
  return ctx.role === "admin";
}
export function requireUserId(ctx: GraphQLContext): string {
  if (!ctx.userId) throw new Error("User not authenticated");
  return ctx.userId;
}
