import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { User, IUser } from "../models/User.js";
import { GraphQLError } from "graphql";

export type Role = "admin" | "user";
export interface Context {
  user: IUser | null;
  role: Role | null;
}

export interface AuthTokenPayload {
  userId: string;
  role: "admin" | "user";
}

export function signAuthToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: "7d" });
}

export async function getUserFromAuthHeader(
  authHeader?: string
): Promise<IUser | null> {
  if (!authHeader) return null;
  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) return null;

  try {
    const decoded = jwt.verify(token, env.jwtSecret) as AuthTokenPayload;
    const user = await User.findById(decoded.userId);

    if (!user) {
      throw new GraphQLError("Invalid token", {
        extensions: { code: "INVALID_TOKEN" },
      });
    }
    return user || null;
  } catch {
    return null;
  }
}

export function requireAuth(ctx: Context): void {
  if (!ctx.user) {
    throw new GraphQLError("Not Authenticated", {
      extensions: { code: "UNAUTHENTICATED" },
    });
  }
}

export function requireAdmin(ctx: Context): void {
  requireAuth(ctx);

  if (ctx.role !== "admin") {
    throw new GraphQLError("Forbidden", {
      extensions: { code: "FORBIDDEN" },
    });
  }
}
