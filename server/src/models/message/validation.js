import { z } from "zod";

const messageTypeEnum = z.enum(["Text", "Image", "Document"]);

export const sendMessageSchema = z.object({
  conversationId: z.string().trim().min(1, "Conversation id is required"),
  content: z.string().trim().min(1, "Message content is required").max(5000),
  messageType: messageTypeEnum.optional().default("Text")
});

export const messageParamsSchema = z.object({
  conversationId: z.string().trim().min(1, "Conversation id is required")
});

export const getMessagesQuerySchema = z.object({
  cursor: z.string().trim().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20)
});
