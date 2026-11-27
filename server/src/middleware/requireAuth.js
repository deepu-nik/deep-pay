import { RefreshSession } from "../models/RefreshSession.js";
import { unauthorized } from "../utils/appError.js";
import { verifyAccessToken } from "../utils/token.js";

export async function requireAuth(req, _res, next) {
  const authorization = req.get("authorization") ?? "";
  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    return next(unauthorized("A Bearer access token is required."));
  }

  let claims;
  try {
    claims = verifyAccessToken(token);
  } catch {
    return next(unauthorized("Access token is invalid or expired."));
  }

  // Database failures should reach the 500 handler, not be misreported
  // as an invalid token.
  const activeSession = await RefreshSession.exists({
    sessionId: claims.sessionId,
    userId: claims.userId,
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  });

  if (!activeSession) {
    return next(unauthorized("Session has expired or been revoked. Sign in again."));
  }

  req.auth = {
    userId: claims.userId,
    sessionId: claims.sessionId,
  };
  return next();
}
