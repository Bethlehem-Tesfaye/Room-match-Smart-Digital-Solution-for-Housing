import { z } from "zod";

export const createRentRequestSchema = z.object({
  conversationId: z.string().trim().min(1, "Conversation id is required")
});

export const conversationRentRequestParamsSchema = z.object({
  conversationId: z.string().trim().min(1, "Conversation id is required")
});

export const contractParamsSchema = z.object({
  id: z.string().trim().min(1, "Contract id is required")
});
