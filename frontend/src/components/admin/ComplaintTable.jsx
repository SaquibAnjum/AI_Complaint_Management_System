import React, { useState } from 'react';
import {
  ArrowUpDown,
  Clock,
  ChevronLeft,
  ChevronRight,
  Eye,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

export const PRIORITY_STYLES = {
  CRITICAL: {
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
    dot: 'bg-rose-600',
  },
  HIGH: {
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-600',
  },
  MEDIUM: {
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
    dot: 'bg-blue-600',
  },
  LOW: {
    badge: 'bg-slate-50 text-slate-700 border-slate-200',
    dot: 'bg-slate-500',
  },
};

export const STATUS_STYLES = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  UNDER_REVIEW: 'bg-purple-50 text-purple-700 border-purple-200',
  IN_PROGRESS: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  RESOLVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CONFIRMED: 'bg-teal-50 text-teal-700 border-teal-200',
  REOPENED: 'bg-rose-50 text-rose-700 border-rose-200',
};

const ComplaintTable = ({
  complaints = [],
  onSelectComplaint,
  selectedId = null,
  pageSize = 10,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('created_at');
  const [sortAsc, setSortAsc] = useState(false);

  // Sorting
  const sortedComplaints = [...complaints].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];

    if (sortField === 'created_at') {
      valA = new Date(valA || 0).getTime();
      valB = new Date(valB || 0).getTime();
    }

    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  // Pagination
  const totalPages = Math.ceil(sortedComplaints.length / pageSize) || 1;
  const paginatedComplaints = sortedComplaints.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const getSlaIndicator = (complaint) => {
    if (complaint.status === 'RESOLVED' || complaint.status === 'CONFIRMED') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
          <CheckCircle2 className="w-3 h-3" /> Met SLA
        </span>
      );
    }

    const isOverdue =
      complaint.slaOverdue ||
      complaint.priority === 'CRITICAL' ||
      (complaint.created_at &&
        Date.now() - new Date(complaint.created_at).getTime() > 24 * 3600 * 1000 &&
        complaint.status === 'PENDING');

    if (isOverdue) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] text-rose-700 font-medium bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
          <AlertTriangle className="w-3 h-3 text-rose-600" /> Overdue
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
        <Clock className="w-3 h-3" /> On Track
      </span>
    );
  };

  if (complaints.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-900">No complaints found</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Try clearing search filters or changing status/category selections to view other records.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500 select-none">
              <th
                onClick={() => handleSort('ticket_id')}
                className="py-3.5 px-4 cursor-pointer hover:text-slate-800 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Ticket ID</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3.5 px-4">Subject & Category</th>
              <th
                onClick={() => handleSort('priority')}
                className="py-3.5 px-4 cursor-pointer hover:text-slate-800 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Priority</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3.5 px-4">Submitter</th>

              <th
                onClick={() => handleSort('status')}
                className="py-3.5 px-4 cursor-pointer hover:text-slate-800 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Status</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3.5 px-4">SLA / Time</th>
              <th className="py-3.5 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {paginatedComplaints.map((c) => {
              const priorityStyle =
                PRIORITY_STYLES[c.priority] || PRIORITY_STYLES.LOW;
              const statusStyle =
                STATUS_STYLES[c.status] || 'bg-slate-50 text-slate-700 border-slate-200';
              const isSelected = selectedId && (c.id === selectedId || c.ticket_id === selectedId);

              return (
                <tr
                  key={c.id || c.ticket_id}
                  onClick={() => onSelectComplaint && onSelectComplaint(c)}
                  className={`group transition-colors cursor-pointer ${isSelected
                    ? 'bg-indigo-50/50 hover:bg-indigo-50/70'
                    : 'hover:bg-slate-50/80'
                    }`}
                >
                  {/* Ticket ID */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${priorityStyle.dot}`} />
                      <span className="font-mono text-xs font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {c.ticket_id || `CMP-${c.id}`}
                      </span>
                    </div>
                  </td>

                  {/* Title & Category */}
                  <td className="py-3 px-4 max-w-xs">
                    <div className="font-medium text-slate-900 truncate">
                      {c.title}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                        {c.category || 'General'}
                      </span>
                      {c.department && (
                        <span className="text-[11px] text-slate-400">
                          • {c.department}
                        </span>
                      )}
                      {c.ai_sentiment && (
                        <span className="inline-flex items-center text-[10px] text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded font-medium" title="AI Assessed">
                          <Sparkles className="w-2.5 h-2.5 mr-0.5" />
                          AI
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Priority */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${priorityStyle.badge}`}
                    >
                      {c.priority || 'MEDIUM'}
                    </span>
                  </td>

                  {/* Submitter */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-semibold text-[10px] flex items-center justify-center">
                        {c.user_name
                          ? c.user_name.substring(0, 2).toUpperCase()
                          : 'U'}
                      </div>
                      <div className="text-xs">
                        <p className="font-medium text-slate-900 leading-tight">
                          {c.user_name || 'Anonymous User'}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {c.user_email || 'Portal User'}
                        </p>
                      </div>
                    </div>
                  </td>



                  {/* Status */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusStyle}`}
                    >
                      {(c.status || 'PENDING').replace('_', ' ')}
                    </span>
                  </td>

                  {/* SLA / Time */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div>{getSlaIndicator(c)}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {formatDateTime(c.created_at)}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 whitespace-nowrap text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectComplaint && onSelectComplaint(c);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 rounded border border-slate-200 hover:border-indigo-200 transition-all"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Review</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-slate-50/70 border-t border-slate-200 text-xs text-slate-500">
          <div>
            Page <span className="font-semibold text-slate-800">{currentPage}</span> of{' '}
            <span className="font-semibold text-slate-800">{totalPages}</span> (
            {sortedComplaints.length} total)
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplaintTable;
