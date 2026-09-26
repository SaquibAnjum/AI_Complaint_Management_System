import React from 'react';
import { Layers, Clock, PlayCircle, CheckCircle2, RotateCcw } from 'lucide-react';

const UserStatusOverview = ({ complaints = [], onSelectStatus, activeStatus = 'ALL' }) => {
  const total = complaints.length;

  const pendingCount = complaints.filter(
    (c) => c.status === 'PENDING' || c.status === 'UNDER_REVIEW'
  ).length;
  const inProgressCount = complaints.filter(
    (c) => c.status === 'IN_PROGRESS' || c.status === 'ASSIGNED'
  ).length;
  const resolvedCount = complaints.filter(
    (c) => c.status === 'RESOLVED' || c.status === 'CONFIRMED'
  ).length;
  const reopenedCount = complaints.filter((c) => c.status === 'REOPENED').length;

  const getPercent = (count) => (total > 0 ? ((count / total) * 100).toFixed(0) : 0);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            Complaint Status Overview
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Current resolution lifecycle across all your {total} filed grievances
          </p>
        </div>
        <Layers className="w-4 h-4 text-slate-400" />
      </div>

      {/* Segmented Progress Bar */}
      <div className="space-y-1.5 mb-5">
        <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
          <span>Overall Resolution Progress</span>
          <span className="font-semibold text-slate-900">
            {resolvedCount} of {total} resolved ({getPercent(resolvedCount)}%)
          </span>
        </div>
        <div className="h-3.5 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
          {pendingCount > 0 && (
            <div
              style={{ width: `${getPercent(pendingCount)}%` }}
              title={`Pending: ${pendingCount}`}
              className="bg-amber-500 transition-all duration-300"
            />
          )}
          {inProgressCount > 0 && (
            <div
              style={{ width: `${getPercent(inProgressCount)}%` }}
              title={`In Progress: ${inProgressCount}`}
              className="bg-indigo-600 transition-all duration-300"
            />
          )}
          {reopenedCount > 0 && (
            <div
              style={{ width: `${getPercent(reopenedCount)}%` }}
              title={`Reopened: ${reopenedCount}`}
              className="bg-rose-500 transition-all duration-300"
            />
          )}
          {resolvedCount > 0 && (
            <div
              style={{ width: `${getPercent(resolvedCount)}%` }}
              title={`Resolved: ${resolvedCount}`}
              className="bg-emerald-500 transition-all duration-300"
            />
          )}
        </div>
      </div>

      {/* Interactive Status Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <button
          type="button"
          onClick={() => onSelectStatus && onSelectStatus(activeStatus === 'PENDING' ? 'ALL' : 'PENDING')}
          className={`flex flex-col items-start p-3 rounded-lg border text-left transition-all ${
            activeStatus === 'PENDING'
              ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/40'
              : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/60'
          }`}
        >
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600 mb-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Pending</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-slate-900">{pendingCount}</span>
            <span className="text-[10px] text-slate-400 font-semibold">{getPercent(pendingCount)}%</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onSelectStatus && onSelectStatus(activeStatus === 'IN_PROGRESS' ? 'ALL' : 'IN_PROGRESS')}
          className={`flex flex-col items-start p-3 rounded-lg border text-left transition-all ${
            activeStatus === 'IN_PROGRESS'
              ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/40'
              : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/60'
          }`}
        >
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600 mb-1">
            <span className="w-2 h-2 rounded-full bg-indigo-600" />
            <span>In Progress</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-slate-900">{inProgressCount}</span>
            <span className="text-[10px] text-slate-400 font-semibold">{getPercent(inProgressCount)}%</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onSelectStatus && onSelectStatus(activeStatus === 'RESOLVED' ? 'ALL' : 'RESOLVED')}
          className={`flex flex-col items-start p-3 rounded-lg border text-left transition-all ${
            activeStatus === 'RESOLVED'
              ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/40'
              : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/60'
          }`}
        >
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Resolved</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-slate-900">{resolvedCount}</span>
            <span className="text-[10px] text-slate-400 font-semibold">{getPercent(resolvedCount)}%</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onSelectStatus && onSelectStatus(activeStatus === 'REOPENED' ? 'ALL' : 'REOPENED')}
          className={`flex flex-col items-start p-3 rounded-lg border text-left transition-all ${
            activeStatus === 'REOPENED'
              ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/40'
              : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/60'
          }`}
        >
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600 mb-1">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>Reopened</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-slate-900">{reopenedCount}</span>
            <span className="text-[10px] text-slate-400 font-semibold">{getPercent(reopenedCount)}%</span>
          </div>
        </button>
      </div>
    </div>
  );
};

export default UserStatusOverview;
