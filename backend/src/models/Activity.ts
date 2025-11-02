import mongoose, { Document, Schema } from "mongoose";

export interface IActivity extends Document {
  userId: mongoose.Types.ObjectId;
  type:
    | "meditation"
    | "exercise"
    | "walking"
    | "reading"
    | "journaling"
    | "therapy";
  name: string;
  description?: string;
  duration?: number;
  difficulty: "easy" | "medium" | "hard";
  feedback?: string;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const activitySchema = new Schema<IActivity>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        "meditation",
        "exercise",
        "walking",
        "reading",
        "journaling",
        "therapy",
      ],
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    duration: {
      type: Number,
      min: [0, "Duration cannot be negative"],
    },
    difficulty: {
      type: String,
      required: true,
      enum: ["easy", "medium", "hard"],
    },
    feedback: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Index for efficient querying
activitySchema.index({ userId: 1, timestamp: -1 });

export const Activity = mongoose.model<IActivity>("Activity", activitySchema);
