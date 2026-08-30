import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import createHttpError from "http-errors";
import { Readable } from "node:stream";
import userModel from "./userModel";
import postModel from "../post/postModel";
import bcrypt from "bcrypt";
import { sign, verify } from "jsonwebtoken";
import { config } from "../config/config";
import { User } from "./userTypes";
import { AuthRequest } from "../middlewares/authenticate";
import cloudinary from "../config/cloudinary";

const uploadStreamToCloudinary = (
  buffer: Buffer,
  options: {
    folder: string;
    resource_type: "image" | "video" | "raw" | "auto";
    filename_override?: string;
    quality?: string | number;
    fetch_format?: string;
  }
): Promise<any> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    const readable = new Readable();
    readable._read = () => {};
    readable.push(buffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });
};

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

    // Generate unique username: slug-random4Digits
    const baseSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "reader";

    let generatedUsername = "";
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 10) {
      const randNum = Math.floor(1000 + Math.random() * 9000);
      generatedUsername = `${baseSlug}-${randNum}`;
      const found = await userModel.findOne({ username: generatedUsername });
      if (!found) {
        isUnique = true;
      }
      attempts++;
    }
    if (!isUnique) {
      generatedUsername = `${baseSlug}-${Date.now().toString().slice(-4)}`;
    }

    const newUser: User = await userModel.create({
      name,
      username: generatedUsername,
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
        username: newUser.username,
        email: newUser.email,
        role: newUser.role || "user",
        avatar: newUser.avatar || "",
        coverImage: newUser.coverImage || "",
        bio: newUser.bio || "",
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

    // Backfill username if existing user does not have one yet
    if (!user.username) {
      const baseSlug = user.name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "reader";
      const randNum = Math.floor(1000 + Math.random() * 9000);
      user.username = `${baseSlug}-${randNum}`;
      await user.save();
    }

    const token = sign({ sub: user._id }, config.jwtSecret as string, {
      expiresIn: "7d",
    });

    res.status(200).json({
      accessToken: token,
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role || "user",
        avatar: user.avatar || "",
        coverImage: user.coverImage || "",
        bio: user.bio || "",
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
        username: user.username || "",
        email: user.email,
        role: user.role,
        avatar: user.avatar || "",
        coverImage: user.coverImage || "",
        bio: user.bio || "",
        isBanned: user.isBanned || false,
        usernameChangedAt: user.usernameChangedAt || [],
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
/**
 * Public: Search users by name, username, email, or bio
 */
const searchUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawQuery = (req.query.q as string) || "";
    const cleanQuery = rawQuery.trim();
    if (!cleanQuery) {
      return res.json([]);
    }

    // Escape regex special characters safely
    const escapedQuery = cleanQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const users = await userModel
      .find({
        $or: [
          { username: { $regex: escapedQuery, $options: "i" } },
          { name: { $regex: escapedQuery, $options: "i" } },
          { email: { $regex: escapedQuery, $options: "i" } },
          { bio: { $regex: escapedQuery, $options: "i" } },
        ],
        isBanned: { $ne: true },
      })
      .select("-password")
      .limit(10)
      .lean();

    return res.json(
      users.map((u) => ({
        ...u,
        followersCount: (u.followers || []).length,
        followingCount: (u.following || []).length,
      }))
    );
  } catch (err: any) {
    console.error("searchUsers error:", err);
    return res.json([]);
  }
};

/**
 * Check if a username is available (real-time debounced check)
 */
const checkUsername = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawUsername = (req.query.username as string) || "";
    const username = rawUsername.toLowerCase().trim();

    if (!username || username.length < 3) {
      return res.json({ available: false, message: "Username must be at least 3 characters" });
    }

    if (!/^[a-z0-9-_]+$/.test(username)) {
      return res.json({ available: false, message: "Only letters, numbers, hyphens and underscores allowed" });
    }

    // Optional auth extraction if token provided in header
    let currentUserId: string | undefined = undefined;
    const authHeader = req.header("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const tokenString = authHeader.substring(7);
        const decoded = verify(tokenString, config.jwtSecret as string) as any;
        currentUserId = decoded?.sub;
      } catch {
        // Continue unauthenticated if token invalid
      }
    }

    const existingUser = await userModel.findOne({ username }).lean();
    if (existingUser && (!currentUserId || existingUser._id.toString() !== currentUserId)) {
      return res.json({ available: false, message: "Username is already taken" });
    }

    return res.json({ available: true, message: "Username is available" });
  } catch (err: any) {
    console.error("checkUsername error:", err);
    return res.json({ available: false, message: "Could not verify username" });
  }
};

/**
 * Authenticated: Update current user's profile (name, username, bio, avatar, coverImage)
 */
const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const _req = req as AuthRequest;
    const userId = _req.userId;
    const { name, username, bio } = req.body;

    const user = await userModel.findById(userId);
    if (!user) {
      return next(createHttpError(404, "User not found"));
    }

    if (name && typeof name === "string" && name.trim()) {
      user.name = name.trim();
    }

    if (bio !== undefined && typeof bio === "string") {
      user.bio = bio.trim();
    }

    if (username && typeof username === "string") {
      const cleanUsername = username.toLowerCase().trim();
      if (cleanUsername !== user.username) {
        // Enforce max 2 changes per 30 days
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const recentChanges = (user.usernameChangedAt || []).filter(
          (d) => new Date(d) > thirtyDaysAgo
        );

        if (recentChanges.length >= 2) {
          return next(
            createHttpError(
              400,
              "You can only change your username twice within 30 days. Please try again later."
            )
          );
        }

        if (!/^[a-z0-9-_]{3,30}$/.test(cleanUsername)) {
          return next(createHttpError(400, "Username must be 3-30 characters (letters, numbers, -, _)"));
        }
        const existing = await userModel.findOne({ username: cleanUsername });
        if (existing && existing._id.toString() !== userId) {
          return next(createHttpError(400, "Username is already taken"));
        }

        user.username = cleanUsername;
        user.usernameChangedAt = [...(user.usernameChangedAt || []), new Date()];
      }
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const avatarFile = files?.avatar?.[0];
    const coverFile = files?.coverImage?.[0];

    if (avatarFile) {
      if (avatarFile.size > 5 * 1024 * 1024) {
        return next(createHttpError(400, "Avatar must be under 5 MB"));
      }
      const avatarUpload = await uploadStreamToCloudinary(avatarFile.buffer, {
        folder: "user-avatars",
        resource_type: "image",
        quality: "auto:good",
        fetch_format: "auto",
        filename_override: avatarFile.originalname,
      });
      user.avatar = avatarUpload?.secure_url || avatarUpload?.url || user.avatar;
    }

    if (coverFile) {
      if (coverFile.size > 8 * 1024 * 1024) {
        return next(createHttpError(400, "Cover image must be under 8 MB"));
      }
      const coverUpload = await uploadStreamToCloudinary(coverFile.buffer, {
        folder: "user-covers",
        resource_type: "image",
        quality: "auto:good",
        fetch_format: "auto",
        filename_override: coverFile.originalname,
      });
      user.coverImage = coverUpload?.secure_url || coverUpload?.url || user.coverImage;
    }

    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      avatar: user.avatar || "",
      coverImage: user.coverImage || "",
      bio: user.bio || "",
      isBanned: user.isBanned || false,
      usernameChangedAt: user.usernameChangedAt || [],
    });
  } catch (err: any) {
    return next(createHttpError(500, `Failed to update profile: ${err?.message}`));
  }
};

/**
 * Public/Auth: Search mentions (both users and books) for @autocomplete
 */
const searchMentions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = (req.query.q as string)?.trim();
    if (!query) {
      return res.json({ users: [], books: [] });
    }

    const [matchedUsers, matchedBooks] = await Promise.all([
      userModel
        .find({
          $or: [
            { username: { $regex: query, $options: "i" } },
            { name: { $regex: query, $options: "i" } },
          ],
          isBanned: { $ne: true },
          role: { $ne: "admin" },
        })
        .select("name username avatar")
        .limit(6)
        .lean(),
      mongoose.model("Book")
        .find({
          title: { $regex: query, $options: "i" },
        })
        .select("title coverImage genre")
        .limit(6)
        .lean(),
    ]);

    res.json({
      users: matchedUsers,
      books: matchedBooks,
    });
  } catch (err: any) {
    return next(createHttpError(500, `Error searching mentions: ${err?.message}`));
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
  checkUsername,
  updateProfile,
  searchMentions,
};
