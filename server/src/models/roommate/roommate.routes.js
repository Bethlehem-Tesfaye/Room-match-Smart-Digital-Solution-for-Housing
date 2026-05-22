import { Router } from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
import {
  getMyRoommatePreferences,
  getMyRoommateProfile,
  updateMyRoommatePreferences,
  updateMyRoommateProfile
} from "./roommate.controller.js";

import {
  createRoommateRequest,
  getRoommateRequests,
  acceptRoommateRequest,
  rejectRoommateRequest
} from "./request.contoller.js";
import { generateMyMatches, getMyMatches } from "./match.controller.js";

const roommateRouters = Router();

roommateRouters.use(authMiddleware);

roommateRouters.get("/suggestions", getMyMatches);
roommateRouters.post("/suggestions/generate", generateMyMatches);

roommateRouters.get("/profile", getMyRoommateProfile);
roommateRouters.put("/profile", updateMyRoommateProfile);

roommateRouters.get("/preferences", getMyRoommatePreferences);
roommateRouters.put("/preferences", updateMyRoommatePreferences);

roommateRouters.post("/requests", createRoommateRequest);
roommateRouters.get("/requests", getRoommateRequests);

roommateRouters.patch("/requests/:id/accept", acceptRoommateRequest);
roommateRouters.patch("/requests/:id/reject", rejectRoommateRequest);

export default roommateRouters;
