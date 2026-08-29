import express from "express";
import {
  createUser,
  getSelf,
  loginUser,
  listAllUsers,
  toggleUserBan,
  toggleSavePost,
} from "./userController";
import authenticate from "../middlewares/authenticate";

const userRouter = express.Router();

// Public routes
userRouter.post("/register", createUser);
userRouter.post("/login", loginUser);

// Authenticated user routes
userRouter.get("/self", authenticate, getSelf);
userRouter.post("/saved/:postId", authenticate, toggleSavePost);

// Admin user management routes
userRouter.get("/", authenticate, listAllUsers);
userRouter.patch("/:userId/ban", authenticate, toggleUserBan);

export default userRouter;
