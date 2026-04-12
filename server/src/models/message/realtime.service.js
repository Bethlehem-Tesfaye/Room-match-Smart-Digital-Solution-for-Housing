import mongoose from "mongoose";
import CustomError from "../../lib/errors.js";
import { Property } from "../property/schema.js";
import * as conversationService from "../conversation/conversation.service.js";
import * as messageService from "./message.service.js";
import * as notificationService from "../notification/notification.service.js";

const { Types } = mongoose;

const toObjectId = (value, fieldName) => {
  if (!Types.ObjectId.isValid(value)) {
    throw new CustomError(`Invalid ${fieldName}`, 400);
  }

  return new Types.ObjectId(value);
};

const normalizeMessageType = (messageType) => {
  const allowedMessageTypes = new Set(["Text", "Image", "Document"]);
  const normalized = messageType || "Text";

  if (!allowedMessageTypes.has(normalized)) {
    throw new CustomError("Invalid message type", 400);
  }

  return normalized;
};

const resolveReceiverId = async ({ senderId, receiverId, propertyId }) => {
  if (receiverId) {
    return receiverId;
  }

  if (!propertyId) {
    throw new CustomError("receiverId or propertyId is required", 400);
  }

  const normalizedPropertyId = toObjectId(propertyId, "property id");

  const property = await Property.findOne({
    _id: normalizedPropertyId,
    deletedAt: null
  })
    .select({ ownerId: 1 })
    .lean();

  if (!property?.ownerId) {
    throw new CustomError("Property not found", 404);
  }

  if (property.ownerId === senderId) {
    throw new CustomError("You cannot message yourself", 400);
  }

  return property.ownerId;
};

export const sendRealtimeMessage = async ({
  senderId,
  receiverId,
  propertyId,
  conversationId,
  content,
  messageType
}) => {
  if (!senderId) {
    throw new CustomError("Unauthorized sender", 401);
  }

  const normalizedContent = typeof content === "string" ? content.trim() : "";

  if (!normalizedContent) {
    throw new CustomError("Message content is required", 400);
  }

  const normalizedMessageType = normalizeMessageType(messageType);

  let resolvedConversationId = conversationId;
  let resolvedReceiverId = receiverId;

  if (resolvedConversationId) {
    const conversationData = await conversationService.getConversationReceiver({
      conversationId: resolvedConversationId,
      senderId
    });

    resolvedConversationId = conversationData.conversationId;
    resolvedReceiverId = conversationData.receiverId;
  } else {
    resolvedReceiverId = await resolveReceiverId({
      senderId,
      receiverId,
      propertyId
    });

    const conversation = await conversationService.getOrCreateConversation({
      userA: senderId,
      userB: resolvedReceiverId,
      propertyId
    });

    resolvedConversationId = conversation._id.toString();
  }

  const message = await messageService.createMessage({
    conversationId: resolvedConversationId,
    senderId,
    content: normalizedContent,
    messageType: normalizedMessageType
  });

  const notification = await notificationService.createNotification({
    userId: resolvedReceiverId,
    type: "Message",
    title: "New message",
    content:
      normalizedMessageType === "Text"
        ? normalizedContent
        : "You received a new message",
    relatedEntityId: message._id
  });

  return {
    conversationId: resolvedConversationId,
    receiverId: resolvedReceiverId,
    message,
    notification
  };
};
