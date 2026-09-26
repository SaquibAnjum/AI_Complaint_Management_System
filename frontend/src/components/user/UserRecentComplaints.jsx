import React from 'react';
import { ArrowRight, Eye, AlertCircle, Clock, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

const PRIORITY_BADGES = {
  CRITICAL: 'bg-rose-50 text-rose-700 border-rose-200 font-semibold',
  HIGH: 'bg-amber-50 text-amber-700 border-amber-200 font-semibold',
  MEDIUM: 'bg-blue-50 text-blue-700 border-blue-200',
  LOW: 'bg-slate-50 text-slate-700 border-slate-200',
};

const STATUS_BADGES = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  UNDER_REVIEW: 'bg-purple-50 text-purple-700 border-purple-200',
  ASSIGNED: 'bg-blue-50 text-blue-700 border-blue-200',
  IN_PROGRESS: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  RESOLVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CONFIRMED: 'bg-teal-50 text-teal-700 border-teal-200',
  REOPENED: 'bg-rose-50 text-rose-700 border-rose-200 font-semibold',
};

const UserRecentComplaints = ({ complaints = [], onSelectComplaint, maxItems = 4 }) => {
  const displayItems = complaints.slice(0, maxItems);

  if (displayItems.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-400">
        You haven't filed any complaints yet. Click "Submit a New Complaint" to get started.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            Recent Complaints
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Your most recently submitted grievances and requests
          </p>
        </div>

        <Link
          to="/user/complaints"
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
        >
          View All Complaints <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-[11px] font-semibold text-slate-400 uppercase tracking-wider select-none">
              <th className="py-2.5 px-3">Ticket ID</th>
              <th className="py-2.5 px-3">Subject</th>
              <th className="py-2.5 px-3">Category</th>
              <th className="py-2.5 px-3">Priority</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3">Submitted</th>
              <th className="py-2.5 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {displayItems.map((c) => {
              const priorityStyle =
                PRIORITY_BADGES[c.priority] || PRIORITY_BADGES.MEDIUM;
              const statusStyle =
                STATUS_BADGES[c.status] || 'bg-slate-50 text-slate-700 border-slate-200';

              return (
                <tr
                  key={c.id || c.ticket_id}
                  onClick={() => onSelectComplaint && onSelectComplaint(c)}
                  className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                >
                  <td className="py-3 px-3 font-mono font-semibold text-slate-900 group-hover:text-indigo-600 whitespace-nowrap">
                    {c.ticket_id || `CMP-${c.id}`}
                  </td>
                  <td className="py-3 px-3 max-w-xs">
                    <div className="font-medium text-slate-900 truncate">
                      {c.title}
                    </div>
                    {c.location && (
                      <div className="flex items-center gap-1 text-[11px] text-slate-400 truncate mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{c.location}</span>
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {c.category}
                    </span>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] border ${priorityStyle}`}
                    >
                      {c.priority}
                    </span>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${statusStyle}`}
                    >
                      {c.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap text-slate-500">
                    {c.created_at
                      ? new Date(c.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })
                      : 'Recently'}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectComplaint && onSelectComplaint(c);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 rounded border border-slate-200 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserRecentComplaints;
