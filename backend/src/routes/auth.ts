import { Router } from "express";
import { login, logout, register } from "../controllers/authController";
import { auth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { loginSchema, registerSchema } from "../validators/auth.validator";
import { authLimiter } from "../middleware/rateLimiter";

const router = Router();

// POST /api/auth/register
router.post("/register", authLimiter, validate(registerSchema), register);

// POST /api/auth/login
router.post("/login", authLimiter, validate(loginSchema), login);

// POST /api/auth/logout
router.post("/logout", auth, logout);

// GET /api/auth/me
router.get("/me", auth, (req, res) => {
  res.json({ user: req.user });
});

export default router;
