import mongoose from "mongoose";
import { Book } from "./bookTypes";

const bookSchema = new mongoose.Schema<Book>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    authors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Author",
      },
    ],
    genre: {
      type: String,
      required: true,
      trim: true,
    },
    coverImage: {
      type: String,
      required: true,
    },
    file: {
      type: String,
      required: true,
    },
    pdf_size_mb: {
      type: Number,
      required: true,
      default: 0,
    },
    cover_size_mb: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { timestamps: true }
);

// Search & Catalog Filter Indexes
bookSchema.index({ genre: 1, createdAt: -1 });
bookSchema.index({ createdAt: -1 });
bookSchema.index({ title: "text", description: "text" });

export default mongoose.model<Book>("Book", bookSchema);
