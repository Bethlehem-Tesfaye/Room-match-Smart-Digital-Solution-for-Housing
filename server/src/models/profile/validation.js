import { z } from "zod";

const imageBase64Schema = z
  .string()
  .trim()
  .refine(
    (value) =>
      value.startsWith("data:image/") || /^[A-Za-z0-9+/=\r\n]+$/.test(value),
    "imageBase64 must be a valid base64 image string"
  );

export const updateProfileSchema = z
  .object({
    fullName: z.string().trim().max(200).optional(),
    phoneNumber: z
      .union([z.string().trim().max(50), z.literal(""), z.null()])
      .optional(),
    imageBase64: imageBase64Schema.optional(),
    removeProfilePicture: z.boolean().optional()
  })
  .refine(
    (payload) =>
      payload.fullName !== undefined ||
      payload.phoneNumber !== undefined ||
      payload.imageBase64 !== undefined ||
      payload.removeProfilePicture === true,
    "At least one profile field must be provided"
  );
