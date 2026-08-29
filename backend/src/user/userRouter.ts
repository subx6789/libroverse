import express from "express";
import multer from "multer";
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
  checkUsername,
  updateProfile,
  searchMentions,
} from "./userController";
import authenticate from "../middlewares/authenticate";

const userRouter = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

// Public routes
userRouter.post("/register", createUser);
userRouter.post("/login", loginUser);
userRouter.get("/search", searchUsers);
userRouter.get("/check-username", checkUsername);
userRouter.get("/mentions", searchMentions);
userRouter.get("/suggested", authenticate, getSuggestedUsers);
userRouter.get("/profile/:userId", getUserProfile);

// Authenticated user routes
userRouter.get("/self", authenticate, getSelf);
userRouter.patch(
  "/profile",
  authenticate,
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  updateProfile
);
userRouter.post("/saved/:postId", authenticate, toggleSavePost);
userRouter.post("/:userId/follow", authenticate, toggleFollowUser);

// Admin user management routes
userRouter.get("/", authenticate, listAllUsers);
userRouter.patch("/:userId/ban", authenticate, toggleUserBan);

export default userRouter;
