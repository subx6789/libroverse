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

const bookRouter = express.Router();

/**
 * In-memory storage engine for streaming direct to Cloudinary on serverless/free-tier
 */
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB in-memory gate
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

// routes
bookRouter.post(
  "/",
  authenticate,
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

bookRouter.get("/", listBooks);
bookRouter.get("/:bookId", validateParams(bookIdParamSchema), getSingleBook);
bookRouter.delete("/:bookId", authenticate, validateParams(bookIdParamSchema), deleteBook);

export default bookRouter;
