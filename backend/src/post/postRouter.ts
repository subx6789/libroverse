import express from "express";
import multer from "multer";
import {
  createPost,
  listPosts,
  getChannels,
  toggleLikePost,
  addComment,
  sharePost,
  deletePost,
  updatePost,
} from "./postController";
import authenticate from "../middlewares/authenticate";
import { publicRateLimiter, userRateLimiter } from "../middlewares/rateLimiter";
import { config } from "../config/config";

const postRouter = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: config.maxPostVideoSizeMb * 1024 * 1024 }, // 8 MB max in-memory gate for video/image
});

import {
  validateBody,
  validateParams,
} from "../middlewares/validate";
import {
  createPostSchema,
  updatePostSchema,
  addCommentSchema,
  postIdParamSchema,
} from "../schemas/validationSchemas";

// Public post browsing routes
postRouter.get("/channels", publicRateLimiter, getChannels);
postRouter.get("/", publicRateLimiter, listPosts);
postRouter.post("/:postId/share", publicRateLimiter, validateParams(postIdParamSchema), sharePost);

// Authenticated user interaction routes
postRouter.post(
  "/",
  authenticate,
  userRateLimiter,
  upload.single("media"),
  validateBody(createPostSchema),
  createPost
);
postRouter.patch(
  "/:postId",
  authenticate,
  userRateLimiter,
  validateParams(postIdParamSchema),
  upload.single("media"),
  validateBody(updatePostSchema),
  updatePost
);
postRouter.post("/:postId/like", authenticate, userRateLimiter, validateParams(postIdParamSchema), toggleLikePost);
postRouter.post(
  "/:postId/comment",
  authenticate,
  userRateLimiter,
  validateParams(postIdParamSchema),
  validateBody(addCommentSchema),
  addComment
);
postRouter.delete("/:postId", authenticate, userRateLimiter, validateParams(postIdParamSchema), deletePost);

export default postRouter;
