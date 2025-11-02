import express from "express";
import { createMood } from "../controllers/moodController";
import { auth } from "../middleware/auth";

const router = express.Router();

// All routes are protected with authentication
router.use(auth);

// Track a new mood entry
router.post("/", createMood);

export default router;
