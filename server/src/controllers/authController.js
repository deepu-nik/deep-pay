import {
  getProfile,
  loginAccount,
  registerAccount,
  revokeRefreshToken,
  rotateRefreshToken,
  updateProfile,
} from "../services/authService.js";

function getRequestMetadata(req) {
  return {
    userAgent: req.get("user-agent") ?? null,
    ipAddress: req.ip ?? null,
  };
}

export async function register(req, res) {
  const data = await registerAccount(req.body, getRequestMetadata(req));
  res.status(201).json({ data });
}

export async function login(req, res) {
  const data = await loginAccount(req.body, getRequestMetadata(req));
  res.status(200).json({ data });
}

export async function refresh(req, res) {
  const data = await rotateRefreshToken(req.body.refreshToken, getRequestMetadata(req));
  res.status(200).json({ data });
}

export async function logout(req, res) {
  const data = await revokeRefreshToken(req.body.refreshToken);
  res.status(200).json({ data });
}

export async function me(req, res) {
  const user = await getProfile(req.auth.userId);
  res.status(200).json({ data: { user } });
}

export async function patchMe(req, res) {
  const user = await updateProfile(req.auth.userId, req.body);
  res.status(200).json({ data: { user } });
}
