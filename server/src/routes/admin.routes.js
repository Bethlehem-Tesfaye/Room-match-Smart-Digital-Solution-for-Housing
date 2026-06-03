import express from "express";
import mongoose from "mongoose";
import { ObjectId } from "mongodb";
import { fromNodeHeaders } from "better-auth/node";
import authMiddleware from "../middlewares/auth.middleware.js";
import adminMiddleware from "../middlewares/admin.middleware.js";
import { auth } from "../models/auth/auth.js";
import { env } from "../config/evnironments.js";
import { UserProfile } from "../models/profile/schema.js";
import { Property, PropertyImage } from "../models/property/schema.js";
import { RoommateProfile } from "../models/roommate/schema.js";
import { Notification } from "../models/notification/schema.js";
import {
  emitAdminNotificationCounts,
  getAdminNotificationCountsForUser,
  markAdminPropertyNotificationsAsRead,
  markAdminReportNotificationsAsRead,
  markAdminScamReportNotificationsAsRead,
  markAdminSupportNotificationsAsRead
} from "../models/notification/notification.service.js";
import { ScamReport } from "../models/scam-report/schema.js";
import {
  getReportCountsForUser,
  getScamReportById
} from "../models/scam-report/scam-report.service.js";
import { User } from "../models/auth/schema.js";
import {
  attachUploadedPropertyImages,
  makeUploader,
  normalizePropertyMultipartBody
} from "../middlewares/upload.middleware.js";
import { syncPropertyImages } from "../utils/property.creator.utils.js";
import {
  buildAdminPaginationMeta,
  escapeRegex,
  parseAdminPagination
} from "../utils/adminPagination.js";

const uploader = makeUploader();

const adminRouter = express.Router();

const isValidAdminSecret = (adminSecret) =>
  Boolean(adminSecret) && adminSecret === env.ADMIN_SECRET_KEY;

adminRouter.post("/validate-secret", async (req, res) => {
  const { adminSecret } = req.body ?? {};

  if (!adminSecret) {
    return res.status(400).json({ message: "Admin secret key is required." });
  }

  if (!isValidAdminSecret(adminSecret)) {
    return res.status(403).json({ message: "Invalid admin secret key." });
  }

  return res.status(200).json({ valid: true });
});

adminRouter.get("/me", authMiddleware, async (req, res) => {
  const profile = req.userProfile;

  if (!profile || profile.role !== "admin") {
    return res.status(403).json({
      message: "This account does not have admin access. Use an admin account."
    });
  }

  return res.status(200).json({
    isAdmin: true,
    user: {
      id: req.userId,
      email: req.user?.email ?? "",
      name: req.user?.name ?? profile.fullName ?? ""
    }
  });
});

adminRouter.post("/signup-rollback", authMiddleware, async (req, res, next) => {
  try {
    const userId = req.userId;
    const profile = await UserProfile.findOne({ userId }).lean();

    if (profile?.role === "admin") {
      return res
        .status(400)
        .json({ message: "Cannot rollback a promoted admin account." });
    }

    const db = mongoose.connection.db;
    if (!db) {
      return res
        .status(500)
        .json({ message: "Database connection is not available." });
    }

    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user id." });
    }

    const userObjectId = new ObjectId(userId);

    await db.collection("user").deleteOne({ _id: userObjectId });
    await db.collection("session").deleteMany({ userId });
    await db.collection("account").deleteMany({ userId });
    await UserProfile.deleteOne({ userId });

    try {
      await auth.api.signOut({ headers: fromNodeHeaders(req.headers) });
    } catch {
      // Session may already be invalid after user deletion.
    }

    return res.status(200).json({ message: "Incomplete admin signup removed." });
  } catch (error) {
    next(error);
  }
});

adminRouter.post("/promote", async (req, res, next) => {
  try {
    const { userId, adminSecret } = req.body;

    if (!userId || !adminSecret) {
      return res
        .status(400)
        .json({ message: "userId and adminSecret are required." });
    }

    if (!isValidAdminSecret(adminSecret)) {
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

      const activeUsers = await db
        .collection("user")
        .find({ deletedAt: null })
        .project({ _id: 1 })
        .toArray();
      const activeUserIds = activeUsers.map((user) => String(user._id));

      const ownerIds = new Set(
        (await Property.distinct("ownerId", { deletedAt: null })).map(String)
      );

      const profiles = await UserProfile.find({
        userId: { $in: activeUserIds },
        deletedAt: null
      }).lean();
      const adminIds = new Set(
        profiles
          .filter((profile) => profile.role === "admin")
          .map((profile) => String(profile.userId))
      );

      const totalAdmins = adminIds.size;
      const totalUsers = activeUserIds.filter((id) => !adminIds.has(id)).length;
      const tenants = activeUserIds.filter(
        (id) => !adminIds.has(id) && !ownerIds.has(id)
      ).length;
      const owners = ownerIds.size;
      const properties = await Property.countDocuments({ deletedAt: null });
      const activeListings = await Property.countDocuments({
        status: "Active",
        deletedAt: null
      });
      const roommateProfiles = await RoommateProfile.countDocuments();

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

      const { page, limit, skip } = parseAdminPagination(req.query);
      const roleFilter = req.query.role === "admin" ? "admin" : "user";
      const search = String(req.query.search ?? "").trim();
      const searchField = String(req.query.searchField ?? "all");

      const adminProfiles = await UserProfile.find({ role: "admin" })
        .select("userId")
        .lean();
      const adminUserIds = adminProfiles
        .map((profile) => profile.userId)
        .filter((id) => ObjectId.isValid(String(id)))
        .map((id) => new ObjectId(String(id)));

      const userQuery = { deletedAt: null };

      if (roleFilter === "admin") {
        userQuery._id = { $in: adminUserIds.length ? adminUserIds : [] };
      } else {
        userQuery._id = { $nin: adminUserIds };
      }

      const ownerIdStrings = (
        await Property.distinct("ownerId", { deletedAt: null })
      ).map(String);
      const ownerObjectIds = ownerIdStrings
        .filter((id) => ObjectId.isValid(id))
        .map((id) => new ObjectId(id));

      if (search) {
        if (searchField === "joined") {
          const joinedDate = new Date(search);
          if (!Number.isNaN(joinedDate.getTime())) {
            const start = new Date(joinedDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(joinedDate);
            end.setHours(23, 59, 59, 999);
            userQuery.createdAt = { $gte: start, $lte: end };
          }
        } else if (searchField === "type") {
          const normalizedType = search.toLowerCase();
          if (normalizedType === "admin") {
            userQuery._id = {
              $in: adminUserIds.length ? adminUserIds : []
            };
          } else if (normalizedType === "owner") {
            userQuery._id = {
              $in: ownerObjectIds.length ? ownerObjectIds : [],
              $nin: adminUserIds
            };
          } else if (normalizedType === "tenant") {
            userQuery._id = {
              $nin: [...adminUserIds, ...ownerObjectIds]
            };
          }
        } else {
          const regex = new RegExp(escapeRegex(search), "i");
          const searchClauses = [];

          if (searchField === "all" || searchField === "email") {
            searchClauses.push({ email: regex });
          }
          if (searchField === "all" || searchField === "name") {
            searchClauses.push({ name: regex });
            const profileMatches = await UserProfile.find({
              fullName: regex
            })
              .select("userId")
              .lean();
            const profileUserIds = profileMatches
              .map((profile) => profile.userId)
              .filter((id) => ObjectId.isValid(String(id)))
              .map((id) => new ObjectId(String(id)));
            if (profileUserIds.length) {
              searchClauses.push({ _id: { $in: profileUserIds } });
            }
          }
          if (searchField === "status") {
            const isBlocked = search.toLowerCase().includes("block");
            const statusProfiles = await UserProfile.find({
              deletedAt: isBlocked ? { $ne: null } : null
            })
              .select("userId")
              .lean();
            const statusUserIds = statusProfiles
              .map((profile) => profile.userId)
              .filter((id) => ObjectId.isValid(String(id)))
              .map((id) => new ObjectId(String(id)));
            if (statusUserIds.length) {
              searchClauses.push({ _id: { $in: statusUserIds } });
            }
          }

          if (searchField === "all") {
            if (search.toLowerCase().includes("owner") && ownerObjectIds.length) {
              searchClauses.push({ _id: { $in: ownerObjectIds } });
            }
            if (search.toLowerCase().includes("tenant")) {
              searchClauses.push({
                _id: { $nin: [...adminUserIds, ...ownerObjectIds] }
              });
            }
            if (search.toLowerCase().includes("admin") && adminUserIds.length) {
              searchClauses.push({ _id: { $in: adminUserIds } });
            }
          }

          if (searchClauses.length) {
            userQuery.$and = [
              ...(userQuery.$and ?? []),
              { $or: searchClauses }
            ];
          }
        }
      }

      const total = await db.collection("user").countDocuments(userQuery);
      const users = await db
        .collection("user")
        .find(userQuery)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();

      const userIds = users.map((user) => String(user._id));
      const profiles = await UserProfile.find({
        userId: { $in: userIds }
      }).lean();
      const profileMap = new Map(
        profiles.map((profile) => [String(profile.userId), profile])
      );
      const ownerIds = new Set(ownerIdStrings);

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

      return res.status(200).json({
        users: formattedUsers,
        pagination: buildAdminPaginationMeta(total, page, limit)
      });
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
      const { page, limit, skip } = parseAdminPagination(req.query);
      const reportQuery = {
        userId: req.userId,
        title: { $regex: /^Unblock request from/i }
      };

      const total = await Notification.countDocuments(reportQuery);
      const reports = await Notification.find(reportQuery)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const formattedReports = reports.map((report) => ({
        id: String(report._id),
        title: report.title,
        content: report.content,
        isRead: report.isRead,
        createdAt: report.createdAt
      }));

      return res.status(200).json({
        reports: formattedReports,
        pagination: buildAdminPaginationMeta(total, page, limit)
      });
    } catch (error) {
      next(error);
    }
  }
);

adminRouter.patch(
  "/reports/read-all",
  authMiddleware,
  adminMiddleware,
  async (req, res, next) => {
    try {
      const result = await markAdminReportNotificationsAsRead(req.userId);
      const counts = await emitAdminNotificationCounts(req.userId);

      return res.status(200).json({
        ...result,
        counts
      });
    } catch (error) {
      next(error);
    }
  }
);

adminRouter.get(
  "/support-messages",
  authMiddleware,
  adminMiddleware,
  async (req, res, next) => {
    try {
      const { page, limit, skip } = parseAdminPagination(req.query);
      const supportQuery = {
        userId: req.userId,
        type: "Support"
      };

      const total = await Notification.countDocuments(supportQuery);
      const messages = await Notification.find(supportQuery)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const formattedMessages = messages.map((entry) => ({
        id: String(entry._id),
        title: entry.title,
        content: entry.content,
        isRead: entry.isRead,
        createdAt: entry.createdAt
      }));

      return res.status(200).json({
        messages: formattedMessages,
        pagination: buildAdminPaginationMeta(total, page, limit)
      });
    } catch (error) {
      next(error);
    }
  }
);

adminRouter.patch(
  "/support-messages/read-all",
  authMiddleware,
  adminMiddleware,
  async (req, res, next) => {
    try {
      const result = await markAdminSupportNotificationsAsRead(req.userId);
      const counts = await emitAdminNotificationCounts(req.userId);

      return res.status(200).json({
        ...result,
        counts
      });
    } catch (error) {
      next(error);
    }
  }
);

adminRouter.patch(
  "/notifications/properties/read-all",
  authMiddleware,
  adminMiddleware,
  async (req, res, next) => {
    try {
      const result = await markAdminPropertyNotificationsAsRead(req.userId);
      const counts = await emitAdminNotificationCounts(req.userId);

      return res.status(200).json({
        ...result,
        counts
      });
    } catch (error) {
      next(error);
    }
  }
);

const resolveUserLabels = async (userIds) => {
  const uniqueIds = [...new Set(userIds.filter(Boolean))];
  const objectIds = uniqueIds
    .filter((id) => ObjectId.isValid(id))
    .map((id) => new ObjectId(id));

  const [profiles, users] = await Promise.all([
    UserProfile.find({ userId: { $in: uniqueIds } }).lean(),
    objectIds.length
      ? User.find({ _id: { $in: objectIds } })
          .select({ _id: 1, name: 1, email: 1 })
          .lean()
      : []
  ]);

  const profileByUserId = new Map(
    profiles.map((profile) => [String(profile.userId), profile])
  );
  const userById = new Map(users.map((user) => [String(user._id), user]));

  const labelFor = (userId) => {
    const profile = profileByUserId.get(String(userId));
    const authUser = userById.get(String(userId));
    const name =
      profile?.fullName?.trim() || authUser?.name?.trim() || "Unknown user";
    const email = authUser?.email || "";
    return { userId: String(userId), name, email };
  };

  return new Map(uniqueIds.map((id) => [String(id), labelFor(id)]));
};

const formatScamReportRow = (report, labels, propertyTitle = null) => {
  const reporter = labels.get(String(report.reporterUserId)) ?? {
    userId: String(report.reporterUserId),
    name: "Unknown user",
    email: ""
  };
  const reported = labels.get(String(report.reportedUserId)) ?? {
    userId: String(report.reportedUserId),
    name: "Unknown user",
    email: ""
  };

  return {
    id: String(report._id),
    reportType: report.reportType,
    reason: report.reason,
    description: report.description || "",
    propertyId: report.propertyId ? String(report.propertyId) : null,
    propertyTitle,
    reporter,
    reported,
    createdAt: report.createdAt
  };
};

adminRouter.get(
  "/scam-reports",
  authMiddleware,
  adminMiddleware,
  async (req, res, next) => {
    try {
      const { page, limit, skip } = parseAdminPagination(req.query);
      const total = await ScamReport.countDocuments();
      const reports = await ScamReport.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const userIds = reports.flatMap((report) => [
        report.reporterUserId,
        report.reportedUserId
      ]);
      const labels = await resolveUserLabels(userIds);

      const propertyIds = reports
        .map((report) => report.propertyId)
        .filter(Boolean);
      const properties = propertyIds.length
        ? await Property.find({ _id: { $in: propertyIds } })
            .select({ _id: 1, title: 1 })
            .lean()
        : [];
      const propertyTitleById = new Map(
        properties.map((property) => [String(property._id), property.title])
      );

      const formattedReports = reports.map((report) =>
        formatScamReportRow(
          report,
          labels,
          report.propertyId
            ? propertyTitleById.get(String(report.propertyId)) ?? null
            : null
        )
      );

      return res.status(200).json({
        reports: formattedReports,
        pagination: buildAdminPaginationMeta(total, page, limit)
      });
    } catch (error) {
      next(error);
    }
  }
);

adminRouter.get(
  "/scam-reports/:id",
  authMiddleware,
  adminMiddleware,
  async (req, res, next) => {
    try {
      const report = await getScamReportById(req.params.id);
      const labels = await resolveUserLabels([
        report.reporterUserId,
        report.reportedUserId
      ]);

      let propertyTitle = null;
      if (report.propertyId) {
        const property = await Property.findById(report.propertyId)
          .select({ title: 1 })
          .lean();
        propertyTitle = property?.title ?? null;
      }

      const reportedCounts = await getReportCountsForUser(
        report.reportedUserId
      );

      return res.status(200).json({
        report: formatScamReportRow(report, labels, propertyTitle),
        reportedCounts
      });
    } catch (error) {
      next(error);
    }
  }
);

adminRouter.get(
  "/users/:id/scam-report-summary",
  authMiddleware,
  adminMiddleware,
  async (req, res, next) => {
    try {
      const userId = req.params.id;
      const counts = await getReportCountsForUser(userId);
      const labels = await resolveUserLabels([userId]);
      const profile = await UserProfile.findOne({ userId }).lean();

      return res.status(200).json({
        user: labels.get(String(userId)) ?? {
          userId: String(userId),
          name: "Unknown user",
          email: ""
        },
        status: profile?.deletedAt ? "Blocked" : "Active",
        blockedReason: profile?.blockedReason ?? null,
        ...counts
      });
    } catch (error) {
      next(error);
    }
  }
);

adminRouter.patch(
  "/scam-reports/read-all",
  authMiddleware,
  adminMiddleware,
  async (req, res, next) => {
    try {
      const result = await markAdminScamReportNotificationsAsRead(req.userId);
      const counts = await emitAdminNotificationCounts(req.userId);

      return res.status(200).json({
        ...result,
        counts
      });
    } catch (error) {
      next(error);
    }
  }
);

adminRouter.get(
  "/notifications/counts",
  authMiddleware,
  adminMiddleware,
  async (req, res, next) => {
    try {
      const counts = await getAdminNotificationCountsForUser(req.userId);

      return res.status(200).json(counts);
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

      const { page, limit, skip } = parseAdminPagination(req.query);
      const search = String(req.query.search ?? "").trim();
      const searchField = String(req.query.searchField ?? "all");

      const propertyFilter = { deletedAt: null };

      if (search) {
        const regex = new RegExp(escapeRegex(search), "i");
        const searchClauses = [];

        if (searchField === "all" || searchField === "title") {
          searchClauses.push({ title: regex });
        }
        if (searchField === "all" || searchField === "place") {
          searchClauses.push({ address: regex }, { city: regex });
        }
        if (searchField === "all" || searchField === "status") {
          searchClauses.push({ status: regex });
        }
        if (searchField === "all" || searchField === "owner" || searchField === "email") {
          const ownerQuery = { deletedAt: null };
          if (searchField === "email") {
            ownerQuery.email = regex;
          } else if (searchField === "owner") {
            ownerQuery.name = regex;
          } else {
            ownerQuery.$or = [{ email: regex }, { name: regex }];
          }

          const matchingOwners = await db
            .collection("user")
            .find(ownerQuery)
            .project({ _id: 1 })
            .toArray();
          const ownerIds = matchingOwners.map((owner) => String(owner._id));
          if (ownerIds.length) {
            searchClauses.push({ ownerId: { $in: ownerIds } });
          } else if (searchField === "owner" || searchField === "email") {
            searchClauses.push({ ownerId: "__no_match__" });
          }
        }

        if (searchClauses.length) {
          propertyFilter.$or = searchClauses;
        }
      }

      const total = await Property.countDocuments(propertyFilter);
      const props = await Property.find(propertyFilter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const ownerIds = [...new Set(props.map((p) => p.ownerId))];
      const owners =
        ownerIds.length > 0
          ? await db
              .collection("user")
              .find({
                _id: {
                  $in: ownerIds
                    .filter((id) => ObjectId.isValid(String(id)))
                    .map((id) => new ObjectId(String(id)))
                }
              })
              .toArray()
          : [];

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

      return res.status(200).json({
        properties: formatted,
        pagination: buildAdminPaginationMeta(total, page, limit)
      });
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

      try {
        const adminProfiles = await UserProfile.find({
          role: "admin",
          deletedAt: null
        })
          .select("userId")
          .lean();

        await Promise.all(
          adminProfiles.map((admin) =>
            Notification.create({
              userId: admin.userId,
              type: "ListingUpdate",
              title: "New property added",
              content: `A new property listing was added: ${created.title || "Untitled listing"}.`,
              relatedEntityId: created._id
            })
          )
        );
      } catch (notifyErr) {
        // Do not block admin property creation for notification issues.
      }

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

adminRouter.delete(
  "/users/:id",
  authMiddleware,
  adminMiddleware,
  async (req, res, next) => {
    try {
      const userId = req.params.id;
      if (!ObjectId.isValid(userId)) {
        return res.status(400).json({ message: "Invalid user id." });
      }

      if (userId === req.userId) {
        return res
          .status(400)
          .json({ message: "You cannot delete your own account." });
      }

      const db = mongoose.connection.db;
      if (!db) {
        return res
          .status(500)
          .json({ message: "Database connection unavailable." });
      }

      const updateResult = await db
        .collection("user")
        .updateOne(
          { _id: new ObjectId(userId) },
          { $set: { deletedAt: new Date() } }
        );

      if (updateResult.matchedCount === 0) {
        return res.status(404).json({ message: "User not found." });
      }

      await UserProfile.updateOne(
        { userId },
        {
          $set: {
            deletedAt: new Date(),
            blockedReason: "Deleted by admin"
          }
        }
      );

      return res.status(200).json({ success: true });
    } catch (error) {
      next(error);
    }
  }
);

export default adminRouter;
