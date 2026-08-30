import express from "express";
import {
  createBook,
  deleteBook,
  getSingleBook,
  listBooks,
  updateBook,
} from "./bookController";
import multer from "multer";
import authenticate from "../middlewares/authenticate";
import { publicRateLimiter, userRateLimiter } from "../middlewares/rateLimiter";
import { config } from "../config/config";

const bookRouter = express.Router();

/**
 * In-memory storage engine for streaming direct to Cloudinary on serverless/free-tier
 */
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: config.maxPdfSizeMb * 1024 * 1024 }, // 10 MB in-memory gate
});

import {
  validateBody,
  validateParams,
} from "../middlewares/validate";
import {
  createBookSchema,
  updateBookSchema,
  bookIdParamSchema,
} from "../schemas/validationSchemas";

// Authenticated create/update/delete routes
bookRouter.post(
  "/",
  authenticate,
  userRateLimiter,
  upload.fields([
    { name: "coverImage", maxCount: 1 },
    { name: "cover", maxCount: 1 },
    { name: "file", maxCount: 1 },
    { name: "pdf", maxCount: 1 },
  ]),
  validateBody(createBookSchema),
  createBook
);

bookRouter.put(
  "/:bookId",
  authenticate,
  userRateLimiter,
  validateParams(bookIdParamSchema),
  upload.fields([
    { name: "coverImage", maxCount: 1 },
    { name: "cover", maxCount: 1 },
    { name: "file", maxCount: 1 },
    { name: "pdf", maxCount: 1 },
  ]),
  validateBody(updateBookSchema),
  updateBook
);

// Public catalog viewing routes
bookRouter.get("/", publicRateLimiter, listBooks);
bookRouter.get("/:bookId", publicRateLimiter, validateParams(bookIdParamSchema), getSingleBook);
bookRouter.delete("/:bookId", authenticate, userRateLimiter, validateParams(bookIdParamSchema), deleteBook);

export default bookRouter;
