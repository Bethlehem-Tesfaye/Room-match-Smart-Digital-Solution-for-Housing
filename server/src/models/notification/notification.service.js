import mongoose from "mongoose";
import CustomError from "../../lib/errors.js";
import { Notification } from "./schema.js";

const { Types } = mongoose;

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

  return notification;
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
