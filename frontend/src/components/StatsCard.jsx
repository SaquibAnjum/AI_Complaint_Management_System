import React from 'react';

const StatsCard = ({ label, value, icon: Icon, color = 'var(--primary)', bg = 'var(--primary-subtle)' }) => {
  return (
    <div className="stat-card">
      <div className="stat-info">
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
      </div>
      {Icon && (
        <div className="stat-icon" style={{ backgroundColor: bg, color: color }}>
          <Icon size={24} />
        </div>
      )}
    </div>
  );
};

export default StatsCard;
