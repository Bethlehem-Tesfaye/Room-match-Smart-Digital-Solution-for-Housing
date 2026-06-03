import { z } from "zod";

export const REPORT_REASONS = [
  "scam_or_fraud",
  "spam",
  "misleading_listing",
  "inappropriate_content",
  "harassment",
  "impersonation",
  "other"
];

export const submitReportSchema = z.object({
  reason: z.enum(REPORT_REASONS),
  description: z.string().trim().max(4000).optional()
});

export const blockUserParamsSchema = z.object({
  userId: z.string().trim().min(1)
});
