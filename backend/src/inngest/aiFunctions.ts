import { inngest } from "./client";
import { logger } from "../utils/logger";
import { genAI } from "../utils/ai";
import { extractJSON } from "../utils/helper";
import { ChatSession } from "../models/ChatSession";

// Function to handle chat message processing
export const processChatMessage = inngest.createFunction(
  {
    id: "process-chat-message",
    retries: 3,
  },
  { event: "therapy/session.message" },
  async ({ event, step }) => {
    const {
      sessionId,
      messageIndex,
      message,
      history,
      memory = {
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
      goals = [],
      systemPrompt,
    } = event.data;

    try {
      logger.info("Processing chat message in Inngest:", {
        sessionId,
        messageIndex,
        historyLength: history?.length,
      });

      // Update status to "processing"
      await step.run("update-status-processing", async () => {
        await ChatSession.findOneAndUpdate(
          { sessionId },
          { $set: { [`messages.${messageIndex}.status`]: "processing" } }
        );
      });

      // Analyze the message
      const analysis = await step.run("analyze-message", async () => {
        try {
          const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash-exp",
          });

          const prompt = `Analyze this therapy message and provide insights. Return ONLY a valid JSON object with no markdown formatting or additional text.
          Message: ${message}
          Context: ${JSON.stringify({ memory, goals })}
          
          Required JSON structure:
          {
            "emotionalState": "string",
            "themes": ["string"],
            "riskLevel": number,
            "recommendedApproach": "string",
            "progressIndicators": ["string"]
          }`;

          const result = await model.generateContent(prompt);
          const response = result.response;
          const text = response.text().trim();

          const cleanText = extractJSON(text);
          const parsedAnalysis = JSON.parse(cleanText);

          logger.info("Successfully parsed analysis:", parsedAnalysis);

          return parsedAnalysis;
        } catch (error) {
          logger.error("Error in message analysis:", { error, message });
          return {
            emotionalState: "neutral",
            themes: [],
            riskLevel: 0,
            recommendedApproach: "supportive",
            progressIndicators: [],
          };
        }
      });

      // Update memory
      const updatedMemory = await step.run("update-memory", async () => {
        if (analysis.emotionalState) {
          memory.userProfile.emotionalState.push(analysis.emotionalState);
        }
        if (analysis.themes) {
          memory.sessionContext.conversationThemes.push(...analysis.themes);
        }
        if (analysis.riskLevel) {
          memory.userProfile.riskLevel = analysis.riskLevel;
        }
        return memory;
      });

      // Alert if high risk
      if (analysis.riskLevel > 4) {
        await step.run("trigger-risk-alert", async () => {
          logger.warn("High risk level detected in chat message", {
            sessionId,
            message,
            riskLevel: analysis.riskLevel,
          });
        });
      }

      // Generate response
      const response = await step.run("generate-response", async () => {
        try {
          const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash-exp",
          });

          const prompt = `${systemPrompt}
          
          Based on the following context, generate a therapeutic response:
          Message: ${message}
          Analysis: ${JSON.stringify(analysis)}
          Memory: ${JSON.stringify(memory)}
          Goals: ${JSON.stringify(goals)}
          
          Provide a response that:
          1. Addresses the immediate emotional needs
          2. Uses appropriate therapeutic techniques
          3. Shows empathy and understanding
          4. Maintains professional boundaries
          5. Considers safety and well-being`;

          const result = await model.generateContent(prompt);
          const responseText = result.response.text().trim();

          logger.info("Generated response:", { responseText });
          return responseText;
        } catch (error) {
          logger.error("Error generating response:", { error, message });
          return "I'm here to support you. Could you tell me more about what's on your mind?";
        }
      });

      // Update message in database with completed status
      await step.run("update-message-completed", async () => {
        await ChatSession.findOneAndUpdate(
          { sessionId },
          {
            $set: {
              [`messages.${messageIndex}.content`]: response,
              [`messages.${messageIndex}.status`]: "completed",
              [`messages.${messageIndex}.metadata`]: {
                analysis,
                progress: {
                  emotionalState: analysis.emotionalState,
                  riskLevel: analysis.riskLevel,
                },
              },
            },
          }
        );

        logger.info("Message updated successfully:", {
          sessionId,
          messageIndex,
        });
      });

      return {
        response,
        analysis,
        updatedMemory,
      };
    } catch (error) {
      logger.error("Error in chat message processing:", {
        error,
        sessionId,
        messageIndex,
      });

      // Update status to "failed"
      await ChatSession.findOneAndUpdate(
        { sessionId },
        {
          $set: {
            [`messages.${messageIndex}.status`]: "failed",
            [`messages.${messageIndex}.content`]:
              "I apologize, but I encountered an error processing your message. Please try again.",
            [`messages.${messageIndex}.metadata.error`]:
              error instanceof Error ? error.message : "Unknown error",
          },
        }
      );

      throw error; // Inngest will retry
    }
  }
);

// Function to analyze therapy session content
export const analyzeTherapySession = inngest.createFunction(
  { id: "analyze-therapy-session" },
  { event: "therapy/session.created" },
  async ({ event, step }) => {
    try {
      // Get the session content
      const sessionContent = await step.run("get-session-content", async () => {
        return event.data.notes || event.data.transcript;
      });

      // Analyze the session using Gemini
      const analysis = await step.run("analyze-with-gemini", async () => {
        const model = genAI.getGenerativeModel({
          model: "gemini-2.0-flash-exp",
        });

        const prompt = `Analyze this therapy session and provide insights:
        Session Content: ${sessionContent}
        
        Please provide:
        1. Key themes and topics discussed
        2. Emotional state analysis
        3. Potential areas of concern
        4. Recommendations for follow-up
        5. Progress indicators
        
        Format the response as a JSON object.`;

        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        logger.info("Raw session analysis:", { text });

        // Clean and extract JSON
        const cleanText = extractJSON(text);
        const parsedAnalysis = JSON.parse(cleanText);

        logger.info("Parsed session analysis:", parsedAnalysis);
        return parsedAnalysis;
      });

      // Store the analysis
      await step.run("store-analysis", async () => {
        // Here you would typically store the analysis in your database
        logger.info("Session analysis stored successfully");
        return analysis;
      });

      // If there are concerning indicators, trigger an alert
      if (analysis.areasOfConcern?.length > 0) {
        await step.run("trigger-concern-alert", async () => {
          logger.warn("Concerning indicators detected in session analysis", {
            sessionId: event.data.sessionId,
            concerns: analysis.areasOfConcern,
          });
          // Add your alert logic here
        });
      }

      return {
        message: "Session analysis completed",
        analysis,
      };
    } catch (error) {
      logger.error("Error in therapy session analysis:", error);
      throw error;
    }
  }
);
