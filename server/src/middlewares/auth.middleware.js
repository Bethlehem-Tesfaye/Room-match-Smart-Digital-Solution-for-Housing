import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../modules/auth/auth";

const authMiddleware = async (req, res, next) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    const user = session?.user;

    if (!user) {
      return res.status(401).json({ error: "Unauthorized user" });
    }

    // Attach user info to request
    req.user = user;

    if (!user.id) {
      return res.status(401).json({ error: "Unauthorized user" });
    }

    req.userId = user.id;

    return next();
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

export default authMiddleware;
