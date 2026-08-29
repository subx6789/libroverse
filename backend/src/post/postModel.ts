import mongoose from "mongoose";

export interface CommentEmbedded {
  _id?: mongoose.Types.ObjectId | string;
  user_id: mongoose.Types.ObjectId | string;
  user_name: string;
  user_avatar?: string;
  content: string;
  createdAt: Date;
}

export interface Post {
  _id: string | mongoose.Types.ObjectId;
  title?: string;
  content: string;
  author: mongoose.Types.ObjectId | string;
  ebook_id?: mongoose.Types.ObjectId | string;
  media_url?: string;
  media_type?: "image" | "video" | "none";
  likes: (mongoose.Types.ObjectId | string)[];
  likes_count: number;
  shares_count: number;
  total_comments_count: number;
  recent_comments: CommentEmbedded[];
  topic?: string;
  createdAt: Date;
  updatedAt: Date;
}

const embeddedCommentSchema = new mongoose.Schema<CommentEmbedded>(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    user_name: {
      type: String,
      required: true,
    },
    user_avatar: {
      type: String,
      default: "",
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const postSchema = new mongoose.Schema<Post>(
  {
    title: {
      type: String,
      trim: true,
      default: "",
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    ebook_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
    },
    media_url: {
      type: String,
      default: "",
    },
    media_type: {
      type: String,
      enum: ["image", "video", "none"],
      default: "none",
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    likes_count: {
      type: Number,
      default: 0,
    },
    shares_count: {
      type: Number,
      default: 0,
    },
    total_comments_count: {
      type: Number,
      default: 0,
    },
    topic: {
      type: String,
      default: "General Discussion",
      trim: true,
    },
    recent_comments: {
      type: [embeddedCommentSchema],
      default: [],
      validate: [
        (val: CommentEmbedded[]) => val.length <= 3,
        "{PATH} exceeds limit of 3 recent comments for hybrid schema optimization",
      ],
    },
  },
  { timestamps: true }
);

export default mongoose.model<Post>("Post", postSchema);
