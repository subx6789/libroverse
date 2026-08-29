import mongoose from "mongoose";
import { User } from "../user/userTypes";
import { Author } from "../author/authorModel";

export interface Book {
  _id: string | mongoose.Types.ObjectId;
  title: string;
  description: string;
  author: User | mongoose.Types.ObjectId | string;
  authors: (Author | mongoose.Types.ObjectId | string)[];
  genre: string;
  coverImage: string;
  file: string;
  pdf_size_mb: number;
  cover_size_mb: number;
  createdAt: Date;
  updatedAt: Date;
}
