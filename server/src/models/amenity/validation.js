import { z } from "zod";

export const listAmenitiesQuerySchema = z.object({
  category: z.string().trim().min(1).optional()
});
