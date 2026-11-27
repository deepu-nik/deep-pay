import assert from "node:assert/strict";
import { test } from "node:test";

process.env.MONGODB_URI ??= "mongodb://127.0.0.1:27017/deeppay-test";
process.env.JWT_ACCESS_SECRET ??= "test_only_secret_that_is_at_least_32_characters_long";

const { createRefreshToken, hashRefreshToken } = await import("../src/utils/token.js");

test("refresh tokens are random opaque values", () => {
  const first = createRefreshToken();
  const second = createRefreshToken();

  assert.equal(typeof first, "string");
  assert.ok(first.length >= 60);
  assert.notEqual(first, second);
  assert.doesNotMatch(first, /[=+/]/);
});

test("refresh token hashes are deterministic SHA-256 hex digests", () => {
  const token = createRefreshToken();
  const firstHash = hashRefreshToken(token);
  const secondHash = hashRefreshToken(token);

  assert.equal(firstHash, secondHash);
  assert.equal(firstHash.length, 64);
  assert.notEqual(firstHash, token);
});
