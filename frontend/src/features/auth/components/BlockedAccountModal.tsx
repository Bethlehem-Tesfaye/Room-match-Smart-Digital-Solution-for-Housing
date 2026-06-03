import { useState } from "react";
import { ShieldBan } from "lucide-react";
import Logo from "../../../components/logo";
import { useLogout } from "../hooks/useLogout";
import { useRequestUnblock } from "../../profile/hooks/useProfileHooks";
import { palette } from "../../../theme/palette";

type BlockedAccountModalProps = {
  message: string;
  blockedReason?: string | null;
};

function BlockedAccountModal({
  message,
  blockedReason,
}: BlockedAccountModalProps) {
  const [requestReason, setRequestReason] = useState("");
  const unblockMutation = useRequestUnblock();
  const logoutMutation = useLogout();

  const displayMessage =
    message.trim() ||
    "Your account has been blocked. Contact support for help.";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(15, 23, 42, 0.45)" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="blocked-account-title"
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl border shadow-xl"
        style={{
          borderColor: palette.border,
          backgroundColor: palette.cardBg,
          boxShadow: "0 12px 40px rgba(46, 31, 74, 0.18)",
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className="border-b px-5 py-3"
          style={{
            borderColor: palette.border,
            backgroundColor: palette.cardMutedBg,
          }}
        >
          <p
            className="font-mono text-[10px] uppercase tracking-widest"
            style={{ color: palette.softPurple }}
          >
            Account · Restricted
          </p>
        </div>

        <div className="p-6">
          <div className="mb-5 flex justify-center">
            <Logo className="flex-row gap-2.5" />
          </div>

          <div
            className="mb-5 flex gap-3 rounded-xl border px-4 py-3"
            style={{
              borderColor: "#fecaca",
              backgroundColor: "#fef2f2",
            }}
          >
            <ShieldBan
              size={22}
              className="mt-0.5 shrink-0"
              style={{ color: "#dc2626" }}
            />
            <div>
              <h2
                id="blocked-account-title"
                className="text-lg font-bold"
                style={{ color: "var(--palette-deep)" }}
              >
                Account blocked
              </h2>
              <p
                className="mt-1 text-sm leading-relaxed"
                style={{ color: "var(--palette-deep)" }}
              >
                {displayMessage}
              </p>
              {blockedReason ? (
                <p
                  className="mt-2 text-xs leading-relaxed"
                  style={{ color: palette.softPurple }}
                >
                  Admin note: {blockedReason}
                </p>
              ) : null}
            </div>
          </div>

          <p
            className="mb-4 text-sm leading-relaxed"
            style={{ color: palette.softPurple }}
          >
            If you believe this block was applied in error, submit a request
            below and our admin team will review it.
          </p>

          <label
            className="mb-1.5 block text-sm font-medium"
            style={{ color: "var(--palette-deep)" }}
          >
            Request unblock reason (optional)
          </label>
          <textarea
            rows={4}
            className="w-full resize-none rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#e5d9f9]"
            style={{
              borderColor: palette.border,
              backgroundColor: palette.inputBg,
              color: "var(--palette-deep)",
            }}
            value={requestReason}
            onChange={(event) => setRequestReason(event.target.value)}
            placeholder="Optional note to the admin explaining why you need access restored"
          />

          {unblockMutation.isError ? (
            <div
              className="mt-3 rounded-xl border px-3 py-2.5 text-sm"
              style={{
                borderColor: "#fecaca",
                backgroundColor: "#fef2f2",
                color: "#b91c1c",
              }}
            >
              {unblockMutation.error.message}
            </div>
          ) : null}

          {unblockMutation.isSuccess ? (
            <div
              className="mt-3 rounded-xl border px-3 py-2.5 text-sm"
              style={{
                borderColor: "#bbf7d0",
                backgroundColor: "#f0fdf4",
                color: "#166534",
              }}
            >
              {unblockMutation.data?.message ??
                "Your unblock request has been submitted."}
            </div>
          ) : null}

          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              className="rounded-xl border px-4 py-2.5 text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-50"
              style={{
                borderColor: palette.border,
                color: "var(--palette-deep)",
                backgroundColor: palette.chipBg,
              }}
              onClick={() => setRequestReason("")}
              disabled={unblockMutation.isPending}
            >
              Clear note
            </button>
            <button
              type="button"
              className="rounded-xl border px-4 py-2.5 text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-50"
              style={{
                borderColor: palette.border,
                color: palette.purple,
              }}
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              {logoutMutation.isPending ? "Signing out…" : "Sign out"}
            </button>
            <button
              type="button"
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: palette.purple }}
              disabled={unblockMutation.isPending}
              onClick={() =>
                unblockMutation.mutate({
                  reason: requestReason.trim() || undefined,
                })
              }
            >
              {unblockMutation.isPending ? "Sending request…" : "Request unblock"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BlockedAccountModal;
