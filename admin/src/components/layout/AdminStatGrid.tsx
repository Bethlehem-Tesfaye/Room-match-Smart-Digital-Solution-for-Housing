import type { LucideIcon } from "lucide-react";
import { adminPalette } from "../../theme/palette";

export type AdminStatItem = {
  label: string;
  value: number | string;
  icon: LucideIcon;
};

type AdminStatGridProps = {
  items: AdminStatItem[];
  loading?: boolean;
};

function AdminStatGrid({ items, loading }: AdminStatGridProps) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 xl:grid-cols-5">
      {items.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="overflow-hidden rounded-2xl border"
            style={{
              borderColor: adminPalette.border,
              backgroundColor: adminPalette.cardBg,
            }}
          >
            <div
              className="flex items-center justify-between border-b px-4 py-2.5"
              style={{
                borderColor: adminPalette.border,
                backgroundColor: adminPalette.cardMutedAltBg,
              }}
            >
              <p
                className="font-mono text-[10px] uppercase tracking-widest"
                style={{ color: adminPalette.muted }}
              >
                {card.label}
              </p>
              <div
                className="flex h-6 w-6 items-center justify-center rounded-lg"
                style={{ backgroundColor: adminPalette.chipBg }}
              >
                <Icon size={12} style={{ color: adminPalette.accent }} />
              </div>
            </div>
            <div className="px-4 py-4">
              {loading ? (
                <div className="skeleton h-8 w-12 rounded-lg" />
              ) : (
                <p
                  className="text-3xl font-bold tracking-tight"
                  style={{ color: adminPalette.deep }}
                >
                  {card.value}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default AdminStatGrid;
