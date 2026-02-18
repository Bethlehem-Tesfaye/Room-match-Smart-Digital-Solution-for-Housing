import dotenv from "dotenv";
import mongoose from "mongoose";
import { logger } from "./logger.js";

dotenv.config({ path: new URL("../.env", import.meta.url).pathname });

const connectDB = async () => {
  try {
    const uri = process.env.DATABASE_URL?.replace(/^"(.*)"$/, "$1");
    if (!uri) {
      logger.error("MongoDB connection error: DATABASE_URL not set");
      process.exit(1);
    }
    await mongoose.connect(uri);
  } catch (error) {
    logger.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

export default connectDB;
