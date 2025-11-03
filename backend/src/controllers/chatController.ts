import { Request, Response } from "express";
import { Types } from "mongoose";
import { User } from "../models/User";
import { ChatSession, IChatSession } from "../models/ChatSession";
import { v4 as uuidv4 } from "uuid";
import { logger } from "../utils/logger";
import { InngestEvent } from "../types/inngest";
import { inngest } from "../inngest/client";

// Create a new chat session
export const createChatSession = async (req: Request, res: Response) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res
        .status(401)
        .json({ message: "Unauthorized - User not authenticated" });
    }

    const userId = req.user._id as Types.ObjectId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate a unique sessionId
    const sessionId = uuidv4();

    const session = new ChatSession({
      sessionId,
      userId,
      startTime: new Date(),
      status: "active",
      messages: [],
    });

    await session.save();

    res.status(201).json({
      message: "Chat session created successfully",
      sessionId: session.sessionId,
    });
  } catch (error) {
    logger.error("Error creating chat session:", error);
    res.status(500).json({
      message: "Error creating chat session",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Send a message in the chat session
export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { message } = req.body;
    const userId = req.user._id as Types.ObjectId;

    // Validate sessionId exists
    if (!sessionId) {
      return res.status(400).json({ message: "Session ID is required" });
    }

    logger.info("Processing message:", { sessionId, message });

    // Validate input
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ message: "Message cannot be empty" });
    }

    if (message.length > 5000) {
      return res
        .status(400)
        .json({ message: "Message too long (max 5000 characters)" });
    }

    // Find session by sessionId
    const session = await ChatSession.findOne({ sessionId });
    if (!session) {
      logger.warn("Session not found:", { sessionId });
      return res.status(404).json({ message: "Session not found" });
    }

    if (session.userId.toString() !== userId.toString()) {
      logger.warn("Unauthorized access attempt:", { sessionId, userId });
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Add user message immediately
    session.messages.push({
      role: "user",
      content: message,
      timestamp: new Date(),
      status: "completed",
    });

    // Add placeholder for assistant response
    session.messages.push({
      role: "assistant",
      content: "", // Empty initially
      timestamp: new Date(),
      status: "pending",
    });

    await session.save();

    const messageIndex = session.messages.length - 1; // Index of assistant message

    // Send to Inngest for async processing
    const event: InngestEvent = {
      name: "therapy/session.message",
      data: {
        sessionId,
        messageIndex,
        message,
        history: session.messages.slice(0, -1), // All messages except the pending one
        memory: {
          userProfile: {
            emotionalState: [],
            riskLevel: 0,
            preferences: {},
          },
          sessionContext: {
            conversationThemes: [],
            currentTechnique: null,
          },
        },
        goals: [],
        systemPrompt: `You are an AI therapist assistant. Your role is to:
        1. Provide empathetic and supportive responses
        2. Use evidence-based therapeutic techniques
        3. Maintain professional boundaries
        4. Monitor for risk factors
        5. Guide users toward their therapeutic goals`,
      },
    };

    logger.info("Sending message to Inngest for processing:", {
      sessionId,
      messageIndex,
    });

    // Send to Inngest (fire and forget)
    await inngest.send(event);

    // Return immediately - don't wait for AI processing
    res.json({
      message: "Message received and processing",
      sessionId,
      messageIndex,
      status: "pending",
    });
  } catch (error) {
    logger.error("Error in sendMessage:", error);
    res.status(500).json({
      message: "Error processing message",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Poll for message status
export const getMessageStatus = async (req: Request, res: Response) => {
  try {
    const { sessionId, messageIndex } = req.params;
    const userId = req.user._id as Types.ObjectId;

    // Validate messageIndex exists
    if (!messageIndex) {
      return res.status(400).json({ message: "Message index is required" });
    }

    const session = await ChatSession.findOne({ sessionId });

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    if (session.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const index = parseInt(messageIndex);

    // Validate it's a valid number
    if (isNaN(index)) {
      return res.status(400).json({ message: "Invalid message index" });
    }

    const message = session.messages[index];

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    res.json({
      status: message.status,
      content: message.content,
      metadata: message.metadata,
      timestamp: message.timestamp,
    });
  } catch (error) {
    logger.error("Error getting message status:", error);
    res.status(500).json({ message: "Error getting message status" });
  }
};

// Get chat session history
export const getSessionHistory = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user._id as Types.ObjectId;

    const session = (await ChatSession.findById(
      sessionId
    ).exec()) as IChatSession;

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    if (session.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    res.json({
      messages: session.messages,
      startTime: session.startTime,
      status: session.status,
    });
  } catch (error) {
    logger.error("Error fetching session history:", error);
    res.status(500).json({ message: "Error fetching session history" });
  }
};

export const getChatSession = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    logger.info(`Getting chat session: ${sessionId}`);

    const chatSession = await ChatSession.findOne({ sessionId });

    if (!chatSession) {
      logger.warn(`Chat session not found: ${sessionId}`);
      return res.status(404).json({ error: "Chat session not found" });
    }

    logger.info(`Found chat session: ${sessionId}`);

    res.json(chatSession);
  } catch (error) {
    logger.error("Failed to get chat session:", error);
    res.status(500).json({ error: "Failed to get chat session" });
  }
};

export const getChatHistory = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user._id as Types.ObjectId;

    // Find session by sessionId instead of _id
    const session = await ChatSession.findOne({ sessionId });

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    if (session.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    res.json(session.messages);
  } catch (error) {
    logger.error("Error fetching chat history:", error);
    res.status(500).json({ message: "Error fetching chat history" });
  }
};
