import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { Readable } from "node:stream";
import createHttpError from "http-errors";
import postModel from "./postModel";
import userModel from "../user/userModel";
import cloudinary from "../config/cloudinary";
import { AuthRequest } from "../middlewares/authenticate";

/**
 * Stream helper for Cloudinary buffer upload
 */
const uploadStreamToCloudinary = (
  buffer: Buffer,
  options: {
    folder: string;
    resource_type: "image" | "video" | "raw" | "auto";
    filename_override?: string;
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
 * Create a new social post (Text, Image <= 2MB, Short Video <= 10MB)
 */
const createPost = async (req: Request, res: Response, next: NextFunction) => {
  const { title, content, ebook_id, topic } = req.body;

  if (!content || typeof content !== "string" || !content.trim()) {
    return next(createHttpError(400, "Post text content is required"));
  }

  const _req = req as AuthRequest;
  const authorId = new mongoose.Types.ObjectId(_req.userId);

  // Check if user is suspended
  const user = await userModel.findById(authorId);
  if (!user || user.isBanned) {
    return next(createHttpError(403, "Suspended accounts cannot publish community posts"));
  }

  const file = req.file;
  let mediaUrl = "";
  let mediaType: "image" | "video" | "none" = "none";
  let uploadResult: any = null;

  try {
    if (file) {
      const isImage = file.mimetype.startsWith("image/");
      const isVideo = file.mimetype.startsWith("video/");

      if (isImage) {
        if (file.size > 2 * 1024 * 1024) {
          return next(createHttpError(400, "Attached image exceeds 2 MB limit"));
        }
        mediaType = "image";
        uploadResult = await uploadStreamToCloudinary(file.buffer, {
          folder: "community-media",
          resource_type: "image",
          filename_override: file.originalname,
        });
        mediaUrl = uploadResult?.secure_url || uploadResult?.url;
      } else if (isVideo) {
        if (file.size > 10 * 1024 * 1024) {
          return next(createHttpError(400, "Attached video exceeds 10 MB limit"));
        }
        mediaType = "video";
        uploadResult = await uploadStreamToCloudinary(file.buffer, {
          folder: "community-media",
          resource_type: "video",
          filename_override: file.originalname,
        });
        mediaUrl = uploadResult?.secure_url || uploadResult?.url;
      }
    }

    const post = await postModel.create({
      title: title ? title.trim() : "",
      content: content.trim(),
      author: authorId,
      ebook_id: ebook_id ? new mongoose.Types.ObjectId(ebook_id) : undefined,
      media_url: mediaUrl,
      media_type: mediaType,
      topic: topic || "General Discussion",
      likes: [],
      likes_count: 0,
      shares_count: 0,
      total_comments_count: 0,
      recent_comments: [],
    });

    const populatedPost = await postModel
      .findById(post._id)
      .populate("author", "name email role avatar")
      .populate("ebook_id", "title coverImage genre");

    res.status(201).json(populatedPost);
  } catch (err: any) {
    if (uploadResult?.public_id) {
      try {
        await cloudinary.uploader.destroy(uploadResult.public_id, {
          resource_type: mediaType === "video" ? "video" : "image",
        });
      } catch (cldErr) {
        console.error("Cloudinary Post Media Rollback Error:", cldErr);
      }
    }
    return next(createHttpError(500, `Failed to publish post: ${err?.message}`));
  }
};

/**
 * List social community feed
 */
const listPosts = async (req: Request, res: Response, next: NextFunction) => {
  const { topic, ebook_id, search, sort } = req.query;

  try {
    const filter: any = {};

    if (topic && topic !== "All") {
      filter.topic = topic;
    }
    if (ebook_id) {
      filter.ebook_id = ebook_id;
    }
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
        { topic: { $regex: search, $options: "i" } },
      ];
    }

    let sortOption: any = { createdAt: -1 };
    if (sort === "top") {
      sortOption = { likes_count: -1, createdAt: -1 };
    } else if (sort === "discussed") {
      sortOption = { total_comments_count: -1, createdAt: -1 };
    }

    const posts = await postModel
      .find(filter)
      .populate("author", "name email role avatar isBanned")
      .populate("ebook_id", "title coverImage genre")
      .sort(sortOption)
      .limit(50);

    res.json(posts);
  } catch (err: any) {
    return next(createHttpError(500, `Failed to retrieve feed: ${err?.message}`));
  }
};

/**
 * Toggle Like / Unlike on a post
 */
const toggleLikePost = async (req: Request, res: Response, next: NextFunction) => {
  const postId = req.params.postId;
  const _req = req as AuthRequest;
  const userId = _req.userId;

  try {
    const post = await postModel.findById(postId);
    if (!post) {
      return next(createHttpError(404, "Post not found"));
    }

    const likes = (post.likes || []).map((id) => id.toString());
    const isLiked = likes.includes(userId);

    if (isLiked) {
      post.likes = post.likes.filter((id) => id.toString() !== userId);
      post.likes_count = Math.max(0, post.likes_count - 1);
    } else {
      post.likes.push(new mongoose.Types.ObjectId(userId) as any);
      post.likes_count += 1;
    }

    await post.save();

    res.json({
      liked: !isLiked,
      likes_count: post.likes_count,
    });
  } catch (err: any) {
    return next(createHttpError(500, `Error updating like: ${err?.message}`));
  }
};

/**
 * Add comment to a post (Embeds in top 3 recent_comments + increments count)
 */
const addComment = async (req: Request, res: Response, next: NextFunction) => {
  const postId = req.params.postId;
  const { content } = req.body;
  const _req = req as AuthRequest;
  const userId = _req.userId;

  if (!content || !content.trim()) {
    return next(createHttpError(400, "Comment text is required"));
  }

  try {
    const user = await userModel.findById(userId);
    if (!user || user.isBanned) {
      return next(createHttpError(403, "Account suspended from commenting"));
    }

    const post = await postModel.findById(postId);
    if (!post) {
      return next(createHttpError(404, "Post not found"));
    }

    const newComment = {
      _id: new mongoose.Types.ObjectId(),
      user_id: user._id,
      user_name: user.name,
      user_avatar: user.avatar || "",
      content: content.trim(),
      createdAt: new Date(),
    };

    // Keep only 3 most recent comments embedded for sub-15ms reads
    const updatedRecent = [newComment, ...(post.recent_comments || [])].slice(0, 3);

    post.recent_comments = updatedRecent as any;
    post.total_comments_count = (post.total_comments_count || 0) + 1;
    await post.save();

    res.status(201).json({
      comment: newComment,
      total_comments_count: post.total_comments_count,
      recent_comments: post.recent_comments,
    });
  } catch (err: any) {
    return next(createHttpError(500, `Failed to add comment: ${err?.message}`));
  }
};

/**
 * Increment share counter
 */
const sharePost = async (req: Request, res: Response, next: NextFunction) => {
  const postId = req.params.postId;
  try {
    const post = await postModel.findByIdAndUpdate(
      postId,
      { $inc: { shares_count: 1 } },
      { new: true }
    );
    if (!post) {
      return next(createHttpError(404, "Post not found"));
    }
    res.json({ shares_count: post.shares_count });
  } catch (err: any) {
    return next(createHttpError(500, `Failed to share post: ${err?.message}`));
  }
};

/**
 * Delete a post (Author or Admin)
 */
const deletePost = async (req: Request, res: Response, next: NextFunction) => {
  const postId = req.params.postId;
  const _req = req as AuthRequest;

  try {
    const post = await postModel.findById(postId);
    if (!post) {
      return next(createHttpError(404, "Post not found"));
    }

    const user = await userModel.findById(_req.userId);
    const isAdmin = user?.role === "admin";

    if (post.author.toString() !== _req.userId && !isAdmin) {
      return next(createHttpError(403, "Unauthorized to delete this post"));
    }

    if (post.media_url) {
      try {
        const parts = post.media_url.split("/");
        const filename = parts.at(-1)?.split(".")[0];
        if (filename) {
          await cloudinary.uploader.destroy(`community-media/${filename}`, {
            resource_type: post.media_type === "video" ? "video" : "image",
          });
        }
      } catch (cldErr) {
        console.warn("Could not delete post media from Cloudinary:", cldErr);
      }
    }

    await postModel.findByIdAndDelete(postId);
    res.sendStatus(204);
  } catch (err: any) {
    return next(createHttpError(500, `Failed to delete post: ${err?.message}`));
  }
};

export { createPost, listPosts, toggleLikePost, addComment, sharePost, deletePost };
