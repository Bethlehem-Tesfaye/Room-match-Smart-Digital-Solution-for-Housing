import { Router } from "express";
import {
  fetchNotifications,
  readNotification,
  readAllNotifications
} from "./notification.controller.js";
import authMiddleware from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.js";
import {
  notificationParamsSchema,
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
