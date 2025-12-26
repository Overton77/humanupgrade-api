import crypto from "crypto";
import mongoose from "mongoose";
import { RefreshSession } from "../models/RefreshSession.js";
import { env } from "../config/env.js";
import { Errors } from "../lib/errors.js";

function sha256(input: string): string {
  return crypto.createHash("sha256").update(input, "utf8").digest("hex");
}

function randomToken(bytes = 48): string {
  return crypto.randomBytes(bytes).toString("base64url");
}

/**
 * Cookie value format: "<sessionId>.<secret>"
 * - sessionId lets us lookup quickly
 * - secret is hashed in DB
 */
export function mintRefreshCookieValue(
  sessionId: string,
  secret: string
): string {
  return `${sessionId}.${secret}`;
}

export function parseRefreshCookieValue(
  value: string
): { sessionId: string; secret: string } | null {
  const parts = value.split(".");
  if (parts.length !== 2) return null;
  const [sessionId, secret] = parts;
  if (!mongoose.Types.ObjectId.isValid(sessionId) || !secret) return null;
  return { sessionId, secret };
}

export async function createRefreshSession(params: {
  userId: string;
  ttlDays: number;
  ip?: string;
  userAgent?: string;
}): Promise<{ sessionId: string; refreshSecret: string; expiresAt: Date }> {
  const refreshSecret = randomToken();
  const tokenHash = sha256(refreshSecret);

  const expiresAt = new Date(Date.now() + params.ttlDays * 24 * 60 * 60 * 1000);

  const session = await RefreshSession.create({
    userId: new mongoose.Types.ObjectId(params.userId),
    tokenHash,
    expiresAt,
    ip: params.ip,
    userAgent: params.userAgent,
  });

  return { sessionId: session._id.toString(), refreshSecret, expiresAt };
}

/**
 * Rotate refresh token:
 * - validate presented session & secret
 * - mark current as rotated
 * - create a new session
 * - return new cookie value
 *
 * Reuse detection:
 * - if session already rotated/revoked, treat as theft and revoke all user sessions
 */
export async function rotateRefreshSession(params: {
  cookieValue: string;
  ip?: string;
  userAgent?: string;
}): Promise<{ userId: string; newCookieValue: string; newExpiresAt: Date }> {
  const parsed = parseRefreshCookieValue(params.cookieValue);
  if (!parsed) throw Errors.unauthenticated("Invalid refresh token");

  const session = await RefreshSession.findById(parsed.sessionId).exec();
  if (!session) throw Errors.unauthenticated("Invalid refresh token");

  // If already rotated/revoked => reuse attempt
  if (session.revokedAt || session.rotatedAt) {
    // revoke all sessions for this user (defensive)
    await RefreshSession.updateMany(
      { userId: session.userId, revokedAt: { $exists: false } },
      { $set: { revokedAt: new Date() } }
    ).exec();

    throw Errors.unauthenticated(
      "Refresh token reuse detected. Please login again."
    );
  }

  if (session.expiresAt.getTime() <= Date.now()) {
    session.revokedAt = new Date();
    await session.save();
    throw Errors.unauthenticated("Refresh token expired. Please login again.");
  }

  const presentedHash = sha256(parsed.secret);
  if (presentedHash !== session.tokenHash) {
    // revoke this session (and optionally all)
    session.revokedAt = new Date();
    await session.save();
    throw Errors.unauthenticated("Invalid refresh token");
  }

  // Create new session first
  const ttlDays = Number(env.refreshTokenTtlDays ?? 30);
  const {
    sessionId: newSessionId,
    refreshSecret: newSecret,
    expiresAt: newExpiresAt,
  } = await createRefreshSession({
    userId: session.userId.toString(),
    ttlDays,
    ip: params.ip,
    userAgent: params.userAgent,
  });

  // Mark old as rotated -> link to new
  session.rotatedAt = new Date();
  session.replacedBySessionId = new mongoose.Types.ObjectId(newSessionId);
  await session.save();

  return {
    userId: session.userId.toString(),
    newCookieValue: mintRefreshCookieValue(newSessionId, newSecret),
    newExpiresAt,
  };
}

export async function revokeRefreshSession(cookieValue: string): Promise<void> {
  const parsed = parseRefreshCookieValue(cookieValue);
  if (!parsed) return;

  await RefreshSession.updateOne(
    { _id: parsed.sessionId, revokedAt: { $exists: false } },
    { $set: { revokedAt: new Date() } }
  ).exec();
}
