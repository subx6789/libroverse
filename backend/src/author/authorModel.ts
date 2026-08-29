import mongoose from "mongoose";

export interface Author {
  _id: string | mongoose.Types.ObjectId;
  name: string;
  bio?: string;
  avatar_url?: string;
  createdAt: Date;
  updatedAt: Date;
}

const authorSchema = new mongoose.Schema<Author>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    bio: {
      type: String,
      trim: true,
      default: "",
    },
    avatar_url: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export default mongoose.model<Author>("Author", authorSchema);
