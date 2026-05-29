import express from "express";
import mongoose from "mongoose";
import { ObjectId } from "mongodb";
import authMiddleware from "../middlewares/auth.middleware.js";
import adminMiddleware from "../middlewares/admin.middleware.js";
import { env } from "../config/evnironments.js";
import { UserProfile } from "../models/profile/schema.js";
import { Property, PropertyImage } from "../models/property/schema.js";
import { RoommateProfile } from "../models/roommate/schema.js";
import { Notification } from "../models/notification/schema.js";
import {
  attachUploadedPropertyImages,
  makeUploader,
  normalizePropertyMultipartBody
} from "../middlewares/upload.middleware.js";
import { syncPropertyImages } from "../utils/property.creator.utils.js";

const uploader = makeUploader();

const adminRouter = express.Router();

adminRouter.post("/promote", async (req, res, next) => {
  try {
    const { userId, adminSecret } = req.body;

    if (!userId || !adminSecret) {
      return res
        .status(400)
        .json({ message: "userId and adminSecret are required." });
    }

    if (adminSecret !== env.ADMIN_SECRET_KEY) {
      return res.status(403).json({ message: "Invalid admin secret key." });
    }

    const db = mongoose.connection.db;
    if (!db) {
      return res
        .status(500)
        .json({ message: "Database connection is not available." });
    }

    const profileCollection = db.collection("userProfile");
    const updateResult = await profileCollection.updateOne(
      { userId },
      { $set: { role: "admin", updatedAt: new Date() } },
      { upsert: false }
    );

    if (updateResult.matchedCount === 0) {
      return res.status(404).json({
        message: "Admin profile not found. Sign up first before promoting."
      });
    }

    return res.status(200).json({ message: "Admin promoted successfully." });
  } catch (error) {
    next(error);
  }
});

adminRouter.get(
  "/summary",
  authMiddleware,
  adminMiddleware,
  async (req, res, next) => {
    try {
      const db = mongoose.connection.db;
      if (!db) {
        return res
          .status(500)
          .json({ message: "Database connection is not available." });
      }

      const totalUsers = await db.collection("user").countDocuments({});
      const totalAdmins = await UserProfile.countDocuments({
        role: "admin",
        deletedAt: null
      });
      const owners = (await Property.distinct("ownerId", { deletedAt: null }))
        .length;
      const properties = await Property.countDocuments({ deletedAt: null });
      const activeListings = await Property.countDocuments({
        status: "Active",
        deletedAt: null
      });
      const roommateProfiles = await RoommateProfile.countDocuments();
      const tenants = Math.max(totalUsers - totalAdmins, 0);

      return res.status(200).json({
        totalUsers,
        owners,
        tenants,
        properties,
        activeListings,
        roommateProfiles,
        totalAdmins
      });
    } catch (error) {
      next(error);
    }
  }
);

adminRouter.get(
  "/users",
  authMiddleware,
  adminMiddleware,
  async (req, res, next) => {
    try {
      const db = mongoose.connection.db;
      if (!db) {
        return res
          .status(500)
          .json({ message: "Database connection is not available." });
      }

      const users = await db
        .collection("user")
        .find({})
        .sort({ createdAt: -1 })
        .limit(100)
        .toArray();

      const userIds = users.map((user) => String(user._id));
      const profiles = await UserProfile.find({
        userId: { $in: userIds }
      }).lean();
      const profileMap = new Map(
        profiles.map((profile) => [String(profile.userId), profile])
      );
      const ownerIds = new Set(
        await Property.distinct("ownerId", { deletedAt: null })
      );

      const formattedUsers = users.map((user) => {
        const profile = profileMap.get(String(user._id));
        const role = profile?.role ?? "user";
        const isAdminUser = role === "admin";
        const status = profile?.deletedAt ? "Blocked" : "Active";
        const joinedAt = user.createdAt ? new Date(user.createdAt) : null;

        return {
          id: String(user._id),
          name: profile?.fullName || user.name || user.email || "Unknown",
          email: user.email || "",
          type: isAdminUser
            ? "Admin"
            : ownerIds.has(String(user._id))
              ? "Owner"
              : "Tenant",
          role,
          joined: joinedAt
            ? joinedAt.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric"
              })
            : "",
          status,
          reason: profile?.blockedReason || null
        };
      });

      return res.status(200).json({ users: formattedUsers });
    } catch (error) {
      next(error);
    }
  }
);

adminRouter.get(
  "/reports",
  authMiddleware,
  adminMiddleware,
  async (req, res, next) => {
    try {
      const reports = await Notification.find({
        userId: req.userId,
        title: { $regex: /^Unblock request from/i }
      })
        .sort({ createdAt: -1 })
        .lean();

      return res.status(200).json({ reports });
    } catch (error) {
      next(error);
    }
  }
);

// Admin property CRUD
adminRouter.get(
  "/properties",
  authMiddleware,
  adminMiddleware,
  async (req, res, next) => {
    try {
      const db = mongoose.connection.db;
      if (!db)
        return res
          .status(500)
          .json({ message: "Database connection unavailable." });

      const props = await Property.find({ deletedAt: null })
        .sort({ createdAt: -1 })
        .lean();
      const ownerIds = [...new Set(props.map((p) => p.ownerId))];
      const owners = await db
        .collection("user")
        .find({ _id: { $in: ownerIds.map((id) => new ObjectId(id)) } })
        .toArray();
      const ownerMap = new Map(
        owners.map((o) => [
          String(o._id),
          { name: o.name || o.email || "Unknown", email: o.email || "" }
        ])
      );

      const formatted = props.map((p) => {
        const ownerData = ownerMap.get(p.ownerId) || {
          name: "Unknown",
          email: ""
        };
        return {
          id: String(p._id),
          title: p.title || "Untitled",
          ownerName: ownerData.name,
          ownerEmail: ownerData.email,
          place: [p.address, p.city].filter(Boolean).join(", "),
          status: p.status || "Active",
          createdAt: p.createdAt,
          postedDate: p.createdAt
            ? new Date(p.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric"
              })
            : ""
        };
      });
      return res.status(200).json({ properties: formatted });
    } catch (error) {
      next(error);
    }
  }
);

adminRouter.get(
  "/properties/:id",
  authMiddleware,
  adminMiddleware,
  async (req, res, next) => {
    try {
      const db = mongoose.connection.db;
      if (!db)
        return res
          .status(500)
          .json({ message: "Database connection unavailable." });

      const prop = await Property.findById(req.params.id).lean();
      if (!prop)
        return res.status(404).json({ message: "Property not found." });

      const owner = await db
        .collection("user")
        .findOne({ _id: new ObjectId(prop.ownerId) });

      const images = await PropertyImage.find({
        propertyId: prop._id,
        deletedAt: null
      })
        .sort({ isPrimary: -1, createdAt: 1 })
        .lean();

      return res.status(200).json({
        property: {
          ...prop,
          ownerName: owner?.name || owner?.email || "Unknown",
          images
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

adminRouter.post(
  "/properties",
  authMiddleware,
  adminMiddleware,
  async (req, res, next) => {
    try {
      const data = req.body || {};
      const created = await Property.create({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return res.status(201).json({ property: created });
    } catch (error) {
      next(error);
    }
  }
);

adminRouter.patch(
  "/properties/:id",
  authMiddleware,
  adminMiddleware,
  uploader.array("images", 10),
  normalizePropertyMultipartBody,
  attachUploadedPropertyImages,
  async (req, res, next) => {
    try {
      const property = await Property.findById(req.params.id).lean();
      if (!property) {
        return res.status(404).json({ message: "Property not found." });
      }

      const { images, ...updates } = req.body;
      const updated = await Property.findByIdAndUpdate(
        req.params.id,
        { ...updates, updatedAt: new Date() },
        { new: true }
      ).lean();

      // Only sync images if images array is provided and non-empty
      // This prevents accidental deletion of images during property updates that don't involve image changes
      if (images && Array.isArray(images) && images.length > 0) {
        await syncPropertyImages({ propertyId: property._id, images });
      }

      return res.status(200).json({ property: updated });
    } catch (error) {
      next(error);
    }
  }
);

adminRouter.delete(
  "/properties/:id",
  authMiddleware,
  adminMiddleware,
  async (req, res, next) => {
    try {
      // soft-delete by default
      const updated = await Property.findByIdAndUpdate(
        req.params.id,
        { deletedAt: new Date() },
        { new: true }
      ).lean();
      if (!updated)
        return res.status(404).json({ message: "Property not found." });
      return res.status(200).json({ success: true });
    } catch (error) {
      next(error);
    }
  }
);

adminRouter.patch(
  "/users/:id/blocked",
  authMiddleware,
  adminMiddleware,
  async (req, res, next) => {
    try {
      const userId = req.params.id;
      const { blocked, reason } = req.body;

      if (typeof blocked !== "boolean") {
        return res.status(400).json({ message: "blocked must be a boolean." });
      }

      const updateData = {
        deletedAt: blocked ? new Date() : null,
        blockedReason: blocked ? reason?.trim() || null : null
      };

      const updateResult = await UserProfile.updateOne(
        { userId },
        { $set: updateData }
      );

      if (updateResult.matchedCount === 0) {
        return res.status(404).json({ message: "User profile not found." });
      }

      return res
        .status(200)
        .json({ userId, blocked, reason: updateData.blockedReason });
    } catch (error) {
      next(error);
    }
  }
);

export default adminRouter;
