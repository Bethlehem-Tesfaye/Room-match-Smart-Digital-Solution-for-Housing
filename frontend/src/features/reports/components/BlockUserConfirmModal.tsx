import { UserX, X } from "lucide-react";

type BlockUserConfirmModalProps = {
  isOpen: boolean;
  userName: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isSubmitting?: boolean;
};

function BlockUserConfirmModal({
  isOpen,
  userName,
  onClose,
  onConfirm,
  isSubmitting = false,
}: BlockUserConfirmModalProps) {
  if (!isOpen) return null;

  const handleConfirm = async () => {
    try {
      await onConfirm();
      onClose();
    } catch {
      // Keep modal open when block fails.
    }
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
          <div className="flex items-start gap-3">
            <span
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: "#fef2f2", color: "#dc2626" }}
            >
              <UserX size={18} />
            </span>
            <div>
              <h2
                className="text-lg font-semibold"
                style={{ color: "var(--palette-deep)" }}
              >
                Block {userName}?
              </h2>
              <p className="mt-1 text-sm" style={{ color: "var(--palette-muted)" }}>
                You will not be able to message each other until you unblock
                them from Settings or this conversation.
              </p>
            </div>
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

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl border px-4 py-2 text-sm font-medium disabled:opacity-50"
            style={{
              borderColor: "var(--palette-border)",
              color: "var(--palette-deep)",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={isSubmitting}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            style={{ backgroundColor: "#dc2626" }}
          >
            {isSubmitting ? "Blocking…" : "Block user"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default BlockUserConfirmModal;
