import { useState } from "react";
import { X } from "lucide-react";
import { REPORT_REASONS, type ReportReason } from "../constants";

type ReportModalProps = {
  isOpen: boolean;
  title: string;
  subtitle: string;
  onClose: () => void;
  onSubmit: (payload: {
    reason: ReportReason;
    description?: string;
  }) => Promise<void>;
  isSubmitting?: boolean;
};

function ReportModal({
  isOpen,
  title,
  subtitle,
  onClose,
  onSubmit,
  isSubmitting = false,
}: ReportModalProps) {
  const [reason, setReason] = useState<ReportReason>("scam_or_fraud");
  const [description, setDescription] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await onSubmit({
      reason,
      description: description.trim() || undefined,
    });
    setDescription("");
    setReason("scam_or_fraud");
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center px-4"
      style={{ backgroundColor: "rgba(46,31,74,0.45)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border p-5 shadow-xl"
        style={{
          backgroundColor: "var(--palette-card-bg)",
          borderColor: "var(--palette-border)",
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2
              className="text-lg font-semibold"
              style={{ color: "var(--palette-deep)" }}
            >
              {title}
            </h2>
            <p className="mt-1 text-sm" style={{ color: "var(--palette-muted)" }}>
              {subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border"
            style={{ borderColor: "var(--palette-border)" }}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <label className="block">
            <span
              className="mb-1.5 block text-sm font-medium"
              style={{ color: "var(--palette-deep)" }}
            >
              Reason
            </span>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as ReportReason)}
              className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none"
              style={{
                borderColor: "var(--palette-border)",
                backgroundColor: "var(--palette-page-bg)",
                color: "var(--palette-deep)",
              }}
              required
            >
              {REPORT_REASONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span
              className="mb-1.5 block text-sm font-medium"
              style={{ color: "var(--palette-deep)" }}
            >
              Details (optional)
            </span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={4000}
              placeholder="Add any extra context for our team…"
              className="w-full resize-y rounded-xl border px-3 py-2.5 text-sm outline-none"
              style={{
                borderColor: "var(--palette-border)",
                backgroundColor: "var(--palette-page-bg)",
                color: "var(--palette-deep)",
              }}
            />
          </label>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border px-4 py-2 text-sm font-medium"
              style={{
                borderColor: "var(--palette-border)",
                color: "var(--palette-deep)",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              style={{ backgroundColor: "#8b64c8" }}
            >
              {isSubmitting ? "Submitting…" : "Submit report"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ReportModal;
