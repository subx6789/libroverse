import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
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

/**
 * User: Toggle follow / unfollow another user
 */
const toggleFollowUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const _req = req as AuthRequest;
    const currentUserId = _req.userId;
    const targetUserId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;

    if (!targetUserId) {
      return next(createHttpError(400, "Target user ID is required"));
    }

    if (currentUserId === targetUserId) {
      return next(createHttpError(400, "You cannot follow yourself"));
    }

    const currentUser = await userModel.findById(currentUserId);
    const targetUser = await userModel.findById(targetUserId);

    if (!currentUser || !targetUser) {
      return next(createHttpError(404, "User not found"));
    }

    const followingList = (currentUser.following || []).map((id) => id.toString());
    const isFollowing = followingList.includes(targetUserId);

    if (isFollowing) {
      // Unfollow
      currentUser.following = (currentUser.following || []).filter(
        (id) => id.toString() !== targetUserId
      );
      targetUser.followers = (targetUser.followers || []).filter(
        (id) => id.toString() !== currentUserId
      );
    } else {
      // Follow
      if (!currentUser.following) currentUser.following = [];
      if (!targetUser.followers) targetUser.followers = [];
      currentUser.following.push(new mongoose.Types.ObjectId(targetUserId));
      targetUser.followers.push(new mongoose.Types.ObjectId(currentUserId));
    }

    await Promise.all([currentUser.save(), targetUser.save()]);

    res.json({
      isFollowing: !isFollowing,
      followersCount: (targetUser.followers || []).length,
      followingCount: (targetUser.following || []).length,
      targetUserId,
    });
  } catch (err: any) {
    return next(createHttpError(500, `Error updating follow status: ${err?.message}`));
  }
};

/**
 * Public: Get reader profile with their follower counts and posts
 */
const getUserProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const targetUserId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
    if (!targetUserId) {
      return next(createHttpError(400, "User ID is required"));
    }

    const user = await userModel.findById(targetUserId).select("-password");
    if (!user) {
      return next(createHttpError(404, "User not found"));
    }

    // Fetch user's posts
    const userPosts = await postModel
      .find({ author: targetUserId })
      .populate("author", "name email role avatar isBanned")
      .populate("ebook_id", "title coverImage genre")
      .sort({ createdAt: -1 });

    const followersCount = (user.followers || []).length;
    const followingCount = (user.following || []).length;

    res.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio || "",
        isBanned: user.isBanned || false,
        followers: user.followers || [],
        following: user.following || [],
        followersCount,
        followingCount,
        postsCount: userPosts.length,
        createdAt: user.createdAt,
      },
      posts: userPosts,
    });
  } catch (err: any) {
    return next(createHttpError(500, `Error fetching reader profile: ${err?.message}`));
  }
};

/**
 * Public: Get suggested readers / active bookworms to follow
 */
const getSuggestedUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const _req = req as AuthRequest;
    const currentUserId = _req.userId;

    const filter: any = { isBanned: { $ne: true }, role: { $ne: "admin" } };
    if (currentUserId) {
      filter._id = { $ne: new mongoose.Types.ObjectId(currentUserId) };
    }

    // Get up to 6 active users
    const suggestedUsers = await userModel
      .find(filter)
      .select("-password")
      .limit(6)
      .lean();

    // Map follower counts
    const mapped = suggestedUsers.map((u) => ({
      ...u,
      followersCount: (u.followers || []).length,
      followingCount: (u.following || []).length,
      isFollowing: currentUserId
        ? (u.followers || []).map((id: any) => id.toString()).includes(currentUserId)
        : false,
    }));

    res.json(mapped);
  } catch (err: any) {
    return next(createHttpError(500, `Error fetching suggested readers: ${err?.message}`));
  }
};

/**
 * Public: Search users by name, email, or bio
 */
const searchUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = req.query.q as string;
    if (!query || !query.trim()) {
      return res.json([]);
    }

    const users = await userModel
      .find({
        $or: [
          { name: { $regex: query, $options: "i" } },
          { email: { $regex: query, $options: "i" } },
          { bio: { $regex: query, $options: "i" } },
        ],
        isBanned: { $ne: true },
        role: { $ne: "admin" },
      })
      .select("-password")
      .limit(10)
      .lean();

    res.json(
      users.map((u) => ({
        ...u,
        followersCount: (u.followers || []).length,
        followingCount: (u.following || []).length,
      }))
    );
  } catch (err: any) {
    return next(createHttpError(500, `Error searching readers: ${err?.message}`));
  }
};

export {
  createUser,
  loginUser,
  getSelf,
  listAllUsers,
  toggleUserBan,
  toggleSavePost,
  toggleFollowUser,
  getUserProfile,
  getSuggestedUsers,
  searchUsers,
};
