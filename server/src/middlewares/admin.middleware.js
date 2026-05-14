/* eslint-disable prettier/prettier */
import { MongoClient } from "mongodb";
import CustomError from "../lib/errors.js";
import { env } from "../config/evnironments.js";

let cachedDb = null;

const getDB = async () => {
  if (cachedDb) return cachedDb;
  const client = new MongoClient(env.DATABASE_URL);
  await client.connect();
  cachedDb = client.db();
  return cachedDb;
};

const adminMiddleware = async (req, _res, next) => {
  try {
    const { user } = req;

    if (!user) {
      return next(new CustomError("Unauthorized user", 401));
    }

    if (!user.id) {
      return next(new CustomError("Unauthorized user", 401));
    }

    // Get user profile with role
    const db = await getDB();
    const userProfile = await db
      .collection("userProfile")
      .findOne({ userId: user.id });

    if (!userProfile) {
      return next(new CustomError("User profile not found", 404));
    }

    if (userProfile.role !== "admin") {
      return next(new CustomError("Access denied: Admin role required", 403));
    }

    // Attach user profile to request
    req.userProfile = userProfile;

    return next();
  } catch (err) {
    return next(new CustomError("Internal server error", 500));
  }
};

export default adminMiddleware;
