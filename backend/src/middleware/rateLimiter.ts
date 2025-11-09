import rateLimit from "express-rate-limit";
import { Request, Response } from "express";

// Custom handler for rate limit exceeded
const rateLimitHandler = (req: Request, res: Response) => {
  res.status(429).json({
    success: false,
    message: "Too many requests. Please try again later.",
    retryAfter: req.rateLimit?.resetTime,
  });
};

// Strict rate limiter for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message:
    "Too many login/registration attempts. Please try again after 15 minutes.",
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  handler: rateLimitHandler,
  // Skip successful requests from count (optional - only count failed attempts)
  skipSuccessfulRequests: false,
  // Skip failed requests from count (optional)
  skipFailedRequests: false,
});

// Moderate rate limiter for AI-powered endpoints (chat messages)
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 messages per minute
  message: "Too many messages. Please slow down.",
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: (req: Request) => {
    return req.user?._id?.toString() || req.ip || "anonymous";
  },
});

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: "Too many requests from this IP. Please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

// Strict limiter for session creation
export const sessionCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 new sessions per hour
  message: "Too many sessions created. Please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: (req: Request) => {
    return req.user?._id?.toString() || req.ip || "anonymous";
  },
});

// Limiter for mood/activity logging
export const dataEntryLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 entries per minute
  message: "Too many entries. Please slow down.",
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: (req: Request) => {
    return req.user?._id?.toString() || req.ip || "anonymous";
  },
});
