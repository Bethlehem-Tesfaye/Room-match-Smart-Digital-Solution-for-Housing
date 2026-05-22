/* eslint-disable prettier/prettier */
/* eslint-disable consistent-return */
import { Router } from "express";
import { MongoClient } from "mongodb";
import { env } from "../../config/evnironments.js";
import { auth } from "../auth/auth.js"; // Importing your Better Auth instance
import authMiddleware from "../../middlewares/auth.middleware.js";
import adminMiddleware from "../../middlewares/admin.middleware.js";
import CustomError from "../../lib/errors.js";

const adminRouter = Router();

let cachedDb = null;

const getDB = async () => {
  if (cachedDb) return cachedDb;
  
  const client = new MongoClient(env.DATABASE_URL);
  await client.connect();
  cachedDb = client.db();
  return cachedDb;
};

// ==========================================
// PUBLIC ADMIN ROUTE (No Middleware)
// ==========================================

// Public endpoint to register the initial root admin via Better Auth
adminRouter.post("/register-root-admin", async (req, res, next) => {
  try {
    const { name, email, password, adminSecret } = req.body;

    // Validate the incoming application master key against env configs
    if (!adminSecret || adminSecret !== env.ADMIN_SECRET_KEY) {
      return next(new CustomError("Access denied: Invalid system secret key", 403));
    }

    if (!name || !email || !password) {
      return next(new CustomError("Missing required registration fields", 400));
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Force Better Auth to create BOTH the user entity and the credentials account record
    const newUser = await auth.api.signUpEmail({
      body: {
        email: cleanEmail,
        // eslint-disable-next-line object-shorthand
        password: password,
        name: name.trim(),
      },
      // Passing headers context ensures Better Auth treats it as an internal programmatic creation 
      // which provisions the database collections correctly (creates both user and account docs)
      headers: req.headers 
    });

    if (!newUser || !newUser.user) {
      return next(new CustomError("Better Auth registration failed", 400));
    }

    const db = await getDB();
    const now = new Date();

    // 2. Prevent duplicate configuration tracks by dropping old profiles for this user ID
    await db.collection("userProfile").deleteMany({ userId: newUser.user.id });

    // 3. Link the automated Better Auth user ID to an Admin Role profile inside userProfile
    await db.collection("userProfile").insertOne({
      userId: newUser.user.id, // Links smoothly with req.user.id checked in your middleware
      fullName: name.trim(),
      role: "admin",
      isBlocked: false,
      createdAt: now,
      updatedAt: now
    });

    res.status(201).json({
      success: true,
      message: "Administrative profile securely provisioned with complete credential paths via Better Auth."
    });

  } catch (err) {
    // Passes along any Better Auth operational errors (like "User already exists") cleanly
    next(err);
  }
});

// Public dashboard for local/dev testing (no auth). Returns same shape as protected dashboard.
adminRouter.get("/dashboard-public", async (_req, res, next) => {
  try {
    const db = await getDB();

    const totalUsers = await db.collection("user").countDocuments().catch(() => 0);
    const totalProperties = await db.collection("property").countDocuments().catch(() => 0);
    const totalMessages = await db.collection("message").countDocuments().catch(() => 0);

    const recentListings = await db
      .collection("property")
      .find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray()
      .catch(() => []);

    const recentUsers = await db
      .collection("userProfile")
      .find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray()
      .catch(() => []);

    return res.status(200).json({
      success: true,
      data: {
        statistics: { totalUsers, totalProperties, totalMessages },
        recentListings,
        recentUsers
      }
    });
  } catch (err) {
    return next(err);
  }
});

// ==========================================
// PROTECTED ADMIN ROUTES (Requires Auth & Admin Profile Role)
// ==========================================

// All admin routes below this point require both authentication and admin role verification
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