import express from "express";
import {
  createUser,
  getSelf,
  loginUser,
  listAllUsers,
  toggleUserBan,
  toggleSavePost,
  toggleFollowUser,
  getUserProfile,
  getSuggestedUsers,
  searchUsers,
} from "./userController";
import authenticate from "../middlewares/authenticate";

const userRouter = express.Router();

// Public routes
userRouter.post("/register", createUser);
userRouter.post("/login", loginUser);
userRouter.get("/search", searchUsers);
userRouter.get("/suggested", authenticate, getSuggestedUsers);
userRouter.get("/profile/:userId", getUserProfile);

// Authenticated user routes
userRouter.get("/self", authenticate, getSelf);
userRouter.post("/saved/:postId", authenticate, toggleSavePost);
userRouter.post("/:userId/follow", authenticate, toggleFollowUser);

// Admin user management routes
userRouter.get("/", authenticate, listAllUsers);
userRouter.patch("/:userId/ban", authenticate, toggleUserBan);

export default userRouter;
