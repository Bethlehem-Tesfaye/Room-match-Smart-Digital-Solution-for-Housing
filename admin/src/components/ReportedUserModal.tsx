import { useEffect, useState } from "react";
import { X } from "lucide-react";
import {
  getAdminUserScamReportSummary,
  setUserBlockedStatus,
  type AdminUserScamSummary,
} from "../lib/api";
import { adminPalette } from "../theme/palette";

type ReportedUserModalProps = {
  userId: string | null;
  userName?: string;
  onClose: () => void;
  onBlocked?: () => void;
};

function ReportedUserModal({
  userId,
  userName,
  onClose,
  onBlocked,
}: ReportedUserModalProps) {
  const [summary, setSummary] = useState<AdminUserScamSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!userId) {
      setSummary(null);
      return;
    }

    setLoading(true);
    setError(null);
    void getAdminUserScamReportSummary(userId)
      .then((data) => setSummary(data))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Unable to load user."),
      )
      .finally(() => setLoading(false));
  }, [userId]);

  if (!userId) return null;

  const isBlocked = summary?.status === "Blocked";
  const displayName = summary?.user?.name || userName || "User";

  const handleBlockToggle = async () => {
    setSubmitting(true);
    setError(null);

    try {
      await setUserBlockedStatus(userId, !isBlocked, reason.trim() || undefined);
      onBlocked?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update user.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center px-4"
      style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border p-5 shadow-xl"
        style={{
          backgroundColor: "#fff",
          borderColor: adminPalette.border,
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold" style={{ color: adminPalette.deep }}>
              {displayName}
            </h2>
            <p className="text-sm" style={{ color: adminPalette.muted }}>
              {summary?.user?.email || userId}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border"
            style={{ borderColor: adminPalette.border }}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {loading ? (
          <p className="text-sm" style={{ color: adminPalette.muted }}>
            Loading report history…
          </p>
        ) : summary ? (
          <dl className="mb-4 grid grid-cols-3 gap-3 rounded-xl border p-3 text-center text-sm">
            <div>
              <dt style={{ color: adminPalette.muted }}>Listing</dt>
              <dd className="text-xl font-bold" style={{ color: adminPalette.deep }}>
                {summary.listingReports}
              </dd>
            </div>
            <div>
              <dt style={{ color: adminPalette.muted }}>Messaging</dt>
              <dd className="text-xl font-bold" style={{ color: adminPalette.deep }}>
                {summary.userReports}
              </dd>
            </div>
            <div>
              <dt style={{ color: adminPalette.muted }}>Total</dt>
              <dd className="text-xl font-bold" style={{ color: adminPalette.accent }}>
                {summary.totalReports}
              </dd>
            </div>
          </dl>
        ) : null}

        {!isBlocked && (
          <label className="mb-4 block">
            <span
              className="mb-1 block text-xs font-semibold uppercase tracking-wider"
              style={{ color: adminPalette.muted }}
            >
              Block reason (optional)
            </span>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
              style={{ borderColor: adminPalette.border }}
              placeholder="Why is this account being blocked?"
            />
          </label>
        )}

        {error && (
          <p
            className="mb-3 rounded-lg border px-3 py-2 text-sm"
            style={{
              borderColor: "#fecaca",
              backgroundColor: "#fef2f2",
              color: adminPalette.accent,
            }}
          >
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border px-4 py-2 text-sm font-medium"
            style={{ borderColor: adminPalette.border, color: adminPalette.deep }}
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => void handleBlockToggle()}
            disabled={submitting || loading}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            style={{ backgroundColor: adminPalette.accent }}
          >
            {submitting
              ? "Saving…"
              : isBlocked
                ? "Unblock user"
                : "Block user"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReportedUserModal;
