import React from 'react';

const STATUS_CONFIG = {
  PENDING: {
    label: 'Pending',
    color: 'bg-amber-500',
    text: 'text-amber-700',
    border: 'border-amber-200',
    bgLight: 'bg-amber-50',
  },
  UNDER_REVIEW: {
    label: 'Under Review',
    color: 'bg-purple-500',
    text: 'text-purple-700',
    border: 'border-purple-200',
    bgLight: 'bg-purple-50',
  },
  ASSIGNED: {
    label: 'Assigned',
    color: 'bg-blue-500',
    text: 'text-blue-700',
    border: 'border-blue-200',
    bgLight: 'bg-blue-50',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    color: 'bg-indigo-500',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
    bgLight: 'bg-indigo-50',
  },
  RESOLVED: {
    label: 'Resolved',
    color: 'bg-emerald-500',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    bgLight: 'bg-emerald-50',
  },
  CONFIRMED: {
    label: 'Confirmed',
    color: 'bg-teal-500',
    text: 'text-teal-700',
    border: 'border-teal-200',
    bgLight: 'bg-teal-50',
  },
  REOPENED: {
    label: 'Reopened',
    color: 'bg-rose-500',
    text: 'text-rose-700',
    border: 'border-rose-200',
    bgLight: 'bg-rose-50',
  },
};

const StatusDistribution = ({ distribution = {}, onSelectStatus, activeStatus = 'ALL' }) => {
  const total = Object.values(distribution).reduce((acc, count) => acc + count, 0);

  if (total === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            Pipeline Distribution
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Active lifecycle breakdown across all {total} tickets
          </p>
        </div>

        {activeStatus !== 'ALL' && onSelectStatus && (
          <button
            onClick={() => onSelectStatus('ALL')}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
          >
            Clear status filter
          </button>
        )}
      </div>

      {/* Multi-segmented Progress Bar */}
      <div className="h-3.5 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner mb-5">
        {Object.entries(distribution).map(([statusKey, count]) => {
          if (count === 0) return null;
          const config = STATUS_CONFIG[statusKey] || {
            label: statusKey,
            color: 'bg-slate-400',
          };
          const percentage = ((count / total) * 100).toFixed(1);

          return (
            <div
              key={statusKey}
              style={{ width: `${percentage}%` }}
              title={`${config.label}: ${count} (${percentage}%)`}
              className={`${config.color} transition-all duration-300 hover:opacity-90 relative cursor-pointer`}
              onClick={() => onSelectStatus && onSelectStatus(statusKey)}
            />
          );
        })}
      </div>

      {/* Chips Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2">
        {Object.entries(distribution).map(([statusKey, count]) => {
          const config = STATUS_CONFIG[statusKey] || {
            label: statusKey,
            color: 'bg-slate-400',
            text: 'text-slate-700',
            border: 'border-slate-200',
            bgLight: 'bg-slate-50',
          };
          const percentage = total > 0 ? ((count / total) * 100).toFixed(0) : 0;
          const isSelected = activeStatus === statusKey;

          return (
            <button
              key={statusKey}
              type="button"
              onClick={() => onSelectStatus && onSelectStatus(isSelected ? 'ALL' : statusKey)}
              className={`flex flex-col items-start p-2.5 rounded-lg border text-left transition-all duration-150 ${
                isSelected
                  ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/40'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 bg-white'
              }`}
            >
              <div className="flex items-center gap-1.5 w-full mb-1">
                <span className={`w-2 h-2 rounded-full ${config.color}`} />
                <span className="text-[11px] font-medium text-slate-600 truncate">
                  {config.label}
                </span>
              </div>
              <div className="flex items-baseline gap-1.5 w-full">
                <span className="text-base font-bold text-slate-900">{count}</span>
                <span className="text-[10px] text-slate-600 font-semibold">{percentage}%</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default StatusDistribution;
