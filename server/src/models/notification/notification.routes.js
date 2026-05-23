import { Router } from "express";
import {
  fetchNotifications,
  readNotification,
  readAllNotifications,
  fetchUnreadMessageCounts,
  readNotificationsByConversation,
  readRentalNotifications
} from "./notification.controller.js";
import authMiddleware from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.js";
import {
  notificationParamsSchema,
  notificationConversationParamsSchema,
  notificationsQuerySchema
} from "./validation.js";

const notificationRouter = Router();

// Get notifications

notificationRouter.get(
  "/",
  authMiddleware,
  validate(notificationsQuerySchema, "query"),
  fetchNotifications
);

// Get unread message counts
notificationRouter.get(
  "/unread-counts",
  authMiddleware,
  fetchUnreadMessageCounts
);

// Mark unread message notifications for a conversation as read
notificationRouter.patch(
  "/read-by-conversation/:conversationId",
  authMiddleware,
  validate(notificationConversationParamsSchema, "params"),
  readNotificationsByConversation
);

notificationRouter.patch(
  "/read-rentals",
  authMiddleware,
  readRentalNotifications
);

// Mark single notification as read
notificationRouter.patch(
  "/:id/read",
  authMiddleware,
  validate(notificationParamsSchema, "params"),
  readNotification
);

// Mark all as read
notificationRouter.patch("/read-all", authMiddleware, readAllNotifications);

export default notificationRouter;
