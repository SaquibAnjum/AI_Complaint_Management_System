import React from 'react';
import { Link } from 'react-router-dom';
import { ComplaintStatusBadge, PriorityBadge } from './ComplaintStatusBadge';
import { Calendar, Building, ChevronRight, Sparkles } from 'lucide-react';

const ComplaintCard = ({ complaint, basePath = '/user/complaints' }) => {
  const formatDate = (isoString) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="card" style={{ padding: '18px 20px', transition: 'box-shadow 0.15s ease', marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              #{complaint.id}
            </span>
            <ComplaintStatusBadge status={complaint.status} />
            <PriorityBadge priority={complaint.priority} />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Building size={13} /> {complaint.department}
            </span>
          </div>

          <h4 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: 6 }}>
            <Link to={`${basePath}/${complaint.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
              {complaint.title}
            </Link>
          </h4>

          <p style={{
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
            marginBottom: 10,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {complaint.description}
          </p>

          {complaint.ai_summary && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: '#f5f3ff',
              border: '1px solid #ddd6fe',
              padding: '4px 10px',
              borderRadius: 6,
              fontSize: '0.78rem',
              color: '#6d28d9',
              marginBottom: 8,
            }}>
              <Sparkles size={12} />
              <span><strong>AI Summary:</strong> {complaint.ai_summary}</span>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Calendar size={13} /> Filed {formatDate(complaint.created_at)}
            </span>
            <span>Category: <strong>{complaint.category}</strong></span>
          </div>
        </div>

        <Link
          to={`${basePath}/${complaint.id}`}
          className="btn btn-outline btn-sm"
          style={{ alignSelf: 'center', whiteSpace: 'nowrap' }}
        >
          View <ChevronRight size={14} />
        </Link>
      </div>
    </div>
  );
};

export default ComplaintCard;
