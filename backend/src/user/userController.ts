import { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import userModel from "./userModel";
import postModel from "../post/postModel";
import bcrypt from "bcrypt";
import { sign } from "jsonwebtoken";
import { config } from "../config/config";
import { User } from "./userTypes";
import { AuthRequest } from "../middlewares/authenticate";

/**
 * Create a new user
 */
const createUser = async (req: Request, res: Response, next: NextFunction) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return next(createHttpError(400, "All fields are required"));
  }

  try {
    const existingUser = await userModel.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return next(createHttpError(400, "User already exists with this email"));
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser: User = await userModel.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
    });

    const token = sign({ sub: newUser._id }, config.jwtSecret as string, {
      expiresIn: "7d",
    });

    res.status(201).json({
      accessToken: token,
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role || "user",
        avatar: newUser.avatar || "",
        isBanned: false,
      },
    });
  } catch (err: any) {
    return next(createHttpError(500, `Error registering user: ${err?.message}`));
  }
};

/**
 * Login user (with ban verification)
 */
const loginUser = async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(createHttpError(400, "Email and password are required"));
  }

  try {
    const user = await userModel.findOne({ email: email.toLowerCase() });
    if (!user || !user.password) {
      return next(createHttpError(404, "Invalid email or password"));
    }

    // Enforce account suspension check
    if (user.isBanned) {
      return next(
        createHttpError(
          403,
          `Account Suspended: ${user.bannedReason || "Your account has been deactivated by community administrators."}`
        )
      );
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return next(createHttpError(400, "Invalid credentials"));
    }

    const token = sign({ sub: user._id }, config.jwtSecret as string, {
      expiresIn: "7d",
    });

    res.status(200).json({
      accessToken: token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role || "user",
        avatar: user.avatar || "",
        isBanned: user.isBanned || false,
      },
    });
  } catch (err: any) {
    return next(createHttpError(500, `Error logging in: ${err?.message}`));
  }
};

/**
 * Get current user profile
 */
const getSelf = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const _req = req as AuthRequest;
    const user = await userModel.findById(_req.userId).select("-password");
    if (!user) {
      return next(createHttpError(404, "User not found"));
    }
    if (user.isBanned) {
      return next(createHttpError(403, "Your account is currently suspended."));
    }
    res.status(200).json(user);
  } catch (err: any) {
    return next(createHttpError(500, `Error fetching profile: ${err?.message}`));
  }
};

/**
 * Admin: List all platform users with post statistics
 */
const listAllUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const _req = req as AuthRequest;
    const currentUser = await userModel.findById(_req.userId);
    if (currentUser?.role !== "admin") {
      return next(createHttpError(403, "Admin authorization required"));
    }

    const users = await userModel.find().select("-password").sort({ createdAt: -1 });

    // Aggregate user post counts
    const userPostCounts = await postModel.aggregate([
      { $group: { _id: "$author", count: { $sum: 1 } } },
    ]);

    const countMap = new Map();
    userPostCounts.forEach((item) => {
      countMap.set(item._id.toString(), item.count);
    });

    const enrichedUsers = users.map((u) => {
      const uObj = u.toObject();
      return {
        ...uObj,
        postsCount: countMap.get(u._id.toString()) || 0,
      };
    });

    res.json(enrichedUsers);
  } catch (err: any) {
    return next(createHttpError(500, `Error fetching users: ${err?.message}`));
  }
};

/**
 * Admin: Toggle user ban / active status
 */
const toggleUserBan = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const _req = req as AuthRequest;
    const currentUser = await userModel.findById(_req.userId);
    if (currentUser?.role !== "admin") {
      return next(createHttpError(403, "Admin authorization required"));
    }

    const targetUserId = req.params.userId;
    const { reason } = req.body;

    const targetUser = await userModel.findById(targetUserId);
    if (!targetUser) {
      return next(createHttpError(404, "Target user not found"));
    }

    if (targetUser.role === "admin") {
      return next(createHttpError(400, "Administrators cannot be suspended"));
    }

    targetUser.isBanned = !targetUser.isBanned;
    targetUser.bannedReason = targetUser.isBanned ? reason || "Violation of community standards" : "";
    await targetUser.save();

    res.json({
      message: targetUser.isBanned ? "User account suspended" : "User account restored",
      user: {
        _id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        isBanned: targetUser.isBanned,
        bannedReason: targetUser.bannedReason,
      },
    });
  } catch (err: any) {
    return next(createHttpError(500, `Error updating user status: ${err?.message}`));
  }
};

/**
 * User: Toggle save post
 */
const toggleSavePost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const _req = req as AuthRequest;
    const postId = Array.isArray(req.params.postId) ? req.params.postId[0] : req.params.postId;
    if (!postId) {
      return next(createHttpError(400, "Post ID is required"));
    }

    const user = await userModel.findById(_req.userId);
    if (!user) {
      return next(createHttpError(404, "User not found"));
    }

    const savedPosts = (user.savedPosts || []).map((id) => id.toString());
    const isSaved = savedPosts.includes(postId);

    if (isSaved) {
      user.savedPosts = user.savedPosts?.filter((id) => id.toString() !== postId);
    } else {
      user.savedPosts?.push(postId as any);
    }

    await user.save();

    res.json({
      saved: !isSaved,
      savedPosts: user.savedPosts,
    });
  } catch (err: any) {
    return next(createHttpError(500, `Error saving post: ${err?.message}`));
  }
};

export { createUser, loginUser, getSelf, listAllUsers, toggleUserBan, toggleSavePost };
