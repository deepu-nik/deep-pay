import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;
const MAX_BCRYPT_PASSWORD_BYTES = 72;

export function assertPasswordByteLength(password) {
  if (Buffer.byteLength(password, "utf8") > MAX_BCRYPT_PASSWORD_BYTES) {
    const error = new Error("Password must be 72 UTF-8 bytes or fewer.");
    error.code = "PASSWORD_TOO_LONG";
    throw error;
  }
}

export async function hashPassword(password) {
  assertPasswordByteLength(password);
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password, passwordHash) {
  assertPasswordByteLength(password);
  return bcrypt.compare(password, passwordHash);
}
