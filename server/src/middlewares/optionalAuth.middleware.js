import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../models/auth/auth.js";

const optionalAuthMiddleware = async (req, _res, next) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers)
    });

    const user = session?.user;

    if (user?.id) {
      req.user = user;
      req.userId = user.id;
    }

    return next();
  } catch (_err) {
    return next();
  }
};

export default optionalAuthMiddleware;
