import mongoose, { Document, Schema } from "mongoose";

export interface ISession extends Document {
  userId: mongoose.Types.ObjectId;
  token: string;
  expiresAt: Date;
  deviceInfo?: string;
  lastActive: Date;
  createdAt: Date;
  updatedAt: Date;
}

const sessionSchema = new Schema<ISession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    deviceInfo: {
      type: String,
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Index for automatic cleanup of expired sessions (TTL index)
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound index for the auth query (token + expiresAt)
sessionSchema.index({ token: 1, expiresAt: 1 });

// Index for querying user's sessions
sessionSchema.index({ userId: 1 });

export const Session = mongoose.model<ISession>("Session", sessionSchema);
