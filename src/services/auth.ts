import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { env } from "../config/env.js";
import { User, type IUser } from "../models/User.js";
import { Errors } from "../lib/errors.js";
import { GraphQLContext } from "../graphql/context.js";

export type Role = "admin" | "user";

export interface AuthTokenPayload {
  userId: string;
  role: Role;
}

export function signAccessToken(payload: AuthTokenPayload): string {
  const options: jwt.SignOptions = {
    expiresIn: env.accessTokenTtl ?? "60m",
  };
  return jwt.sign(payload, env.jwtSecret, options);
}

export function setRefreshCookieFromContext(
  ctx: GraphQLContext,
  value: string,
  expiresAt: Date
) {
  const res = ctx.res;
  if (!res) return;

  res.cookie(env.refreshCookieName, value, {
    httpOnly: true,
    secure: env.cookieSecure === true,
    sameSite: (env.cookieSameSite as "lax" | "strict" | "none") ?? "lax",
    path: "/auth/refresh",
    expires: expiresAt,
    domain: env.cookieDomain || undefined,
  });
}

export function getIdentityFromAuthHeader(
  authHeader?: string
): AuthTokenPayload | null {
  if (!authHeader) return null;

  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) return null;

  try {
    const decoded = jwt.verify(
      token,
      env.jwtSecret as jwt.Secret
    ) as AuthTokenPayload;
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

export function isAuthenticated(ctx: GraphQLContext): boolean {
  return !!ctx.userId;
}

export function isAdmin(ctx: GraphQLContext): boolean {
  return ctx.role === "admin";
}

export function requireAuth(ctx: GraphQLContext): string {
  if (!ctx.userId) throw Errors.unauthenticated();
  return ctx.userId;
}

export function requireAdmin(ctx: GraphQLContext): void {
  requireAuth(ctx);
  if (!isAdmin(ctx)) throw Errors.forbidden("Admin access required");
}

export function requireSelfOrAdmin(
  ctx: GraphQLContext,
  targetUserId: string
): void {
  requireAuth(ctx);
  if (isAdmin(ctx)) return;
  if (ctx.userId !== targetUserId) throw Errors.forbidden();
}

export async function requireUser(ctx: GraphQLContext): Promise<IUser> {
  const userId = requireAuth(ctx);

  const loader = ctx.loaders?.userById;
  const user = loader
    ? await loader.load(userId)
    : await getUserByIdCached(userId);

  if (!user) {
    throw Errors.notFound("User", userId);
  }

  return user;
}
