import mongoose from "mongoose";
import CustomError from "../../lib/errors.js";
import { emitToUser } from "../../config/socket.js";
import { logger } from "../../config/logger.js";
import { Notification } from "./schema.js";
import { Message } from "../message/schema.js";

const { Types } = mongoose;

const UNBLOCK_REPORT_TITLE_PATTERN = /^Unblock request from/i;

const toNotificationPayload = (notification) => {
  const doc =
    typeof notification?.toObject === "function"
      ? notification.toObject()
      : notification;

  return {
    id: doc._id?.toString?.() ?? String(doc._id),
    userId: doc.userId?.toString?.() ?? String(doc.userId),
    type: doc.type,
    title: doc.title,
    content: doc.content,
    relatedEntityId: doc.relatedEntityId?.toString?.() ?? null,
    isRead: Boolean(doc.isRead),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  };
};

const isAdminDashboardNotification = ({ type, title }) => {
  return (
    type === "ListingUpdate" ||
    (typeof title === "string" && UNBLOCK_REPORT_TITLE_PATTERN.test(title))
  );
};

const toObjectId = (value, fieldName) => {
  if (!Types.ObjectId.isValid(value)) {
    throw new CustomError(`Invalid ${fieldName}`, 400);
  }

  return new Types.ObjectId(value);
};

// CREATE NOTIFICATION
export const createNotification = async ({
  userId,
  type,
  title,
  content,
  relatedEntityId = null
}) => {
  const normalizedUserId = toObjectId(userId, "user id");
  const normalizedRelatedEntityId = relatedEntityId
    ? toObjectId(relatedEntityId, "related entity id")
    : null;

  const notification = await Notification.create({
    userId: normalizedUserId,
    type,
    title,
    content,
    relatedEntityId: normalizedRelatedEntityId
  });

  const payload = toNotificationPayload(notification);

  emitToUser(String(userId), "notification:receive", payload);

  if (isAdminDashboardNotification({ type, title })) {
    void emitAdminNotificationCounts(userId).catch((error) => {
      logger.warn({ error, userId }, "Failed to emit admin notification counts");
    });
  }

  return notification;
};

export const getAdminNotificationCountsForUser = async (userId) => {
  const normalizedUserId = toObjectId(userId, "user id");

  const [propertyNotifications, reportNotifications] = await Promise.all([
    Notification.countDocuments({
      userId: normalizedUserId,
      type: "ListingUpdate",
      isRead: false
    }),
    Notification.countDocuments({
      userId: normalizedUserId,
      title: { $regex: UNBLOCK_REPORT_TITLE_PATTERN },
      isRead: false
    })
  ]);

  return {
    propertyNotifications,
    reportNotifications
  };
};

export const emitAdminNotificationCounts = async (userId) => {
  const counts = await getAdminNotificationCountsForUser(userId);
  emitToUser(String(userId), "admin:notification:counts", counts);
  return counts;
};

export const markAdminReportNotificationsAsRead = async (userId) => {
  const normalizedUserId = toObjectId(userId, "user id");

  const result = await Notification.updateMany(
    {
      userId: normalizedUserId,
      title: { $regex: UNBLOCK_REPORT_TITLE_PATTERN },
      isRead: false
    },
    { $set: { isRead: true } }
  );

  return { updatedCount: result.modifiedCount ?? 0 };
};

export const markAdminPropertyNotificationsAsRead = async (userId) => {
  const normalizedUserId = toObjectId(userId, "user id");

  const result = await Notification.updateMany(
    {
      userId: normalizedUserId,
      type: "ListingUpdate",
      isRead: false
    },
    { $set: { isRead: true } }
  );

  return { updatedCount: result.modifiedCount ?? 0 };
};

// GET USER NOTIFICATIONS
export const getNotifications = async ({ userId, limit = 20, cursor }) => {
  const normalizedUserId = toObjectId(userId, "user id");
  const query = { userId: normalizedUserId };

  if (cursor) {
    const cursorDate = new Date(cursor);

    if (Number.isNaN(cursorDate.getTime())) {
      throw new CustomError("Invalid cursor", 400);
    }

    query.createdAt = { $lt: cursorDate };
  }

  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .limit(limit);

  return notifications;
};

// GET UNREAD MESSAGE COUNTS
export const getUnreadMessageCounts = async (userId) => {
  const normalizedUserId = toObjectId(userId, "user id");

  const unreadNotifications = await Notification.find({
    userId: normalizedUserId,
    type: "Message",
    isRead: false
  })
    .select("relatedEntityId")
    .lean();

  if (!unreadNotifications.length) {
    return { total: 0, byConversation: {} };
  }

  const relatedMessageIds = unreadNotifications
    .map((notification) => notification.relatedEntityId)
    .filter(Boolean);

  if (!relatedMessageIds.length) {
    return { total: unreadNotifications.length, byConversation: {} };
  }

  const messages = await Message.find({
    _id: { $in: relatedMessageIds }
  })
    .select("conversationId")
    .lean();

  const conversationIdByMessageId = new Map(
    messages.map((message) => [
      message._id.toString(),
      message.conversationId.toString()
    ])
  );

  const byConversation = unreadNotifications.reduce(
    (accumulator, notification) => {
      const relatedEntityId = notification.relatedEntityId?.toString();
      const conversationId = relatedEntityId
        ? conversationIdByMessageId.get(relatedEntityId)
        : null;

      if (!conversationId) {
        return accumulator;
      }

      accumulator[conversationId] = (accumulator[conversationId] || 0) + 1;
      return accumulator;
    },
    {}
  );

  return {
    total: unreadNotifications.length,
    byConversation
  };
};

// MARK ONE AS READ
export const markAsRead = async (notificationId, userId) => {
  const normalizedNotificationId = toObjectId(
    notificationId,
    "notification id"
  );
  const normalizedUserId = toObjectId(userId, "user id");

  const notification = await Notification.findOneAndUpdate(
    { _id: normalizedNotificationId, userId: normalizedUserId },
    { isRead: true },
    { new: true }
  );

  if (!notification) {
    throw new CustomError("Notification not found", 404);
  }

  return notification;
};

// MARK ALL AS READ
export const markAllAsRead = async (userId) => {
  const normalizedUserId = toObjectId(userId, "user id");

  return Notification.updateMany(
    { userId: normalizedUserId, isRead: false },
    { $set: { isRead: true } }
  );
};

// MARK CONVERSATION MESSAGE NOTIFICATIONS AS READ
export const markConversationAsRead = async (conversationId, userId) => {
  const normalizedConversationId = toObjectId(
    conversationId,
    "conversation id"
  );
  const normalizedUserId = toObjectId(userId, "user id");

  const unreadNotifications = await Notification.find({
    userId: normalizedUserId,
    type: "Message",
    isRead: false,
    relatedEntityId: { $ne: null }
  })
    .select("relatedEntityId")
    .lean();

  if (!unreadNotifications.length) {
    return { updatedCount: 0 };
  }

  const relatedMessageIds = unreadNotifications.map(
    (notification) => notification.relatedEntityId
  );

  const messages = await Message.find({
    _id: { $in: relatedMessageIds },
    conversationId: normalizedConversationId
  })
    .select("_id")
    .lean();

  const messageIdSet = new Set(
    messages.map((message) => message._id.toString())
  );
  const notificationIds = unreadNotifications
    .filter((notification) =>
      messageIdSet.has(notification.relatedEntityId.toString())
    )
    .map((notification) => notification._id);

  if (!notificationIds.length) {
    return { updatedCount: 0 };
  }

  await Promise.all(
    notificationIds.map((notificationId) =>
      markAsRead(notificationId.toString(), userId)
    )
  );

  return { updatedCount: notificationIds.length };
};

// MARK RENTAL NOTIFICATIONS AS READ
export const markRentalNotificationsAsRead = async (userId) => {
  const normalizedUserId = toObjectId(userId, "user id");

  const result = await Notification.updateMany(
    {
      userId: normalizedUserId,
      type: { $in: ["Payment", "ListingUpdate"] },
      isRead: false
    },
    { $set: { isRead: true } }
  );

  return { updatedCount: result.modifiedCount ?? 0 };
};
