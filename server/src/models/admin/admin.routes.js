/* eslint-disable prettier/prettier */
/* eslint-disable consistent-return */
import { Router } from "express";
import { MongoClient } from "mongodb";
// eslint-disable-next-line import/no-extraneous-dependencies
import bcrypt from "bcryptjs";
import { env } from "../../config/evnironments.js";
import authMiddleware from "../../middlewares/auth.middleware.js";
import adminMiddleware from "../../middlewares/admin.middleware.js";
import CustomError from "../../lib/errors.js"; // Make sure this path correctly hits your custom error class

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

// Public endpoint to register the initial root admin securely via a master secret key
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

    const db = await getDB();
    const cleanEmail = email.trim().toLowerCase();

    // Prevent duplicate registrations inside the base auth collection
    const existingUser = await db.collection("user").findOne({ email: cleanEmail });
    if (existingUser) {
      return next(new CustomError("Email profile already exists", 400));
    }

    // Encrypt the password string before storing it in the credentials account record
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const now = new Date();

    // 1. Create entry inside the core 'user' collection
    const userResult = await db.collection("user").insertOne({
      name: name.trim(),
      email: cleanEmail,
      emailVerified: true,
      image: "",
      createdAt: now,
      updatedAt: now
    });

    const newUserId = userResult.insertedId;

    // 2. Create matching entry inside 'account' for credentials authentication logic
    await db.collection("account").insertOne({
      providerId: "credentials",
      accountId: cleanEmail,
      userId: newUserId,
      password: hashedPassword,
      createdAt: now,
      updatedAt: now
    });

    // 3. Create target matching authorization document inside 'userProfile' for adminMiddleware lookup
    await db.collection("userProfile").insertOne({
      userId: newUserId, // Kept as string format to explicitly match your middleware implementation (user.id)
      fullName: name.trim(),
      role: "admin",
      isBlocked: false,
      createdAt: now,
      updatedAt: now
    });

    res.status(201).json({
      success: true,
      message: "Administrative profile provisioned successfully."
    });

  } catch (err) {
    next(err);
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