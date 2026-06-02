import { z } from "zod";

export const initializePaymentSchema = z.object({
  contractId: z.string().trim().min(1, "Contract id is required")
});

export const receiptParamsSchema = z.object({
  contractId: z.string().trim().min(1, "Contract id is required")
});
