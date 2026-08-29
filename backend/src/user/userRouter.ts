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

// Public routes
userRouter.post("/register", validateBody(registerUserSchema), createUser);
userRouter.post("/login", validateBody(loginUserSchema), loginUser);
userRouter.get("/search", validateQuery(userSearchQuerySchema), searchUsers);
userRouter.get("/check-username", validateQuery(checkUsernameQuerySchema), checkUsername);
userRouter.get("/mentions", searchMentions);
userRouter.get("/suggested", authenticate, getSuggestedUsers);
userRouter.get("/profile/:userId", validateParams(userIdParamSchema), getUserProfile);

// Authenticated user routes
userRouter.get("/self", authenticate, getSelf);
userRouter.patch(
  "/profile",
  authenticate,
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  validateBody(updateProfileSchema),
  updateProfile
);
userRouter.post("/saved/:postId", authenticate, validateParams(postIdParamSchema), toggleSavePost);
userRouter.post("/:userId/follow", authenticate, validateParams(userIdParamSchema), toggleFollowUser);

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
