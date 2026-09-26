import React from 'react';
import { STATUS_META, PRIORITY_META } from '../utils/constants';
import { Clock, Search, UserCheck, PlayCircle, CheckCircle, Award, RotateCcw, AlertTriangle } from 'lucide-react';

const STATUS_ICONS = {
  PENDING: Clock,
  UNDER_REVIEW: Search,
  ASSIGNED: UserCheck,
  IN_PROGRESS: PlayCircle,
  RESOLVED: CheckCircle,
  CONFIRMED: Award,
  REOPENED: RotateCcw,
};

export const ComplaintStatusBadge = ({ status }) => {
  const meta = STATUS_META[status] || STATUS_META.PENDING;
  const Icon = STATUS_ICONS[status] || Clock;

  return (
    <span className={`badge ${meta.badgeClass}`}>
      <Icon size={12} />
      {meta.label}
    </span>
  );
};

export const PriorityBadge = ({ priority }) => {
  const meta = PRIORITY_META[priority] || PRIORITY_META.MEDIUM;

  return (
    <span className={`badge ${meta.badgeClass}`}>
      {priority === 'CRITICAL' && <AlertTriangle size={12} />}
      {meta.label}
    </span>
  );
};

export default ComplaintStatusBadge;
