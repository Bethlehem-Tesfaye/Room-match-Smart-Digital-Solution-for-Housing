import express from "express";
import mongoose from "mongoose";
import { env } from "../config/evnironments.js";

const adminRouter = express.Router();

adminRouter.post("/promote", async (req, res, next) => {
  try {
    const { userId, adminSecret } = req.body;

    if (!userId || !adminSecret) {
      return res.status(400).json({ message: "userId and adminSecret are required." });
    }

    if (adminSecret !== env.ADMIN_SECRET_KEY) {
      return res.status(403).json({ message: "Invalid admin secret key." });
    }

    const db = mongoose.connection.db;
    if (!db) {
      return res.status(500).json({ message: "Database connection is not available." });
    }

    const profileCollection = db.collection("userProfile");
    const updateResult = await profileCollection.updateOne(
      { userId },
      { $set: { role: "admin", updatedAt: new Date() } },
      { upsert: false }
    );

    if (updateResult.matchedCount === 0) {
      return res.status(404).json({ message: "Admin profile not found. Sign up first before promoting." });
    }

    return res.status(200).json({ message: "Admin promoted successfully." });
  } catch (error) {
    next(error);
  }
});

export default adminRouter;
