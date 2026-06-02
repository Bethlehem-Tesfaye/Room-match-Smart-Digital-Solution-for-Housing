import React from "react";

interface StatCardProps {
  label: string;
  value: number | string;
}

const Card: React.FC<StatCardProps> = ({ label, value }) => {
  return (
    <div className="admin-stat-card">
      <div className="admin-stat-header">
        <p className="admin-mono-label">{label}</p>
      </div>
      <div className="admin-stat-body">
        <div className="admin-stat-value">{value}</div>
      </div>
    </div>
  );
};

const StatsCards: React.FC<{ items: StatCardProps[] }> = ({ items }) => {
  return (
    <div className="admin-bento-grid">
      {items.map((it) => (
        <Card key={it.label} label={it.label} value={it.value} />
      ))}
    </div>
  );
};

export default StatsCards;
