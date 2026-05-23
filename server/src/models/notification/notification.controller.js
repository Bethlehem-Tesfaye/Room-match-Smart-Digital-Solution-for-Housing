import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadMessageCounts,
  markConversationAsRead,
  markRentalNotificationsAsRead
} from "./notification.service.js";

// GET /notifications
export const fetchNotifications = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { cursor, limit } = req.query;

    const notifications = await getNotifications({
      userId,
      cursor,
      limit: Number(limit) || 20
    });

    return res.status(200).json({ notifications });
  } catch (err) {
    return next(err);
  }
};

// PATCH /notifications/:id/read
export const readNotification = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const notification = await markAsRead(id, userId);

    return res.status(200).json({ notification });
  } catch (err) {
    return next(err);
  }
};

// PATCH /notifications/read-all
export const readAllNotifications = async (req, res, next) => {
  try {
    const userId = req.userId;

    await markAllAsRead(userId);

    return res.status(200).json({
      message: "All notifications marked as read"
    });
  } catch (err) {
    return next(err);
  }
};

// GET /notifications/unread-counts
export const fetchUnreadMessageCounts = async (req, res, next) => {
  try {
    const userId = req.userId;

    const unreadCounts = await getUnreadMessageCounts(userId);

    return res.status(200).json(unreadCounts);
  } catch (err) {
    return next(err);
  }
};

// PATCH /notifications/read-by-conversation/:conversationId
export const readNotificationsByConversation = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { conversationId } = req.params;

    const result = await markConversationAsRead(conversationId, userId);

    return res.status(200).json({
      message: "Conversation notifications marked as read",
      ...result
    });
  } catch (err) {
    return next(err);
  }
};

// PATCH /notifications/read-rentals
export const readRentalNotifications = async (req, res, next) => {
  try {
    const userId = req.userId;

    const result = await markRentalNotificationsAsRead(userId);

    return res.status(200).json({
      message: "Rental notifications marked as read",
      ...result
    });
  } catch (err) {
    return next(err);
  }
};
