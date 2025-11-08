import express from "express";
import { auth } from "../middleware/auth";
import { logActivity } from "../controllers/activityController";
import { logActivitySchema } from "../validators/activity.validator";
import { validate } from "../middleware/validate";

const router = express.Router();

// All routes are protected with authentication
router.use(auth);

// Log a new activity
router.post("/", validate(logActivitySchema), logActivity);

export default router;
