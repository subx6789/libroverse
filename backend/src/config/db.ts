import mongoose from "mongoose";
import { config } from "./config";

const connectDB = async () => {
  const uri = config.databaseUrl || "mongodb://localhost:27017/ebook-management";
  try {
    mongoose.connection.on("connected", () => {
      console.log("MongoDB connected successfully");
    });
    mongoose.connection.on("error", (err: any) => {
      console.error("MongoDB connection error:", err?.message || err);
    });
    await mongoose.connect(uri);
  } catch (err: any) {
    console.error(`MongoDB connection warning (${uri}):`, err?.message || err);
    if (config.env === "production") {
      process.exit(1);
    }
  }
};

export default connectDB;

