import React from 'react';
import { Clock, CheckCircle, ArrowRight, User } from 'lucide-react';
import { ComplaintStatusBadge } from './ComplaintStatusBadge';

const ComplaintTimeline = ({ updates = [] }) => {
  if (!updates || updates.length === 0) {
    return (
      <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic', padding: '12px 0' }}>
        No timeline events recorded yet.
      </div>
    );
  }

  const formatDate = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="timeline">
      {updates.map((upd) => (
        <div key={upd.id} className="timeline-item">
          <div className="timeline-dot">
            <Clock size={11} style={{ color: 'var(--primary)' }} />
          </div>
          <div className="timeline-content">
            <div className="timeline-meta">
              <span style={{ fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <User size={13} /> {upd.user_name}
              </span>
              <span style={{ fontSize: '0.75rem', background: 'var(--bg-subtle)', padding: '2px 6px', borderRadius: 4 }}>
                {upd.user_role}
              </span>
              <span>•</span>
              <span>{formatDate(upd.created_at)}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '6px 0' }}>
              {upd.status_from && upd.status_to && upd.status_from !== upd.status_to ? (
                <>
                  <ComplaintStatusBadge status={upd.status_from} />
                  <ArrowRight size={14} style={{ color: 'var(--text-muted)' }} />
                  <ComplaintStatusBadge status={upd.status_to} />
                </>
              ) : (
                <ComplaintStatusBadge status={upd.status_to || upd.status_from} />
              )}
            </div>

            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: 4 }}>
              {upd.remark}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ComplaintTimeline;
