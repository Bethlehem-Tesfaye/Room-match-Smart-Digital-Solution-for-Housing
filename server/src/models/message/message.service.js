import mongoose from "mongoose";
import CustomError from "../../lib/errors.js";
import {
  Conversation,
  ConversationParticipant
} from "../conversation/schema.js";
import { Message } from "./schema.js";

const { Types } = mongoose;

const toObjectId = (value, fieldName) => {
  if (!Types.ObjectId.isValid(value)) {
    throw new CustomError(`Invalid ${fieldName}`, 400);
  }

  return new Types.ObjectId(value);
};

const ensureConversationParticipant = async ({ conversationId, userId }) => {
  const isParticipant = await ConversationParticipant.exists({
    conversationId,
    userId
  });

  if (!isParticipant) {
    throw new CustomError(
      "You are not allowed to access this conversation",
      403
    );
  }
};

// CREATE MESSAGE
export const createMessage = async ({
  conversationId,
  senderId,
  content,
  messageType = "Text"
}) => {
  const normalizedConversationId = toObjectId(
    conversationId,
    "conversation id"
  );
  const normalizedSenderId = toObjectId(senderId, "sender id");

  const conversation = await Conversation.findById(
    normalizedConversationId
  ).lean();
  if (!conversation) {
    throw new CustomError("Conversation not found", 404);
  }

  await ensureConversationParticipant({
    conversationId: normalizedConversationId,
    userId: normalizedSenderId
  });

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const message = await Message.create(
      [
        {
          conversationId: normalizedConversationId,
          senderId: normalizedSenderId,
          content,
          messageType
        }
      ],
      { session }
    );

    // Update conversation metadata

    await Conversation.findByIdAndUpdate(
      normalizedConversationId,
      {
        lastMessageAt: new Date()
      },
      { session }
    );

    await session.commitTransaction();

    return message[0];
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// GET MESSAGES (PAGINATION)
export const getMessages = async ({
  conversationId,
  requesterUserId,
  cursor,
  limit = 20
}) => {
  const normalizedConversationId = toObjectId(
    conversationId,
    "conversation id"
  );
  const normalizedRequesterId = toObjectId(requesterUserId, "user id");

  const conversation = await Conversation.findById(
    normalizedConversationId
  ).lean();
  if (!conversation) {
    throw new CustomError("Conversation not found", 404);
  }

  await ensureConversationParticipant({
    conversationId: normalizedConversationId,
    userId: normalizedRequesterId
  });

  const query = { conversationId: normalizedConversationId };

  // cursor = last message timestamp
  if (cursor) {
    const cursorDate = new Date(cursor);

    if (Number.isNaN(cursorDate.getTime())) {
      throw new CustomError("Invalid cursor", 400);
    }

    query.createdAt = { $lt: cursorDate };
  }

  const messages = await Message.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("senderId", "name email");

  return messages.reverse(); // chronological order for UI
};
