import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { env } from "../config/env.js";
import { User, type IUser } from "../models/User.js";
import { Errors } from "../lib/errors.js";

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

const USER_CACHE_TTL_MS = 60_000;
const userCache = new Map<string, { value: IUser | null; expiresAt: number }>();

export async function getUserByIdCached(userId: string): Promise<IUser | null> {
  const now = Date.now();
  const cached = userCache.get(userId);

  if (cached && cached.expiresAt > now) return cached.value;

  const user = await User.findById(userId).exec();
  const value = user ?? null;

  userCache.set(userId, { value, expiresAt: now + USER_CACHE_TTL_MS });
  return value;
}

/**
 * Minimal shape for GraphQLContext guards (so auth.ts doesn't import graphql/context.ts)
 */
export interface AuthContextLike {
  userId: string | null;
  role: Role | null;
  loaders?: {
    userById?: { load: (id: string) => Promise<IUser | null> };
  };
}

export function isAuthenticated(ctx: AuthContextLike): boolean {
  return !!ctx.userId;
}

export function isAdmin(ctx: AuthContextLike): boolean {
  return ctx.role === "admin";
}

/**
 * Require authenticated user; returns userId (string)
 */
export function requireAuth(ctx: AuthContextLike): string {
  if (!ctx.userId) throw Errors.unauthenticated();
  return ctx.userId;
}

/**
 * Require admin role
 */
export function requireAdmin(ctx: AuthContextLike): void {
  requireAuth(ctx);
  if (!isAdmin(ctx)) throw Errors.forbidden("Admin access required");
}

/**
 * Require the request user to match target user, unless admin.
 */
export function requireSelfOrAdmin(
  ctx: AuthContextLike,
  targetUserId: string
): void {
  requireAuth(ctx);
  if (isAdmin(ctx)) return;
  if (ctx.userId !== targetUserId) throw Errors.forbidden();
}

/**
 * Optional helper: require authenticated + load the actual user doc (via loader if available).
 * This keeps your resolver code DRY.
 */
export async function requireUser(ctx: AuthContextLike): Promise<IUser> {
  const userId = requireAuth(ctx);

  // Prefer DataLoader if present
  const loader = ctx.loaders?.userById;
  const user = loader
    ? await loader.load(userId)
    : await getUserByIdCached(userId);

  if (!user) {
    // This implies token references a user that doesn't exist anymore
    throw Errors.notFound("User", userId);
  }

  return user;
}
