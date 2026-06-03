import mongoose from "mongoose";
import CustomError from "../../lib/errors.js";
import { Property } from "../property/schema.js";
import { UserProfile } from "../profile/schema.js";
import { createNotification } from "../notification/notification.service.js";
import { ScamReport } from "./schema.js";
import { REPORT_REASONS } from "./validation.js";

const { Types } = mongoose;

const toObjectId = (value, fieldName) => {
  if (!Types.ObjectId.isValid(value)) {
    throw new CustomError(`Invalid ${fieldName}`, 400);
  }

  return new Types.ObjectId(value);
};

const formatReasonLabel = (reason) =>
  reason.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

const getProfileLabel = async (userId) => {
  const profile = await UserProfile.findOne({ userId }).lean();
  return profile?.fullName?.trim() || `User ${userId}`;
};

const notifyAdmins = async ({ report, reporterLabel, reportedLabel, summary }) => {
  const adminProfiles = await UserProfile.find({ role: "admin" }).lean();

  await Promise.all(
    adminProfiles
      .map((adminProfile) => adminProfile.userId)
      .filter(Boolean)
      .map((adminId) =>
        createNotification({
          userId: adminId,
          type: "ScamReport",
          title: `Scam report: ${report.reportType === "listing" ? "Listing" : "User"}`,
          content: `${reporterLabel} reported ${reportedLabel}. Reason: ${formatReasonLabel(report.reason)}. ${summary}`,
          relatedEntityId: report._id
        })
      )
  );
};

export const createListingReport = async ({
  reporterUserId,
  propertyId,
  reason,
  description = ""
}) => {
  if (!REPORT_REASONS.includes(reason)) {
    throw new CustomError("Invalid report reason", 400);
  }

  const normalizedPropertyId = toObjectId(propertyId, "property id");
  const property = await Property.findOne({
    _id: normalizedPropertyId,
    deletedAt: null
  })
    .select({ ownerId: 1, title: 1 })
    .lean();

  if (!property) {
    throw new CustomError("Property not found", 404);
  }

  if (property.ownerId === reporterUserId) {
    throw new CustomError("You cannot report your own listing", 400);
  }

  const report = await ScamReport.create({
    reporterUserId,
    reportedUserId: property.ownerId,
    propertyId: normalizedPropertyId,
    reportType: "listing",
    reason,
    description: description?.trim() || ""
  });

  const reporterLabel = await getProfileLabel(reporterUserId);
  const reportedLabel = await getProfileLabel(property.ownerId);
  const listingTitle = property.title?.trim() || "Listing";

  await notifyAdmins({
    report,
    reporterLabel,
    reportedLabel,
    summary: `Listing: "${listingTitle}".${description ? ` Note: ${description.trim()}` : ""}`
  });

  return report;
};

export const createUserReport = async ({
  reporterUserId,
  reportedUserId,
  reason,
  description = ""
}) => {
  if (!REPORT_REASONS.includes(reason)) {
    throw new CustomError("Invalid report reason", 400);
  }

  if (reporterUserId === reportedUserId) {
    throw new CustomError("You cannot report yourself", 400);
  }

  const reportedProfile = await UserProfile.findOne({
    userId: reportedUserId
  }).lean();

  if (!reportedProfile) {
    throw new CustomError("User not found", 404);
  }

  const report = await ScamReport.create({
    reporterUserId,
    reportedUserId,
    propertyId: null,
    reportType: "user",
    reason,
    description: description?.trim() || ""
  });

  const reporterLabel = await getProfileLabel(reporterUserId);
  const reportedLabel = await getProfileLabel(reportedUserId);

  await notifyAdmins({
    report,
    reporterLabel,
    reportedLabel,
    summary: `Reported in messaging.${description ? ` Note: ${description.trim()}` : ""}`
  });

  return report;
};

export const getReportCountsForUser = async (reportedUserId) => {
  const [listingReports, userReports, totalReports] = await Promise.all([
    ScamReport.countDocuments({
      reportedUserId,
      reportType: "listing"
    }),
    ScamReport.countDocuments({
      reportedUserId,
      reportType: "user"
    }),
    ScamReport.countDocuments({ reportedUserId })
  ]);

  return { listingReports, userReports, totalReports };
};

export const getScamReportById = async (reportId) => {
  const normalizedId = toObjectId(reportId, "report id");
  const report = await ScamReport.findById(normalizedId).lean();

  if (!report) {
    throw new CustomError("Scam report not found", 404);
  }

  return report;
};
