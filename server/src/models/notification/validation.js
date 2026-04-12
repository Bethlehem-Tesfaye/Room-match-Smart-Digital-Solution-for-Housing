import { z } from "zod";

export const notificationParamsSchema = z.object({
  id: z.string().trim().min(1, "Notification id is required")
});

export const notificationsQuerySchema = z.object({
  cursor: z.string().trim().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20)
});
