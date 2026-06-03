import { adminPalette } from "../../theme/palette";

export function TypeChip({ type }: { type: string }) {
  const normalized = type.toLowerCase();
  const styles =
    normalized === "admin"
      ? { bg: "#0f172a", color: "#fff" }
      : normalized === "owner"
        ? { bg: "#fee2e2", color: adminPalette.accent }
        : { bg: "#f1f5f9", color: "#475569" };

  return (
    <span
      className="inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
      style={{ backgroundColor: styles.bg, color: styles.color }}
    >
      {type}
    </span>
  );
}

export function StatusChip({ status }: { status: string }) {
  const blocked = status === "Blocked";
  return (
    <span
      className="inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
      style={{
        backgroundColor: blocked ? "#fee2e2" : "#dcfce7",
        color: blocked ? adminPalette.accent : "#166534",
      }}
    >
      {status}
    </span>
  );
}

export function PropertyStatusChip({ status }: { status?: string }) {
  const label = status || "—";
  const normalized = label.toLowerCase();
  const styles =
    normalized === "active"
      ? { bg: "#dcfce7", color: "#166534" }
      : normalized === "rented"
        ? { bg: "#fee2e2", color: adminPalette.accent }
        : normalized === "reserved"
          ? { bg: "#fef3c7", color: "#92400e" }
          : { bg: "#f1f5f9", color: "#475569" };

  return (
    <span
      className="inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
      style={{ backgroundColor: styles.bg, color: styles.color }}
    >
      {label}
    </span>
  );
}
