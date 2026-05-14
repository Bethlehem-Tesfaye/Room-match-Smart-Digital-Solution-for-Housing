/* eslint-disable prettier/prettier */
/* eslint-disable consistent-return */
/* eslint-disable prettier/prettier */
import { Router } from "express";
import { MongoClient } from "mongodb";
import { env } from "../../config/evnironments.js";
import authMiddleware from "../../middlewares/auth.middleware.js";
import adminMiddleware from "../../middlewares/admin.middleware.js";

const adminRouter = Router();

let cachedDb = null;

const getDB = async () => {
  if (cachedDb) return cachedDb;
  
  const client = new MongoClient(env.DATABASE_URL);
  await client.connect();
  cachedDb = client.db();
  return cachedDb;
};

// All admin routes require both authentication and admin role
adminRouter.use(authMiddleware, adminMiddleware);

// Admin Dashboard - Get dashboard data
adminRouter.get("/dashboard", async (req, res, next) => {
  try {
    const db = await getDB();

    // Get statistics
    const totalUsers = await db.collection("user").countDocuments();
    const totalProperties = await db
      .collection("property")
      .countDocuments();
    const totalMessages = await db.collection("message").countDocuments();

    // Get recent listings (last 10)
    const recentListings = await db
      .collection("property")
      .find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();

    // Get recent users (last 10)
    const recentUsers = await db
      .collection("userProfile")
      .find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();

    res.status(200).json({
      success: true,
      data: {
        statistics: {
          totalUsers,
          totalProperties,
          totalMessages
        },
        recentListings,
        recentUsers
      }
    });
  } catch (err) {
    next(err);
  }
});

// Get all users
adminRouter.get("/users", async (req, res, next) => {
  try {
    const db = await getDB();

    const users = await db
      .collection("userProfile")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json({
      success: true,
      data: users
    });
  } catch (err) {
    next(err);
  }
});

// Get all properties
adminRouter.get("/properties", async (req, res, next) => {
  try {
    const db = await getDB();

    const properties = await db
      .collection("property")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json({
      success: true,
      data: properties
    });
  } catch (err) {
    next(err);
  }
});

// Block/Unblock user
adminRouter.patch("/users/:userId/status", async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { isBlocked } = req.body;

    const db = await getDB();

    const result = await db.collection("userProfile").updateOne(
      { userId },
      { $set: { isBlocked } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: isBlocked ? "User blocked" : "User unblocked"
    });
  } catch (err) {
    next(err);
  }
});

// Delete property
adminRouter.delete("/properties/:propertyId", async (req, res, next) => {
  try {
    const { propertyId } = req.params;

    const db = await getDB();

    const result = await db.collection("property").deleteOne({ _id: propertyId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Property not found" });
    }

    res.status(200).json({
      success: true,
      message: "Property deleted successfully"
    });
  } catch (err) {
    next(err);
  }
});

export default adminRouter;
