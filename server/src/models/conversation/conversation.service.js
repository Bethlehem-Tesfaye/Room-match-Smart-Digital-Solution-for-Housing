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

  const existingConversation = await ConversationParticipant.aggregate([
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
      $match: {
        "conversation.propertyId": normalizedPropertyId,
        "conversation.isRoommateChat": isRoommateChat
      }
    },
    {
      $limit: 1
    }
  ]);

  if (existingConversation.length > 0) {
    return existingConversation[0].conversation;
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const [conversation] = await Conversation.create(
      [
        {
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
    throw error;
  } finally {
    session.endSession();
  }
};

//Get all conversations for a user (Inbox)

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
