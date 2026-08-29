import { NextFunction, Request, Response } from "express";
import { HttpError } from "http-errors";
import { config } from "../config/config";

const globalErrorHandler = (
  err: HttpError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  
  // Log full error details server-side for debugging
  console.error(`[Server Error ${statusCode}] ${req.method} ${req.originalUrl}:`, err);

  // Return clean generic message for internal server errors in production
  let clientMessage = err.message || "An unexpected error occurred. Please try again.";
  if (statusCode === 500 && config.env === "production") {
    clientMessage = "An unexpected server error occurred. Please try again later.";
  }

  return res.status(statusCode).json({
    message: clientMessage,
    errorStack: config.env === "development" ? err.stack : undefined,
  });
};
export default globalErrorHandler;