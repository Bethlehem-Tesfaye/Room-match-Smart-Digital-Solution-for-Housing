import { createMessage, getMessages } from "./message.service.js";

export const sendMessage = async (req, res, next) => {
  try {
    const senderId = req.userId;
    const { conversationId, content, messageType } = req.body;

    const message = await createMessage({
      conversationId,
      senderId,
      content,
      messageType
    });

    return res.status(201).json({ message });
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
