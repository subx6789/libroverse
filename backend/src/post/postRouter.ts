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

const postRouter = express.Router();

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
  createPostSchema,
  updatePostSchema,
  addCommentSchema,
  postIdParamSchema,
} from "../schemas/validationSchemas";

// Routes
postRouter.get("/channels", getChannels);
postRouter.get("/", listPosts);
postRouter.post(
  "/",
  authenticate,
  upload.single("media"),
  validateBody(createPostSchema),
  createPost
);
postRouter.patch(
  "/:postId",
  authenticate,
  validateParams(postIdParamSchema),
  upload.single("media"),
  validateBody(updatePostSchema),
  updatePost
);
postRouter.post("/:postId/like", authenticate, validateParams(postIdParamSchema), toggleLikePost);
postRouter.post(
  "/:postId/comment",
  authenticate,
  validateParams(postIdParamSchema),
  validateBody(addCommentSchema),
  addComment
);
postRouter.post("/:postId/share", validateParams(postIdParamSchema), sharePost);
postRouter.delete("/:postId", authenticate, validateParams(postIdParamSchema), deletePost);

export default postRouter;
