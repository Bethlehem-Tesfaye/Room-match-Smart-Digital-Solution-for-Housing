import mongoose from "mongoose";
import CustomError from "../../lib/errors.js";
import { User } from "../auth/schema.js";
import { Conversation, ConversationParticipant } from "./schema.js";

const { Types } = mongoose;

const toObjectId = (value, fieldName) => {
  if (!Types.ObjectId.isValid(value)) {
    throw new CustomError(`Invalid ${fieldName}`, 400);
  }

  return new Types.ObjectId(value);
};

const buildParticipantsKey = (userAId, userBId) => {
  return [userAId.toString(), userBId.toString()].sort().join(":");
};

export const getOrCreateConversation = async ({
  userA,
  userB,
  propertyId = null,
  isRoommateChat = false
}) => {
  const userAId = toObjectId(userA, "user id");
  const userBId = toObjectId(userB, "recipient user id");

  if (userAId.equals(userBId)) {
    throw new CustomError("You cannot start a conversation with yourself", 400);
  }

  const recipientExists = await User.exists({ _id: userBId });
  if (!recipientExists) {
    throw new CustomError("Recipient user not found", 404);
  }

  const normalizedPropertyId = propertyId
    ? toObjectId(propertyId, "property id")
    : null;

  const participantsKey = buildParticipantsKey(userAId, userBId);

  const byParticipantsKey = await Conversation.findOne({
    participantsKey
  }).lean();

  if (byParticipantsKey) {
    return byParticipantsKey;
  }

  const legacyConversation = await ConversationParticipant.aggregate([
    {
      $match: {
        userId: { $in: [userAId, userBId] }
      }
    },
    {
      $group: {
        _id: "$conversationId",
        users: { $addToSet: "$userId" }
      }
    },
    {
      $match: {
        users: { $all: [userAId, userBId] }
      }
    },
    {
      $lookup: {
        from: "conversations",
        localField: "_id",
        foreignField: "_id",
        as: "conversation"
      }
    },
    {
      $unwind: "$conversation"
    },
    {
      $limit: 1
    }
  ]);

  if (legacyConversation.length > 0) {
    await Conversation.updateOne(
      { _id: legacyConversation[0].conversation._id },
      { $set: { participantsKey } }
    );

    return {
      ...legacyConversation[0].conversation,
      participantsKey
    };
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const [conversation] = await Conversation.create(
      [
        {
          participantsKey,
          propertyId: normalizedPropertyId,
          isRoommateChat
        }
      ],
      { session }
    );

    await ConversationParticipant.insertMany(
      [
        { conversationId: conversation._id, userId: userAId },
        { conversationId: conversation._id, userId: userBId }
      ],
      { session }
    );

    await session.commitTransaction();

    return conversation;
  } catch (error) {
    await session.abortTransaction();

    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === 11000
    ) {
      const existingConversation = await Conversation.findOne({
        participantsKey
      }).lean();

      if (existingConversation) {
        return existingConversation;
      }
    }

    throw error;
  } finally {
    session.endSession();
  }
};

// Get all conversations for a user (Inbox)

export const getUserConversations = async (userId) => {
  const normalizedUserId = toObjectId(userId, "user id");

  const conversations = await ConversationParticipant.aggregate([
    {
      $match: { userId: normalizedUserId }
    },
    {
      $lookup: {
        from: "conversations",
        localField: "conversationId",
        foreignField: "_id",
        as: "conversation"
      }
    },
    {
      $unwind: "$conversation"
    },
    {
      $sort: { "conversation.lastMessageAt": -1 }
    }
  ]);

  return conversations;
};

// Get participants of a conversation

export const getConversationParticipants = async ({
  conversationId,
  requesterUserId
}) => {
  const normalizedConversationId = toObjectId(
    conversationId,
    "conversation id"
  );
  const normalizedRequesterId = toObjectId(requesterUserId, "user id");

  const isParticipant = await ConversationParticipant.exists({
    conversationId: normalizedConversationId,
    userId: normalizedRequesterId
  });

  if (!isParticipant) {
    throw new CustomError(
      "You are not allowed to access this conversation",
      403
    );
  }

  return ConversationParticipant.find({
    conversationId: normalizedConversationId
  }).populate({
    path: "userId",
    select: "_id name email image"
  });
};

export const getConversationReceiver = async ({ conversationId, senderId }) => {
  const normalizedConversationId = toObjectId(
    conversationId,
    "conversation id"
  );
  const normalizedSenderId = toObjectId(senderId, "sender id");

  const participants = await ConversationParticipant.find({
    conversationId: normalizedConversationId
  })
    .select({ userId: 1 })
    .lean();

  if (!participants.length) {
    throw new CustomError("Conversation not found", 404);
  }

  const senderIsParticipant = participants.some((participant) =>
    participant.userId.equals(normalizedSenderId)
  );

  if (!senderIsParticipant) {
    throw new CustomError(
      "You are not allowed to access this conversation",
      403
    );
  }

  const receiverParticipant = participants.find(
    (participant) => !participant.userId.equals(normalizedSenderId)
  );

  if (!receiverParticipant) {
    throw new CustomError("Conversation participant not found", 404);
  }

  return {
    conversationId: normalizedConversationId.toString(),
    receiverId: receiverParticipant.userId.toString()
  };
};
