import { AlertTriangle, Building2, X } from "lucide-react";
import type { AdminPropertyRow } from "../lib/api";
import { adminPalette } from "../theme/palette";
import { PropertyStatusChip } from "./ui/Chips";

const DeletePropertyModal: React.FC<{
  property?: AdminPropertyRow | null;
  open: boolean;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}> = ({ property, open, loading, onClose, onConfirm }) => {
  if (!open || !property) return null;

  return (
    <div
      className="fixed inset-0 z-1000 flex items-center justify-center bg-black/50 p-4"
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
            Delete listing
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border transition-colors hover:bg-[#f8fafc] disabled:opacity-50"
            style={{ borderColor: adminPalette.border, color: adminPalette.muted }}
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-4">
          <div
            className="mb-4 flex gap-3 rounded-xl border px-4 py-3"
            style={{
              borderColor: "#fecaca",
              backgroundColor: "#fef2f2",
            }}
          >
            <AlertTriangle
              size={20}
              className="mt-0.5 shrink-0"
              style={{ color: adminPalette.accent }}
            />
            <p className="text-sm" style={{ color: adminPalette.deep }}>
              Permanently delete{" "}
              <span className="font-semibold">{property.title}</span>? This cannot be
              undone.
            </p>
          </div>

          <div className="flex items-start gap-3">
            <span
              className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white"
              style={{ backgroundColor: adminPalette.deep }}
            >
              <Building2 size={20} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold" style={{ color: adminPalette.deep }}>
                {property.title}
              </p>
              <p className="mt-0.5 text-sm" style={{ color: adminPalette.muted }}>
                {property.ownerName || "Unknown"} · {property.ownerEmail || "—"}
              </p>
              {property.place ? (
                <p className="mt-0.5 text-sm" style={{ color: adminPalette.muted }}>
                  {property.place}
                </p>
              ) : null}
              <div className="mt-2">
                <PropertyStatusChip status={property.status} />
              </div>
            </div>
          </div>
        </div>

        <div
          className="flex justify-end gap-2 border-t px-5 py-4"
          style={{ borderColor: adminPalette.border }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl border px-4 py-2 text-sm font-semibold transition-colors hover:bg-[#f8fafc] disabled:opacity-50"
            style={{ borderColor: adminPalette.border, color: adminPalette.deep }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ backgroundColor: adminPalette.accent }}
          >
            {loading ? "Deleting…" : "Delete permanently"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeletePropertyModal;
