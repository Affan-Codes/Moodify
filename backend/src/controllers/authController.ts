import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User";
import { Session } from "../models/Session";
import mongoose from "mongoose";

// Helper function to generate JWT
const generateToken = (userId: string): string => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined");
  }
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "24h" });
};

// Helper function to create session
const createSession = async (
  userId: string,
  token: string,
  deviceInfo?: string
) => {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);

  const session = new Session({
    userId,
    token,
    expiresAt,
    deviceInfo,
  });

  await session.save();
  return session;
};

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: "Email already in use." });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
    });

    await user.save();

    // Generate JWT token
    const token = generateToken(
      (user._id as mongoose.Types.ObjectId).toString()
    );

    // Create session
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours from now

    // Create session
    await createSession(
      (user._id as mongoose.Types.ObjectId).toString(),
      token,
      req.headers["user-agent"]
    );

    // Respond with user data and token
    res.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
      token,
      message: "Login successful",
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // Generate JWT token
    const token = generateToken(
      (user._id as mongoose.Types.ObjectId).toString()
    );

    // Create session
    await createSession(
      (user._id as mongoose.Types.ObjectId).toString(),
      token,
      req.headers["user-agent"]
    );

    // Respond with user data and token
    res.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
      token,
      message: "Login successful",
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return res.status(400).json({
        success: false,
        message: "No token provided",
      });
    }

    // Delete session
    const result = await Session.deleteOne({ token });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    res.json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
