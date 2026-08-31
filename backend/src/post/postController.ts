import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { Readable } from "node:stream";
import createHttpError from "http-errors";
import postModel from "./postModel";
import userModel from "../user/userModel";
import cloudinary from "../config/cloudinary";
import { AuthRequest } from "../middlewares/authenticate";
import { config } from "../config/config";
import { postEventHub } from "./postEvents";

export const COMMUNITY_CHANNELS = [
  "General Discussion",
  "Book Reviews & Ratings",
  "Tech & Software Architecture",
  "Science Fiction & Fantasy",
  "Self-Improvement & Habits",
] as const;

/**
 * Get the list of all valid community channels/topics
 */
const getChannels = async (req: Request, res: Response) => {
  res.json({
    channels: COMMUNITY_CHANNELS,
  });
};

/**
 * Stream helper for Cloudinary buffer upload
 */
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
 * Create a new social post (Text, Image <= 2MB, Short Video <= 10MB)
 */
const createPost = async (req: Request, res: Response, next: NextFunction) => {
  const { title, content, ebook_id, topic } = req.body;

  if (!content || typeof content !== "string" || !content.trim()) {
    return next(createHttpError(400, "Post text content is required"));
  }

  const _req = req as AuthRequest;
  const authorId = new mongoose.Types.ObjectId(_req.userId);

  // Check if user is suspended or admin (admins manage catalog & moderation, not community posting)
  const user = await userModel.findById(authorId);
  if (!user || user.isBanned) {
    return next(createHttpError(403, "Suspended accounts cannot publish community posts"));
  }
  if (user.role === "admin") {
    return next(createHttpError(403, "Administrator accounts are reserved for platform moderation and cannot publish community posts"));
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
        if (file.size > config.maxPostImageSizeMb * 1024 * 1024) {
          return next(createHttpError(400, `Attached image exceeds ${config.maxPostImageSizeMb} MB limit`));
        }

        // Magic byte inspection
        const isJpeg = file.buffer[0] === 0xff && file.buffer[1] === 0xd8 && file.buffer[2] === 0xff;
        const isPng = file.buffer[0] === 0x89 && file.buffer[1] === 0x50 && file.buffer[2] === 0x4e && file.buffer[3] === 0x47;
        const isWebp = file.buffer.toString("ascii", 0, 4) === "RIFF" && file.buffer.toString("ascii", 8, 12) === "WEBP";

        if (!isJpeg && !isPng && !isWebp) {
          return next(createHttpError(400, "Attached image file is invalid or corrupted"));
        }

        mediaType = "image";
        uploadResult = await uploadStreamToCloudinary(file.buffer, {
          folder: "community-media",
          resource_type: "image",
          quality: "auto:good",
          fetch_format: "auto",
          filename_override: file.originalname,
        });
        mediaUrl = uploadResult?.secure_url || uploadResult?.url;
      } else if (isVideo) {
        if (file.size > config.maxPostVideoSizeMb * 1024 * 1024) {
          return next(createHttpError(400, `Attached video exceeds ${config.maxPostVideoSizeMb} MB limit`));
        }
        mediaType = "video";
        uploadResult = await uploadStreamToCloudinary(file.buffer, {
          folder: "community-media",
          resource_type: "video",
          quality: "auto:good",
          fetch_format: "auto",
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

    // Real-Time SSE Broadcast: Notify all connected readers of new post
    postEventHub.broadcast({
      type: "POST_CREATED",
      postId: post._id.toString(),
      topic: post.topic,
      authorName: user.name,
      timestamp: new Date().toISOString(),
    });

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
  const { topic, ebook_id, search, sort, feed, authorId, userId } = req.query;

  try {
    const filter: any = {};

    if (authorId) {
      filter.author = authorId;
    }

    if (feed === "following" && userId) {
      const currentUser = await userModel.findById(userId);
      const followingIds = currentUser?.following || [];
      filter.author = { $in: [...followingIds, userId] };
    }

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
      .limit(60);

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

    // Real-Time SSE Broadcast: Notify likes count change
    postEventHub.broadcast({
      type: "POST_LIKED",
      postId: post._id.toString(),
      likesCount: post.likes_count,
      timestamp: new Date().toISOString(),
    });

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

    // Real-Time SSE Broadcast: Notify comment added
    postEventHub.broadcast({
      type: "COMMENT_ADDED",
      postId: post._id.toString(),
      authorName: user.name,
      commentsCount: post.total_comments_count,
      timestamp: new Date().toISOString(),
    });

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

/**
 * Update an existing post (Author only)
 */
const updatePost = async (req: Request, res: Response, next: NextFunction) => {
  const postId = req.params.postId;
  const _req = req as AuthRequest;
  const { content, title, topic, removeMedia } = req.body;

  if (!content || typeof content !== "string" || !content.trim()) {
    return next(createHttpError(400, "Post text content is required"));
  }

  try {
    const post = await postModel.findById(postId);
    if (!post) {
      return next(createHttpError(404, "Post not found"));
    }

    if (post.author.toString() !== _req.userId) {
      return next(createHttpError(403, "Unauthorized to edit this post"));
    }

    post.content = content.trim();
    if (title !== undefined) post.title = title ? title.trim() : "";
    if (topic) post.topic = topic;

    const file = req.file;
    if (file) {
      const isImage = file.mimetype.startsWith("image/");
      const isVideo = file.mimetype.startsWith("video/");

      if (isImage) {
        if (file.size > config.maxPostImageSizeMb * 1024 * 1024) {
          return next(createHttpError(400, `Attached image exceeds ${config.maxPostImageSizeMb} MB limit`));
        }

        // Magic byte inspection
        const isJpeg = file.buffer[0] === 0xff && file.buffer[1] === 0xd8 && file.buffer[2] === 0xff;
        const isPng = file.buffer[0] === 0x89 && file.buffer[1] === 0x50 && file.buffer[2] === 0x4e && file.buffer[3] === 0x47;
        const isWebp = file.buffer.toString("ascii", 0, 4) === "RIFF" && file.buffer.toString("ascii", 8, 12) === "WEBP";

        if (!isJpeg && !isPng && !isWebp) {
          return next(createHttpError(400, "Attached image file is invalid or corrupted"));
        }

        // Delete old post media from Cloudinary if replacing
        if (post.media_url && post.media_url.includes("cloudinary")) {
          try {
            const parts = post.media_url.split("/");
            const folderIndex = parts.findIndex((p) => p === "community-media");
            const publicId = folderIndex !== -1 
              ? parts.slice(folderIndex).join("/").replace(/\.[^/.]+$/, "")
              : `community-media/${parts.at(-1)?.split(".")[0]}`;
            if (publicId) {
              await cloudinary.uploader.destroy(publicId, {
                resource_type: post.media_type === "video" ? "video" : "image",
              });
            }
          } catch (cldErr) {
            console.warn("Could not delete old post media from Cloudinary:", cldErr);
          }
        }

        const uploadResult = await uploadStreamToCloudinary(file.buffer, {
          folder: "community-media",
          resource_type: "image",
          quality: "auto:good",
          fetch_format: "auto",
          filename_override: file.originalname,
        });
        post.media_url = uploadResult?.secure_url || uploadResult?.url;
        post.media_type = "image";
      } else if (isVideo) {
        if (file.size > config.maxPostVideoSizeMb * 1024 * 1024) {
          return next(createHttpError(400, `Attached video exceeds ${config.maxPostVideoSizeMb} MB limit`));
        }

        // Delete old post media from Cloudinary if replacing
        if (post.media_url && post.media_url.includes("cloudinary")) {
          try {
            const parts = post.media_url.split("/");
            const folderIndex = parts.findIndex((p) => p === "community-media");
            const publicId = folderIndex !== -1 
              ? parts.slice(folderIndex).join("/").replace(/\.[^/.]+$/, "")
              : `community-media/${parts.at(-1)?.split(".")[0]}`;
            if (publicId) {
              await cloudinary.uploader.destroy(publicId, {
                resource_type: post.media_type === "video" ? "video" : "image",
              });
            }
          } catch (cldErr) {
            console.warn("Could not delete old post media from Cloudinary:", cldErr);
          }
        }

        const uploadResult = await uploadStreamToCloudinary(file.buffer, {
          folder: "community-media",
          resource_type: "video",
          quality: "auto:good",
          fetch_format: "auto",
          filename_override: file.originalname,
        });
        post.media_url = uploadResult?.secure_url || uploadResult?.url;
        post.media_type = "video";
      }
    } else if (removeMedia === "true" || removeMedia === true) {
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
          console.warn("Could not delete old post media from Cloudinary:", cldErr);
        }
      }
      post.media_url = "";
      post.media_type = "none";
    }

    await post.save();

    const populated = await postModel
      .findById(post._id)
      .populate("author", "name username email role avatar")
      .populate("ebook_id", "title coverImage genre");

    res.json(populated);
  } catch (err: any) {
    return next(createHttpError(500, `Failed to update post: ${err?.message}`));
  }
};

/**
 * Server-Sent Events (SSE) Stream for real-time post engagement & alerts
 */
const streamPostEvents = (req: Request, res: Response) => {
  // Set SSE Headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  // Send initial connection handshake
  res.write(`data: ${JSON.stringify({ type: "CONNECTED", timestamp: new Date().toISOString() })}\n\n`);

  // Event listener callback
  const onEvent = (eventData: any) => {
    res.write(`data: ${JSON.stringify(eventData)}\n\n`);
  };

  // Keep-alive heartbeat every 25s (prevents Render/Vercel free-tier proxy timeouts)
  const heartbeat = setInterval(() => {
    res.write(": heartbeat\n\n");
  }, 25000);

  postEventHub.on("post_event", onEvent);

  // Clean up when client disconnects
  req.on("close", () => {
    clearInterval(heartbeat);
    postEventHub.off("post_event", onEvent);
  });
};

export { createPost, listPosts, getChannels, toggleLikePost, addComment, sharePost, deletePost, updatePost, streamPostEvents };
