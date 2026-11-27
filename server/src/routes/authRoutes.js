import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { z } from "zod";
import {
  login,
  logout,
  me,
  patchMe,
  refresh,
  register,
} from "../controllers/authController.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { validateBody } from "../middleware/validateBody.js";

const router = Router();

const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    error: {
      code: "TOO_MANY_AUTH_ATTEMPTS",
      message: "Too many authentication attempts. Try again in 15 minutes.",
    },
  },
});

const registerSchema = z.object({
  fullName: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(254),
  password: z.string().min(10).max(72),
}).strict();

const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(72),
}).strict();

const refreshSchema = z.object({
  refreshToken: z.string().min(40).max(200),
}).strict();

const profileSchema = z.object({
  fullName: z.string().trim().min(2).max(80),
}).strict();

router.post("/register", authRateLimit, validateBody(registerSchema), register);
router.post("/login", authRateLimit, validateBody(loginSchema), login);
router.post("/refresh", authRateLimit, validateBody(refreshSchema), refresh);
router.post("/logout", authRateLimit, validateBody(refreshSchema), logout);
router.get("/me", requireAuth, me);
router.patch("/me", requireAuth, validateBody(profileSchema), patchMe);

export default router;
