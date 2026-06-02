import CustomError from "../lib/errors.js";
import { UserProfile } from "../models/profile/schema.js";

const adminMiddleware = async (req, _res, next) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return next(new CustomError("Unauthorized user", 401));
    }

    const profile = await UserProfile.findOne({ userId }).lean();

    if (!profile || profile.role !== "admin") {
      return next(new CustomError("Admin access required", 403));
    }

    req.userProfile = profile;
    return next();
  } catch (error) {
    return next(new CustomError("Internal server error", 500));
  }
};

export default adminMiddleware;
