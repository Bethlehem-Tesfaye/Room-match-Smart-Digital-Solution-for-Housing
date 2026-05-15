/* eslint-disable prettier/prettier */
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../models/auth/auth.js";
import CustomError from "../lib/errors.js";

const authMiddleware = async (req, _res, next) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers)
    });

    const user = session?.user;

    if (!user) {
      return next(new CustomError("Unauthorized user", 401));
    }

    req.user = user;

    if (!user.id) {
      return next(new CustomError("Unauthorized user", 401));
    }

    req.userId = user.id;

    return next();
  } catch (err) {
    return next(new CustomError("Internal server error", 500));
  }
};

export default authMiddleware;
