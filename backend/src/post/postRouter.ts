import express from "express";
import multer from "multer";
import {
  createPost,
  listPosts,
  toggleLikePost,
  addComment,
  sharePost,
  deletePost,
} from "./postController";
import authenticate from "../middlewares/authenticate";

const postRouter = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB in-memory gate
});

// Routes
postRouter.get("/", listPosts);
postRouter.post("/", authenticate, upload.single("media"), createPost);
postRouter.post("/:postId/like", authenticate, toggleLikePost);
postRouter.post("/:postId/comment", authenticate, addComment);
postRouter.post("/:postId/share", sharePost);
postRouter.delete("/:postId", authenticate, deletePost);

export default postRouter;
