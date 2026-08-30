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

import {
  authRateLimiter,
  publicRateLimiter,
  userRateLimiter,
} from "../middlewares/rateLimiter";
import { config } from "../config/config";

const userRouter = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: config.maxCoverBannerSizeMb * 1024 * 1024 }, // 5 MB max
});

import {
  validateBody,
  validateParams,
  validateQuery,
} from "../middlewares/validate";
import {
  registerUserSchema,
  loginUserSchema,
  updateProfileSchema,
  checkUsernameQuerySchema,
  userSearchQuerySchema,
  userIdParamSchema,
  toggleBanSchema,
  postIdParamSchema,
} from "../schemas/validationSchemas";

// Public auth routes (Strict rate limiter)
userRouter.post("/register", authRateLimiter, validateBody(registerUserSchema), createUser);
userRouter.post("/login", authRateLimiter, validateBody(loginUserSchema), loginUser);

// Public browsing routes (Moderate rate limiter)
userRouter.get("/search", publicRateLimiter, validateQuery(userSearchQuerySchema), searchUsers);
userRouter.get("/check-username", publicRateLimiter, validateQuery(checkUsernameQuerySchema), checkUsername);
userRouter.get("/mentions", publicRateLimiter, searchMentions);
userRouter.get("/suggested", authenticate, userRateLimiter, getSuggestedUsers);
userRouter.get("/profile/:userId", publicRateLimiter, validateParams(userIdParamSchema), getUserProfile);

// Authenticated user routes (User action rate limiter)
userRouter.get("/self", authenticate, userRateLimiter, getSelf);
userRouter.patch(
  "/profile",
  authenticate,
  userRateLimiter,
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  validateBody(updateProfileSchema),
  updateProfile
);
userRouter.post("/saved/:postId", authenticate, userRateLimiter, validateParams(postIdParamSchema), toggleSavePost);
userRouter.post("/:userId/follow", authenticate, userRateLimiter, validateParams(userIdParamSchema), toggleFollowUser);

// Admin user management routes
userRouter.get("/", authenticate, listAllUsers);
userRouter.patch(
  "/:userId/ban",
  authenticate,
  validateParams(userIdParamSchema),
  validateBody(toggleBanSchema),
  toggleUserBan
);

export default userRouter;
