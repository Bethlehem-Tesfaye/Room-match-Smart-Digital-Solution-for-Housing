import type { ReactNode } from "react";
import { adminPalette } from "../../theme/palette";

type BentoCardProps = {
  label: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

function BentoCard({ label, action, children, className = "" }: BentoCardProps) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border ${className}`}
      style={{
        borderColor: adminPalette.border,
        backgroundColor: adminPalette.cardBg,
      }}
    >
      <div
        className="flex items-center justify-between border-b px-5 py-3"
        style={{
          borderColor: adminPalette.border,
          backgroundColor: adminPalette.cardMutedBg,
        }}
      >
        <p
          className="font-mono text-[10px] uppercase tracking-widest"
          style={{ color: adminPalette.muted }}
        >
          {label}
        </p>
        {action}
      </div>
      {children}
    </div>
  );
}

export default BentoCard;
