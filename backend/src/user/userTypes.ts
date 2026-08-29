import mongoose from "mongoose";

export interface User {
  _id: string | mongoose.Types.ObjectId;
  name: string;
  email: string;
  password?: string;
  role: "admin" | "user";
  avatar?: string;
  bio?: string;
  isBanned?: boolean;
  bannedReason?: string;
  savedPosts?: (string | mongoose.Types.ObjectId)[];
  followers?: (string | mongoose.Types.ObjectId)[];
  following?: (string | mongoose.Types.ObjectId)[];
  createdAt: Date;
  updatedAt: Date;
}
