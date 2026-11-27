import { AppError, conflict, unauthorized } from "../utils/appError.js";
import { User } from "../models/User.js";
import { RefreshSession } from "../models/RefreshSession.js";
import { env } from "../config/env.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import {
  createRefreshToken,
  createSessionId,
  hashRefreshToken,
  refreshTokenExpiry,
  signAccessToken,
} from "../utils/token.js";

function toPublicUser(user) {
  return {
    id: String(user._id),
    fullName: user.fullName,
    email: user.email,
    emailVerified: Boolean(user.emailVerified),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

async function createSession(user, metadata = {}) {
  const refreshToken = createRefreshToken();
  const sessionId = createSessionId();
  const expiresAt = refreshTokenExpiry();

  await RefreshSession.create({
    userId: user._id,
    sessionId,
    tokenHash: hashRefreshToken(refreshToken),
    expiresAt,
    userAgent: metadata.userAgent?.slice(0, 256) ?? null,
    ipAddress: metadata.ipAddress?.slice(0, 64) ?? null,
  });

  return {
    user: toPublicUser(user),
    accessToken: signAccessToken(user, sessionId),
    refreshToken,
    tokenType: "Bearer",
    accessTokenExpiresIn: env.ACCESS_TOKEN_TTL_SECONDS,
    refreshTokenExpiresAt: expiresAt.toISOString(),
  };
}

export async function registerAccount(input, metadata) {
  const email = input.email.trim().toLowerCase();
  const fullName = input.fullName.trim().replace(/\s+/g, " ");
  const passwordHash = await hashPassword(input.password);

  const user = await User.create({
    fullName,
    email,
    passwordHash,
    emailVerified: false,
  });

  const session = await createSession(user, metadata);
  return session;
}

export async function loginAccount(input, metadata) {
  const email = input.email.trim().toLowerCase();
  const user = await User.findOne({ email }).select("+passwordHash").exec();

  // Use one generic error for unknown emails and incorrect passwords.
  if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
    throw unauthorized("Email or password is incorrect.");
  }

  return createSession(user, metadata);
}

export async function rotateRefreshToken(rawRefreshToken, metadata) {
  const tokenHash = hashRefreshToken(rawRefreshToken);
  const currentSession = await RefreshSession.findOne({ tokenHash }).exec();

  if (!currentSession || currentSession.revokedAt || currentSession.expiresAt <= new Date()) {
    throw unauthorized("Refresh token is invalid or expired. Sign in again.");
  }

  const user = await User.findById(currentSession.userId).exec();
  if (!user) {
    await RefreshSession.updateOne(
      { _id: currentSession._id, revokedAt: null },
      { $set: { revokedAt: new Date() } },
    );
    throw unauthorized("Account is no longer available.");
  }

  const now = new Date();
  const nextRefreshToken = createRefreshToken();
  const nextSessionId = createSessionId();
  const nextExpiresAt = refreshTokenExpiry(now);

  // Consume the current token atomically so concurrent refresh requests
  // cannot both mint a new session from the same token.
  const consumed = await RefreshSession.findOneAndUpdate(
    {
      _id: currentSession._id,
      revokedAt: null,
      expiresAt: { $gt: now },
    },
    {
      $set: {
        revokedAt: now,
        replacedBySessionId: nextSessionId,
      },
    },
    { new: true },
  ).exec();

  if (!consumed) {
    throw unauthorized("Refresh token has already been used. Sign in again.");
  }

  try {
    await RefreshSession.create({
      userId: user._id,
      sessionId: nextSessionId,
      tokenHash: hashRefreshToken(nextRefreshToken),
      expiresAt: nextExpiresAt,
      userAgent: metadata.userAgent?.slice(0, 256) ?? null,
      ipAddress: metadata.ipAddress?.slice(0, 64) ?? null,
    });
  } catch (error) {
    // The old token is already consumed; require a fresh login if rotation
    // cannot be completed rather than accepting the old token again.
    throw new AppError(503, "SESSION_ROTATION_FAILED", "Unable to renew the session. Please sign in again.");
  }

  return {
    user: toPublicUser(user),
    accessToken: signAccessToken(user, nextSessionId),
    refreshToken: nextRefreshToken,
    tokenType: "Bearer",
    accessTokenExpiresIn: env.ACCESS_TOKEN_TTL_SECONDS,
    refreshTokenExpiresAt: nextExpiresAt.toISOString(),
  };
}

export async function revokeRefreshToken(rawRefreshToken) {
  const tokenHash = hashRefreshToken(rawRefreshToken);
  await RefreshSession.findOneAndUpdate(
    { tokenHash, revokedAt: null },
    { $set: { revokedAt: new Date() } },
  ).exec();

  // Return the same response whether the token existed or not.
  return { success: true };
}

export async function getProfile(userId) {
  const user = await User.findById(userId).exec();
  if (!user) throw unauthorized("Account is no longer available.");
  return toPublicUser(user);
}

export async function updateProfile(userId, input) {
  const fullName = input.fullName.trim().replace(/\s+/g, " ");
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: { fullName } },
    { new: true, runValidators: true },
  ).exec();

  if (!user) throw unauthorized("Account is no longer available.");
  return toPublicUser(user);
}
