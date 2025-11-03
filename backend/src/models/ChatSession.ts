import { Document, Schema, model, Types } from "mongoose";

export interface IChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  status?: "pending" | "processing" | "completed" | "failed";
  metadata?: {
    analysis?: any;
    currentGoal?: string | null;
    progress?: {
      emotionalState?: string;
      riskLevel?: number;
    };
    error?: string;
  };
}

export interface IChatSession extends Document {
  sessionId: string;
  userId: Types.ObjectId;
  startTime: Date;
  status: "active" | "completed" | "archived";
  messages: IChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const chatMessageSchema = new Schema<IChatMessage>(
  {
    role: {
      type: String,
      required: true,
      enum: ["user", "assistant"],
    },
    content: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "completed",
    },
    metadata: {
      type: {
        analysis: Schema.Types.Mixed,
        currentGoal: String,
        progress: {
          emotionalState: String,
          riskLevel: Number,
        },
        error: String,
      },
      required: false,
    },
  },
  { _id: false }
);

const chatSessionSchema = new Schema<IChatSession>(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
      default: Date.now,
    },
    status: {
      type: String,
      required: true,
      enum: ["active", "completed", "archived"],
      default: "active",
    },
    messages: [chatMessageSchema],
  },
  { timestamps: true }
);

chatSessionSchema.index({ sessionId: 1 });
chatSessionSchema.index({ userId: 1, status: 1 });
chatSessionSchema.index({ userId: 1, startTime: -1 });

export const ChatSession = model<IChatSession>(
  "ChatSession",
  chatSessionSchema
);
