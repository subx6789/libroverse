import mongoose from "mongoose";

export interface Category {
  _id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new mongoose.Schema<Category>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model<Category>("Category", categorySchema);
