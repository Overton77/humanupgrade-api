import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { User, IUser } from "../models/User";

export interface AuthTokenPayload {
  userId: string;
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
    return user || null;
  } catch {
    return null;
  }
}
