import express from "express";
import cors from "cors";
import globalErrorHandler from "./middlewares/globalErrorHandler";
import userRouter from "./user/userRouter";
import bookRouter from "./book/bookRouter";
import { config } from "./config/config";

const app = express();

// CORS configuration: allow configured frontend domain, localhost development, or all in dev
const allowedOrigins = [
  config.frontend_domain,
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (like mobile apps, curl, uptime robot)
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.length === 0 ||
        allowedOrigins.includes(origin) ||
        config.env !== "production"
      ) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json());

// Health check endpoints for Render free-tier keep-alive (e.g. UptimeRobot)
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    message: "Server is healthy and running",
  });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

import categoryRouter from "./category/categoryRouter";
import postRouter from "./post/postRouter";

// Routes
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to eBook Management & Community API",
    version: "1.0.0",
    healthCheck: "/health",
  });
});
app.use("/api/users", userRouter);
app.use("/api/books", bookRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/posts", postRouter);


//Global error handler
app.use(globalErrorHandler);
export default app;
