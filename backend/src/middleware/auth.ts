import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/User";
import { Session } from "../models/Session";

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const auth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    // Verify session exists and is not expired
    const session = await Session.findOne({
      token,
      expiresAt: { $gt: new Date() }, // Session must not be expired
    });

    if (!session) {
      return res.status(401).json({
        message: "Session expired or invalid. Please login again.",
      });
    }

    // Verify user still exists
    const user = await User.findById(decoded.userId);

    if (!user) {
      // Clean up orphaned session
      await Session.deleteOne({ _id: session._id });
      return res.status(401).json({ message: "User not found" });
    }

    // Update last active timestamp
    session.lastActive = new Date();
    await session.save();

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    // Handle JWT errors specifically
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: "Invalid authentication token" });
    }
    if (error instanceof jwt.TokenExpiredError) {
      return res
        .status(401)
        .json({ message: "Token expired. Please login again." });
    }

    // Other errors
    return res.status(401).json({ message: "Authentication failed" });
  }
};
