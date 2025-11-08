import express from "express";
import { createMood } from "../controllers/moodController";
import { auth } from "../middleware/auth";
import { createMoodSchema } from "../validators/mood.validator";
import { validate } from "../middleware/validate";

const router = express.Router();

// All routes are protected with authentication
router.use(auth);

// Track a new mood entry
router.post("/", validate(createMoodSchema), createMood);

export default router;
