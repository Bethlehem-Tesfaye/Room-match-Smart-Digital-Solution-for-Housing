export const REPORT_REASONS = [
  { value: "scam_or_fraud", label: "Scam or fraud" },
  { value: "spam", label: "Spam" },
  { value: "misleading_listing", label: "Misleading listing" },
  { value: "inappropriate_content", label: "Inappropriate content" },
  { value: "harassment", label: "Harassment" },
  { value: "impersonation", label: "Impersonation" },
  { value: "other", label: "Other" },
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number]["value"];
