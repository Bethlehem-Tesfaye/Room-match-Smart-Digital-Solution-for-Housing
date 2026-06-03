import { z } from "zod";

export const updateProfileSchema = z
  .object({
    fullName: z.string().trim().max(200).optional(),
    phoneNumber: z
      .union([z.string().trim().max(50), z.literal(""), z.null()])
      .optional(),
    imageUrl: z.string().trim().url().optional(),
    removeProfilePicture: z.boolean().optional()
  })
  .refine(
    (payload) =>
      payload.fullName !== undefined ||
      payload.phoneNumber !== undefined ||
      payload.imageUrl !== undefined ||
      payload.removeProfilePicture === true,
    "At least one profile field must be provided"
  );

export const submitSupportSchema = z.object({
  message: z.string().trim().min(1).max(4000)
});

export const setupBankSchema = z.object({
  accountName: z.string().trim().min(1).max(200),
  accountNumber: z.string().trim().min(1).max(50),
  bankCode: z.string().trim().min(1).max(100),
  bankName: z.string().trim().min(1).max(200)
});
