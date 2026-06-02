import { fromNodeHeaders } from "better-auth/node";
import CustomError from "../../lib/errors.js";
import { auth } from "../auth/auth.js";

export const setPasswordForCurrentUser = async (req, res, next) => {
  try {
    const result = await auth.api.setPassword({
      body: {
        newPassword: req.body.newPassword
      },
      headers: fromNodeHeaders(req.headers)
    });

    return res.status(200).json({
      message: "Password set successfully",
      data: result ?? null
    });
  } catch (err) {
    const message =
      err instanceof Error && err.message
        ? err.message
        : "Unable to set password";

    const loweredMessage = message.toLowerCase();

    if (
      loweredMessage.includes("password already") ||
      loweredMessage.includes("already set")
    ) {
      return next(new CustomError(message, 400));
    }

    return next(new CustomError(message, 400));
  }
};
