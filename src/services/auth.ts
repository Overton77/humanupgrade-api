import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { GraphQLError } from "graphql";
import { env } from "../config/env.js";
import { User, type IUser } from "../models/User.js";

export type Role = "admin" | "user";

export interface AuthTokenPayload {
  userId: string;
  role: Role;
}

export function signAuthToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: "7d" });
}

export function getIdentityFromAuthHeader(
  authHeader?: string
): AuthTokenPayload | null {
  if (!authHeader) return null;

  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) return null;

  try {
    const decoded = jwt.verify(token, env.jwtSecret) as AuthTokenPayload;

    if (!mongoose.Types.ObjectId.isValid(decoded.userId)) return null;

    return decoded;
  } catch {
    return null;
  }
}

const USER_CACHE_TTL_MS = 60_000; // 60s is a good start
const userCache = new Map<string, { value: IUser | null; expiresAt: number }>();

export async function getUserByIdCached(userId: string): Promise<IUser | null> {
  const now = Date.now();
  const cached = userCache.get(userId);

  if (cached && cached.expiresAt > now) return cached.value;

  // Minimal projection is also fine if you want: .select("_id email role name")
  const user = await User.findById(userId).exec();
  const value = user ?? null;

  userCache.set(userId, { value, expiresAt: now + USER_CACHE_TTL_MS });
  return value;
}

export function requireAuth(ctx: { userId?: string | null }): void {
  if (!ctx.userId) {
    throw new GraphQLError("Not Authenticated", {
      extensions: { code: "UNAUTHENTICATED" },
    });
  }
}

export function requireAdmin(ctx: {
  userId?: string | null;
  role?: Role | null;
}): void {
  requireAuth(ctx);
  if (ctx.role !== "admin") {
    throw new GraphQLError("Forbidden", {
      extensions: { code: "FORBIDDEN" },
    });
  }
}

export function requireSelfOrAdmin(
  ctx: { userId?: string | null; role?: Role | null },
  targetUserId: string
): void {
  requireAuth(ctx);
  if (ctx.role === "admin") return;
  if (ctx.userId !== targetUserId) {
    throw new GraphQLError("Forbidden", {
      extensions: { code: "FORBIDDEN" },
    });
  }
}
