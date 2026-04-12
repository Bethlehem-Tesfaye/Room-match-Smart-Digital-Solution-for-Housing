import { emitToUser } from "../../config/socket.js";
import { getMessages } from "./message.service.js";
import { sendRealtimeMessage } from "./realtime.service.js";

export const sendMessage = async (req, res, next) => {
  try {
    const senderId = req.userId;
    const { conversationId, content, messageType } = req.body;

    const result = await sendRealtimeMessage({
      senderId,
      conversationId,
      content,
      messageType
    });

    const receiverOnline = emitToUser(
      result.receiverId,
      "message:receive",
      result.message
    );

    if (receiverOnline) {
      emitToUser(
        result.receiverId,
        "notification:receive",
        result.notification
      );
    }

    emitToUser(senderId, "message:receive", result.message);

    return res.status(201).json({
      message: result.message,
      conversationId: result.conversationId,
      receiverOnline
    });
  } catch (err) {
    return next(err);
  }
};

//GET /messages/:conversationId
export const fetchMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { cursor, limit } = req.query;

    const messages = await getMessages({
      conversationId,
      requesterUserId: req.userId,
      cursor,
      limit: Number(limit) || 20
    });

    return res.status(200).json({ messages });
  } catch (err) {
    return next(err);
  }
};
