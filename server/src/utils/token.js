import { createHash, randomBytes, randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

const TOKEN_ISSUER = "deeppay-api";
const TOKEN_AUDIENCE = "deeppay-mobile";

export function createRefreshToken() {
  return randomBytes(48).toString("base64url");
}

export function hashRefreshToken(token) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function createSessionId() {
  return randomUUID();
}

export function signAccessToken(user, sessionId) {
  return jwt.sign(
    { email: user.email },
    env.JWT_ACCESS_SECRET,
    {
      algorithm: "HS256",
      subject: String(user._id),
      jwtid: sessionId,
      issuer: TOKEN_ISSUER,
      audience: TOKEN_AUDIENCE,
      expiresIn: env.ACCESS_TOKEN_TTL_SECONDS,
    },
  );
}

export function verifyAccessToken(token) {
  const payload = jwt.verify(token, env.JWT_ACCESS_SECRET, {
    algorithms: ["HS256"],
    issuer: TOKEN_ISSUER,
    audience: TOKEN_AUDIENCE,
  });

  if (typeof payload === "string" || !payload.sub || !payload.jti) {
    throw new Error("Invalid access token payload.");
  }

  return {
    userId: payload.sub,
    sessionId: payload.jti,
    email: typeof payload.email === "string" ? payload.email : undefined,
  };
}

export function refreshTokenExpiry(now = new Date()) {
  return new Date(now.getTime() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
}
