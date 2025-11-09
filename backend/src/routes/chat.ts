import express from "express";
import { auth } from "../middleware/auth";
import {
  createChatSession,
  getChatHistory,
  getChatSession,
  getMessageStatus,
  sendMessage,
} from "../controllers/chatController";
import {
  createSessionSchema,
  getChatHistorySchema,
  getMessageStatusSchema,
  sendMessageSchema,
} from "../validators/chat.validator";
import { validate } from "../middleware/validate";
import { aiLimiter, sessionCreationLimiter } from "../middleware/rateLimiter";

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

// Create a new chat session
router.post(
  "/sessions",
  sessionCreationLimiter,
  validate(createSessionSchema),
  createChatSession
);

// Get a specific chat session
router.get("/sessions/:sessionId", getChatSession);

// Send a message in a chat session
router.post(
  "/sessions/:sessionId/messages",
  aiLimiter,
  validate(sendMessageSchema),
  sendMessage
);

// Get message status (for polling)
router.get(
  "/sessions/:sessionId/messages/:messageIndex/status",
  validate(getMessageStatusSchema),
  getMessageStatus
);

// Get chat history for a session
router.get(
  "/sessions/:sessionId/history",
  validate(getChatHistorySchema),
  getChatHistory
);

export default router;
