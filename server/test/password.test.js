import assert from "node:assert/strict";
import { test } from "node:test";
import { hashPassword, verifyPassword } from "../src/utils/password.js";

test("passwords are stored as bcrypt hashes and can be verified", async () => {
  const password = "a-long-test-password-123";
  const passwordHash = await hashPassword(password);

  assert.notEqual(passwordHash, password);
  assert.match(passwordHash, /^\$2[aby]\$/);
  assert.equal(await verifyPassword(password, passwordHash), true);
  assert.equal(await verifyPassword("not-the-password", passwordHash), false);
});

test("bcrypt byte-length limit is enforced", async () => {
  const tooLong = "é".repeat(37); // 74 UTF-8 bytes
  await assert.rejects(() => hashPassword(tooLong), {
    code: "PASSWORD_TOO_LONG",
  });
});
