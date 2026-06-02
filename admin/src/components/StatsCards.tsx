import React from "react";

interface StatCardProps {
  label: string;
  value: number | string;
}

// Accent colors cycling per card
const ACCENTS = [
  { dot: "#3b82f6", glow: "rgba(59,130,246,0.15)" },
  { dot: "#8b5cf6", glow: "rgba(139,92,246,0.15)" },
  { dot: "#10b981", glow: "rgba(16,185,129,0.15)" },
  { dot: "#f59e0b", glow: "rgba(245,158,11,0.15)" },
  { dot: "#ef4444", glow: "rgba(239,68,68,0.15)" },
  { dot: "#06b6d4", glow: "rgba(6,182,212,0.15)" },
];

const Card: React.FC<StatCardProps & { index: number }> = ({
  label,
  value,
  index,
}) => {
  const accent = ACCENTS[index % ACCENTS.length];

  return (
    <div
      className="bento-stat-card"
      style={
        {
          "--accent-dot": accent.dot,
          "--accent-glow": accent.glow,
        } as React.CSSProperties
      }
    >
      <div className="bento-stat-top">
        <span className="bento-stat-dot" />
        <p className="bento-stat-label">{label}</p>
      </div>
      <div className="bento-stat-value">{value}</div>
    </div>
  );
};

const StatsCards: React.FC<{ items: StatCardProps[] }> = ({ items }) => {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@700;800&display=swap');

        .bento-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 12px;
        }

        .bento-stat-card {
          position: relative;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          padding: 20px;
          overflow: hidden;
          transition: transform 0.2s ease, border-color 0.2s ease;
        }

        .bento-stat-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: var(--accent-dot);
          opacity: 0.7;
          border-radius: 16px 16px 0 0;
        }

        .bento-stat-card::after {
          content: '';
          position: absolute;
          bottom: -20px;
          right: -20px;
          width: 80px;
          height: 80px;
          background: var(--accent-glow);
          border-radius: 50%;
          filter: blur(20px);
          pointer-events: none;
        }

        .bento-stat-card:hover {
          transform: translateY(-2px);
          border-color: rgba(255,255,255,0.14);
        }

        .bento-stat-top {
          display: flex;
          align-items: center;
          gap: 7px;
          margin-bottom: 14px;
        }

        .bento-stat-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--accent-dot);
          box-shadow: 0 0 6px var(--accent-dot);
          flex-shrink: 0;
        }

        .bento-stat-label {
          font-family: 'DM Mono', monospace;
          font-size: 10.5px;
          font-weight: 500;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.35);
          margin: 0;
          line-height: 1;
        }

        .bento-stat-value {
          font-family: 'Syne', sans-serif;
          font-size: 32px;
          font-weight: 800;
          color: #fff;
          line-height: 1;
          letter-spacing: -0.02em;
        }
      `}</style>

      <div className="bento-stats-grid">
        {items.map((it, i) => (
          <Card key={it.label} label={it.label} value={it.value} index={i} />
        ))}
      </div>
    </>
  );
};

export default StatsCards;
