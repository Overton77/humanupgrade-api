import type { Request, Response, Router } from "express";
import express from "express";
import {
  rotateRefreshSession,
  revokeRefreshSession,
} from "../services/refreshToken.js";

import { signAccessToken } from "../services/auth.js";
import { User } from "../models/User.js";
import { Errors, toAppError } from "../lib/errors.js";
import { env } from "../config/env.js";
import type { Role } from "../services/auth.js";

export const authRouter: Router = express.Router();

function setRefreshCookie(res: Response, value: string, expiresAt: Date): void {
  res.cookie(env.refreshCookieName, value, {
    httpOnly: true,
    secure: env.cookieSecure === true,
    sameSite: (env.cookieSameSite as "lax" | "strict" | "none") ?? "lax",
    path: "/auth/refresh",
    expires: expiresAt,
    domain: env.cookieDomain || undefined,
  });
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie(env.refreshCookieName, {
    path: "/auth/refresh",
    domain: env.cookieDomain || undefined,
  });
}

authRouter.post("/refresh", async (req: Request, res: Response) => {
  try {
    const cookieName = env.refreshCookieName;

    const cookieValue = req.cookies?.[cookieName];

    if (!cookieValue) {
      throw Errors.unauthenticated("Refresh token not found");
    }

    const { userId, newCookieValue, newExpiresAt } = await rotateRefreshSession(
      {
        cookieValue,
        ip: req.ip,
        userAgent: req.get("user-agent") ?? undefined,
      }
    );

    const user = await User.findById(userId).exec();

    if (!user) {
      throw Errors.unauthenticated("User not found");
    }

    const accessToken = signAccessToken({
      userId: user._id.toString(),
      role: (user.role as Role) ?? "user",
    });

    setRefreshCookie(res, newCookieValue, newExpiresAt);

    res.status(200).json({
      token: accessToken,
    });
  } catch (err) {
    const appErr = toAppError(err, "Refresh failed");

    clearRefreshCookie(res);

    res.status(appErr.extensions.httpStatus ?? 401).json({
      error: { message: appErr.message, code: appErr.extensions.code },
    });
  }
});

authRouter.post("/logout", async (req: Request, res: Response) => {
  try {
    const cookieName = env.refreshCookieName ?? "hu_rt";
    const cookieValue = req.cookies?.[cookieName];

    if (cookieValue) await revokeRefreshSession(cookieValue);

    clearRefreshCookie(res);
    res.status(204).send();
  } catch (err) {
    const appErr = toAppError(err, "Logout failed");
    res.status(appErr.extensions.httpStatus ?? 500).json({
      error: { message: appErr.message, code: appErr.extensions.code },
    });
  }
});
