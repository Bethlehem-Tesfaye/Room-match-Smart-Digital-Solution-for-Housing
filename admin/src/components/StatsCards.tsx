import React from "react";

interface StatCardProps {
  label: string;
  value: number | string;
}

const Card: React.FC<StatCardProps> = ({ label, value }) => {
  return (
    <div className="stat-card">
      <div className="stat-icon">🏠</div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
};

const StatsCards: React.FC<{ items: StatCardProps[] }> = ({ items }) => {
  return (
    <div className="stats-grid">
      {items.map((it) => (
        <Card key={it.label} label={it.label} value={it.value} />
      ))}
    </div>
  );
};

export default StatsCards;
