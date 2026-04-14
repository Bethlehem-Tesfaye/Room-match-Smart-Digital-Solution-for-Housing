import express from "express";
import {
  getRoommateSuggestions,
  updatePreferences,
  getMyPreferences
} from "./roommateController.js";
import authMiddleware from "../../middlewares/auth.middleware.js";

const router = express.Router();

// Apply authentication middleware to all roommate routes
router.use(authMiddleware);

// Get roommate suggestions (matches)
router.get("/suggestions", getRoommateSuggestions);

// Update your roommate preferences
router.put("/preferences", updatePreferences);

// Get your current preferences
router.get("/preferences", getMyPreferences);

export default router;
