import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { UserRow } from "./UserTable";
import { adminPalette } from "../theme/palette";

const BlockUserModal: React.FC<{
  user?: UserRow | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => void;
}> = ({ user, open, onClose, onConfirm }) => {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (open) {
      setReason("");
    }
  }, [open, user?.id]);

  if (!open || !user) return null;
  const isBlocked = user.status === "Blocked";

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border shadow-xl"
        style={{
          borderColor: adminPalette.border,
          backgroundColor: adminPalette.cardBg,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between border-b px-5 py-4"
          style={{ borderColor: adminPalette.border }}
        >
          <h3 className="text-lg font-semibold" style={{ color: adminPalette.deep }}>
            {isBlocked ? "Unblock user" : "Block user"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border transition-colors hover:bg-[#f8fafc]"
            style={{ borderColor: adminPalette.border, color: adminPalette.muted }}
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-4">
          <div className="mb-4 flex items-center gap-3">
            <span
              className="inline-flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold text-white"
              style={{ backgroundColor: adminPalette.deep }}
            >
              {user.name?.[0]?.toUpperCase()}
            </span>
            <div>
              <p className="font-semibold" style={{ color: adminPalette.deep }}>
                {user.name}
              </p>
              <p className="text-sm" style={{ color: adminPalette.muted }}>
                {user.email}
              </p>
            </div>
          </div>

          <label className="mb-1.5 block text-sm font-medium" style={{ color: adminPalette.deep }}>
            Reason (optional)
          </label>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={
              isBlocked
                ? "Why are you unblocking this user?"
                : "Why are you blocking this user?"
            }
            className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-200"
            style={{
              borderColor: adminPalette.border,
              backgroundColor: adminPalette.inputBg,
              color: adminPalette.deep,
            }}
          />
          <p className="mt-2 text-xs" style={{ color: adminPalette.muted }}>
            {isBlocked
              ? "Unblocked users regain access immediately."
              : "Blocked users cannot access the platform until unblocked."}
          </p>
        </div>

        <div
          className="flex justify-end gap-2 border-t px-5 py-4"
          style={{ borderColor: adminPalette.border }}
        >
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border px-4 py-2 text-sm font-semibold transition-colors hover:bg-[#f8fafc]"
            style={{ borderColor: adminPalette.border, color: adminPalette.deep }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(reason)}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: adminPalette.accent }}
          >
            {isBlocked ? "Unblock user" : "Block user"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BlockUserModal;
