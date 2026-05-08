import mongoose from "mongoose";
import CustomError from "../../lib/errors.js";
import { User } from "../auth/schema.js";
import { Property } from "../property/schema.js";
import { Conversation, ConversationParticipant } from "./schema.js";

const { Types } = mongoose;

const toObjectId = (value, fieldName) => {
  if (!Types.ObjectId.isValid(value)) {
    throw new CustomError(`Invalid ${fieldName}`, 400);
  }

  return new Types.ObjectId(value);
};

const buildParticipantsKey = (userAId, userBId, listingId = null) => {
  const usersPart = [userAId.toString(), userBId.toString()].sort().join(":");
  const listingPart = listingId ? listingId.toString() : "no-listing";

  return `${usersPart}:${listingPart}`;
};
const buildConversationKey = ({
  userAId,
  userBId,
  scope,
  listingId = null
}) => {
  const users = [userAId.toString(), userBId.toString()].sort();

  if (scope === "ROOMMATE") {
    // IMPORTANT: roommate chats NEVER depend on listing/property
    return `roommate:${users[0]}:${users[1]}`;
  }

  if (scope === "LISTING") {
    return `listing:${listingId}:${users[0]}:${users[1]}`;
  }

  return `direct:${users[0]}:${users[1]}`;
};

export const getOrCreateConversation = async ({
  userA,
  userB,
  listingId = null,
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

  const listingOrPropertyId = listingId || propertyId;
  const normalizedListingId = listingOrPropertyId
    ? toObjectId(listingOrPropertyId, "listing id")
    : null;

  // Only verify listing ownership for non-roommate chats
  if (!isRoommateChat && normalizedListingId) {
    const listing = await Property.findOne({
      _id: normalizedListingId,
      ownerId: userBId.toString(),
      deletedAt: null
    })
      .select({ _id: 1 })
      .lean();

    if (!listing) {
      throw new CustomError("Listing not found for the provided owner", 404);
    }
  }

  const scope = isRoommateChat
    ? "ROOMMATE"
    : normalizedListingId
      ? "LISTING"
      : "DIRECT";

  const participantsKey = buildConversationKey({
    userAId,
    userBId,
    scope,
    listingId: scope === "LISTING" ? normalizedListingId : null
  });

  const existing = await Conversation.findOne({
    participantsKey
  }).lean();

  if (existing) return existing;

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
    { $unwind: "$conversation" },
    {
      // Only migrate conversations that match the isRoommateChat flag
      // AND don't already have a participantsKey (truly legacy)
      $match: {
        "conversation.isRoommateChat": isRoommateChat ? true : { $ne: true },
        "conversation.participantsKey": { $exists: false }
      }
    },
    ...(scope === "LISTING"
      ? [
          {
            $match: {
              $expr: {
                $eq: [
                  {
                    $ifNull: [
                      "$conversation.listingId",
                      "$conversation.propertyId"
                    ]
                  },
                  normalizedListingId
                ]
              }
            }
          }
        ]
      : []),
    { $limit: 1 }
  ]);

  if (legacyConversation.length > 0) {
    const conv = legacyConversation[0].conversation;

    await Conversation.updateOne(
      { _id: conv._id },
      {
        $set: {
          participantsKey,
          isRoommateChat,
          ...(scope === "LISTING"
            ? {
                listingId: normalizedListingId,
                propertyId: normalizedListingId
              }
            : {
                listingId: null,
                propertyId: null
              })
        }
      }
    );

    return {
      ...conv,
      participantsKey,
      isRoommateChat
    };
  }

  // 3. CREATE NEW
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const [conversation] = await Conversation.create(
      [
        {
          participantsKey,
          listingId: scope === "LISTING" ? normalizedListingId : null,
          propertyId: scope === "LISTING" ? normalizedListingId : null,
          isRoommateChat: scope === "ROOMMATE"
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

    if (error?.code === 11000) {
      const fallback = await Conversation.findOne({ participantsKey }).lean();
      if (fallback) return fallback;
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
      $lookup: {
        from: "property",
        let: {
          listingId: {
            $ifNull: ["$conversation.listingId", "$conversation.propertyId"]
          }
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$_id", "$$listingId"] },
                  { $eq: ["$deletedAt", null] }
                ]
              }
            }
          },
          {
            $project: {
              _id: 1,
              ownerId: 1,
              title: 1,
              city: 1,
              address: 1,
              price: 1,
              currency: 1,
              status: 1
            }
          }
        ],
        as: "listing"
      }
    },
    {
      $addFields: {
        "conversation.listingId": {
          $ifNull: ["$conversation.listingId", "$conversation.propertyId"]
        },
        "conversation.listing": { $first: "$listing" }
      }
    },
    {
      $project: {
        listing: 0
      }
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
