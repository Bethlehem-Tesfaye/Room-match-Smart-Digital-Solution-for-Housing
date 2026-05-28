import {
  getProfileByUserId,
  setupBankInfoByUserId,
  updateProfileByUserId
} from "./profile.services.js";
import { createNotification } from "../notification/notification.service.js";
import { UserProfile } from "./schema.js";

export const getMyProfile = async (req, res, next) => {
  try {
    const profile = await getProfileByUserId(req.userId);
    return res.status(200).json({ profile });
  } catch (err) {
    return next(err);
  }
};

export const requestUnblock = async (req, res, next) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: "You must be signed in to request an unblock." });
    }

    const { reason } = req.body;
    const profile = await getProfileByUserId(req.userId);

    if (!profile?.deletedAt) {
      return res.status(400).json({ message: "Your account is not blocked." });
    }

    const adminProfiles = await UserProfile.find({ role: "admin" }).lean();
    const requesterName = profile.fullName || req.user?.name || req.user?.email || "Unknown user";
    const adminNotifications = adminProfiles
      .map((adminProfile) => adminProfile.userId)
      .filter(Boolean)
      .map((adminId) =>
        createNotification({
          userId: adminId,
          type: "Message",
          title: `Unblock request from ${requesterName}`,
          content: `${requesterName} (${req.user?.email || "no email"}) has requested that their account be unblocked. Reason: ${reason?.trim() || "No reason provided."}`
        })
      );

    await Promise.all(adminNotifications);

    return res.status(200).json({ message: "Your unblock request has been sent to admins." });
  } catch (err) {
    return next(err);
  }
};

export const updateMyProfile = async (req, res, next) => {
  try {
    const profile = await updateProfileByUserId({
      userId: req.userId,
      name: req.user?.name,
      payload: req.body
    });

    return res.status(200).json({
      message: "Profile updated successfully",
      profile
    });
  } catch (err) {
    return next(err);
  }
};

export const setupBankInfo = async (req, res, next) => {
  try {
    const profile = await setupBankInfoByUserId({
      userId: req.userId,
      name: req.user?.name,
      payload: req.body
    });

    return res.status(200).json({
      message: "Bank information saved successfully",
      profile
    });
  } catch (err) {
    return next(err);
  }
};
