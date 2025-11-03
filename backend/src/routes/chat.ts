import express from "express";
import { auth } from "../middleware/auth";
import {
  createChatSession,
  getChatHistory,
  getChatSession,
  getMessageStatus,
  sendMessage,
} from "../controllers/chatController";

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

// Create a new chat session
router.post("/sessions", createChatSession);

// Get a specific chat session
router.get("/sessions/:sessionId", getChatSession);

// Send a message in a chat session
router.post("/sessions/:sessionId/messages", sendMessage);

// Get message status (for polling)
router.get(
  "/sessions/:sessionId/messages/:messageIndex/status",
  getMessageStatus
);

// Get chat history for a session
router.get("/sessions/:sessionId/history", getChatHistory);

export default router;
