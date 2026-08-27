import mongoose from "mongoose";
import { env } from "process";

export const connectDatabase = async (): Promise<void> => {
  try {
    if (!env.MONGO_URL) {
      console.warn("MongoDB connection skipped: MONGO_URL is missing");
      return;
    }

    await mongoose.connect(env.MONGO_URL);

    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    process.exit(1);
  }
};