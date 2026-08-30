import { NextFunction, Request, Response } from "express";
import { HttpError } from "http-errors";
import { config } from "../config/config";

const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const statusCode = err.statusCode || err.status || 500;
  
  // Full server-side error logging for debugging
  console.error(`[Server Error ${statusCode}] ${req.method} ${req.originalUrl}:`, {
    message: err.message,
    name: err.name,
    code: err.code,
    stack: err.stack,
  });

  // Client-safe messaging: strip Mongo/Mongoose/Cloudinary/Node internal details
  let clientMessage = "An unexpected error occurred. Please try again.";

  // Handle known client-facing HTTP errors (4xx)
  if (statusCode >= 400 && statusCode < 500) {
    clientMessage = err.message || "Invalid request parameters.";
  }

  // Handle MongoDB Duplicate Key Error (11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    clientMessage = `A record with this ${field} already exists.`;
  }

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === "CastError") {
    clientMessage = "Resource not found or invalid identifier provided.";
  }

  // Handle Mongoose ValidationError
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors || {})
      .map((e: any) => e.message)
      .join(", ");
    clientMessage = messages || "Validation error occurred.";
  }

  // For 500 internal server errors
  if (statusCode === 500) {
    if (err.message && !err.message.includes("Mongo") && !err.message.includes("node_modules")) {
      clientMessage = err.message;
    } else {
      clientMessage = "An internal server error occurred. Please try again later.";
    }
  }

  return res.status(statusCode).json({
    message: clientMessage,
  });
};

export default globalErrorHandler;