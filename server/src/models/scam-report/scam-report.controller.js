import * as scamReportService from "./scam-report.service.js";
import {
  blockUser,
  getBlockStatus,
  listBlockedUserIds,
  unblockUser
} from "../user-block/user-block.service.js";
import { UserProfile } from "../profile/schema.js";
import { User } from "../auth/schema.js";
import mongoose from "mongoose";

export const reportListing = async (req, res, next) => {
  try {
    const { propertyId } = req.params;
    const { reason, description } = req.body;

    const report = await scamReportService.createListingReport({
      reporterUserId: req.userId,
      propertyId,
      reason,
      description
    });

    return res.status(201).json({
      message: "Listing report submitted.",
      reportId: String(report._id)
    });
  } catch (err) {
    return next(err);
  }
};

export const reportUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { reason, description } = req.body;

    const report = await scamReportService.createUserReport({
      reporterUserId: req.userId,
      reportedUserId: userId,
      reason,
      description
    });

    return res.status(201).json({
      message: "User report submitted.",
      reportId: String(report._id)
    });
  } catch (err) {
    return next(err);
  }
};

export const blockUserById = async (req, res, next) => {
  try {
    const { userId } = req.params;

    await blockUser({
      blockerUserId: req.userId,
      blockedUserId: userId
    });

    return res.status(200).json({
      message: "User blocked. You will no longer be able to message each other."
    });
  } catch (err) {
    return next(err);
  }
};

export const unblockUserById = async (req, res, next) => {
  try {
    const { userId } = req.params;

    await unblockUser({
      blockerUserId: req.userId,
      blockedUserId: userId
    });

    return res.status(200).json({ message: "User unblocked." });
  } catch (err) {
    return next(err);
  }
};

export const getBlockStatusForUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const status = await getBlockStatus({
      viewerUserId: req.userId,
      otherUserId: userId
    });

    return res.status(200).json(status);
  } catch (err) {
    return next(err);
  }
};

export const listMyBlockedUsers = async (req, res, next) => {
  try {
    const blockedUserIds = await listBlockedUserIds(req.userId);

    if (!blockedUserIds.length) {
      return res.status(200).json({ users: [] });
    }

    const objectIds = blockedUserIds
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));

    const [profiles, authUsers] = await Promise.all([
      UserProfile.find({ userId: { $in: blockedUserIds } }).lean(),
      objectIds.length
        ? User.find({ _id: { $in: objectIds } })
            .select({ _id: 1, name: 1, email: 1 })
            .lean()
        : []
    ]);

    const profileByUserId = new Map(
      profiles.map((profile) => [String(profile.userId), profile])
    );
    const authUserById = new Map(
      authUsers.map((user) => [String(user._id), user])
    );

    const users = blockedUserIds.map((userId) => {
      const profile = profileByUserId.get(userId);
      const authUser = authUserById.get(userId);

      return {
        userId,
        name:
          profile?.fullName?.trim() ||
          authUser?.name?.trim() ||
          authUser?.email ||
          "Unknown user",
        email: authUser?.email || ""
      };
    });

    return res.status(200).json({ users });
  } catch (err) {
    return next(err);
  }
};
