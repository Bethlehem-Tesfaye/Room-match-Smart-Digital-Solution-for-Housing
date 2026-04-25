import { z } from "zod";

export const initiateConversationSchema = z.object({
  userId: z.string().trim().min(1, "Recipient user id is required"),
  listingId: z.string().trim().min(1, "Listing id cannot be empty").optional(),
  propertyId: z
    .string()
    .trim()
    .min(1, "Property id cannot be empty")
    .optional(),
  isRoommateChat: z.boolean().optional().default(false)
});

export const conversationParamsSchema = z.object({
  id: z.string().trim().min(1, "Conversation id is required")
});
