import { Router } from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";

import { generateMyMatches, getMyMatches } from "./match.controller.js";

const matchRouter = Router();

matchRouter.use(authMiddleware);

// Get stored matches
matchRouter.get("/", getMyMatches);

// Trigger recomputation
matchRouter.post("/generate", generateMyMatches);

export default matchRouter;
