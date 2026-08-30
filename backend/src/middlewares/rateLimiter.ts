import rateLimit from "express-rate-limit";
import { config } from "../config/config";

/**
 * 🔒 Strictest Tier: Authentication Endpoints (/login, /register)
 * Protects against brute force and credential stuffing attacks
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: config.rateLimitAuthMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    message: "Too many login/register attempts. Please wait 15 minutes before trying again.",
  },
});

/**
 * 🌐 Moderate Tier: Public Endpoints (e.g. Catalog Browsing, Channels List)
 */
export const publicRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: config.rateLimitPublicMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    message: "Too many requests. Please slow down.",
  },
});

/**
 * 👤 Loose Tier: Authenticated User Actions (e.g. Post Creation, Comments, Uploads)
 */
export const userRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: config.rateLimitUserMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    message: "Action rate limit reached. Please try again in a few moments.",
  },
});
