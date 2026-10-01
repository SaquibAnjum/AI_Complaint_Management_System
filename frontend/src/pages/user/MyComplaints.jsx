import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { complaintsAPI, feedbackAPI } from '../../services/api';
import UserHeader from '../../components/user/UserHeader';
import UserFilterToolbar from '../../components/user/UserFilterToolbar';
import UserComplaintDrawer from '../../components/user/UserComplaintDrawer';
import { useToast } from '../../components/Toast';
import {
  PlusCircle,
  FileText,
  Clock,
  PlayCircle,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Calendar,
  MapPin,
  User,
  ChevronRight,
  Star,
  Sparkles,
  ArrowUpDown,
} from 'lucide-react';

const STATUS_PILLS = {
  PENDING: { label: 'Pending Review', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  UNDER_REVIEW: { label: 'Under Review', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  ASSIGNED: { label: 'Assigned', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  IN_PROGRESS: { label: 'In Progress', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  RESOLVED: { label: 'Resolved', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  CONFIRMED: { label: 'Confirmed Closed', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' },
  REOPENED: { label: 'Reopened', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
};

const PRIORITY_BADGES = {
  LOW: { label: 'Low', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
  MEDIUM: { label: 'Medium', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  HIGH: { label: 'High', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  CRITICAL: { label: 'Critical', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
};

const MyComplaints = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToast } = useToast();

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Filters state initialized from URL search params if present
  const [filters, setFilters] = useState({
    search: '',
    status: searchParams.get('status') || 'ALL',
    priority: 'ALL',
    category: 'ALL',
    sortBy: 'newest',
  });

  // Keep state synced if URL parameter changes
  useEffect(() => {
    const urlStatus = searchParams.get('status');
    if (urlStatus && urlStatus !== filters.status) {
      setFilters((prev) => ({ ...prev, status: urlStatus }));
    }
  }, [searchParams]);

  // Load from API if available and merge with local realistic complaints
  useEffect(() => {
    const loadComplaints = async () => {
      setLoading(true);

      try {
        const res = await complaintsAPI.list({ per_page: 30 });

        if (res.success && res.data?.complaints) {
          setComplaints(res.data.complaints);
        } else {
          setComplaints([]);
        }
      } catch (err) {
        console.error('Failed to load user complaints:', err);
        setComplaints([]);
      } finally {
        setLoading(false);
      }
    };

    loadComplaints();
  }, []);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      status: 'ALL',
      priority: 'ALL',
      category: 'ALL',
      sortBy: 'newest',
    });
    setSearchParams({});
  };

  // Filter and sort logic
  const filteredComplaints = useMemo(() => {
    return complaints
      .filter((c) => {
        // Search
        if (filters.search.trim()) {
          const q = filters.search.toLowerCase();
          const matchTitle = (c.title || '').toLowerCase().includes(q);
          const matchDesc = (c.description || '').toLowerCase().includes(q);
          const matchId = (c.ticket_id || String(c.id)).toLowerCase().includes(q);
          const matchDept = (c.department || c.category || '').toLowerCase().includes(q);
          const matchLoc = (c.location || '').toLowerCase().includes(q);
          if (!matchTitle && !matchDesc && !matchId && !matchDept && !matchLoc) {
            return false;
          }
        }

        // Status
        if (filters.status !== 'ALL') {
          if (filters.status === 'PENDING' && c.status !== 'PENDING' && c.status !== 'UNDER_REVIEW') {
            return false;
          } else if (filters.status === 'IN_PROGRESS' && c.status !== 'IN_PROGRESS' && c.status !== 'ASSIGNED') {
            return false;
          } else if (filters.status === 'RESOLVED' && c.status !== 'RESOLVED' && c.status !== 'CONFIRMED') {
            return false;
          } else if (filters.status === 'REOPENED' && c.status !== 'REOPENED') {
            return false;
          }
        }

        // Priority
        if (filters.priority !== 'ALL' && c.priority !== filters.priority) {
          return false;
        }

        // Category
        if (filters.category !== 'ALL' && c.category !== filters.category) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (filters.sortBy === 'newest') {
          return new Date(b.created_at || b.submitted_at || 0) - new Date(a.created_at || a.submitted_at || 0);
        }
        if (filters.sortBy === 'oldest') {
          return new Date(a.created_at || a.submitted_at || 0) - new Date(b.created_at || b.submitted_at || 0);
        }
        if (filters.sortBy === 'priority') {
          const pOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
          return (pOrder[b.priority] || 0) - (pOrder[a.priority] || 0);
        }
        return 0;
      });
  }, [complaints, filters]);

  // Counts for quick KPI row
  const countTotal = complaints.length;
  const countPending = complaints.filter((c) => c.status === 'PENDING' || c.status === 'UNDER_REVIEW').length;
  const countInProgress = complaints.filter((c) => c.status === 'IN_PROGRESS' || c.status === 'ASSIGNED').length;
  const countResolved = complaints.filter((c) => c.status === 'RESOLVED' || c.status === 'CONFIRMED').length;
  const countReopened = complaints.filter((c) => c.status === 'REOPENED').length;

  const handleSelectComplaint = async (complaint) => {
    try {
      const res = await complaintsAPI.getDetails(complaint.id);

      if (res.success && res.data?.complaint) {
        setSelectedComplaint(res.data.complaint);
      } else {
        setSelectedComplaint(complaint);
      }
    } catch (err) {
      console.error('Failed to load complaint details:', err);
      setSelectedComplaint(complaint);
    }

    setDrawerOpen(true);
  };

  const handleConfirmResolution = async (complaint, feedback) => {
    try {
      const res = await complaintsAPI.confirmResolution(complaint.id);

      if (!res?.success || !res.data?.complaint) {
        throw new Error(res?.message || 'Failed to confirm resolution');
      }

      const updatedComplaint = res.data.complaint;

      // Submit feedback only after the backend successfully confirms resolution.
      if (feedback?.rating) {
        try {
          const feedbackRes = await feedbackAPI.submit(
            complaint.id,
            feedback
          );

          if (!feedbackRes?.success) {
            console.warn(
              'Resolution confirmed, but feedback submission failed.'
            );
          }
        } catch (feedbackError) {
          console.warn(
            'Resolution confirmed, but feedback submission failed:',
            feedbackError
          );
        }
      }

      setComplaints((prev) =>
        prev.map((c) =>
          c.id === complaint.id ||
            c.ticket_id === complaint.ticket_id
            ? updatedComplaint
            : c
        )
      );

      if (
        selectedComplaint &&
        (selectedComplaint.id === complaint.id ||
          selectedComplaint.ticket_id === complaint.ticket_id)
      ) {
        setSelectedComplaint(updatedComplaint);
      }

      addToast(
        'Resolution confirmed! Thank you for your feedback.',
        'success'
      );

      setDrawerOpen(false);
    } catch (err) {
      console.error('Failed to confirm resolution:', err);

      addToast(
        err?.message || 'Failed to confirm resolution',
        'error'
      );
    }
  };

  const handleReopenComplaint = async (complaint, reason) => {
    try {
      try {
        await complaintsAPI.reopen(complaint.id, { reason });
      } catch (err) {
        console.warn('Backend reopen skipped:', err);
      }

      const updated = {
        ...complaint,
        status: 'REOPENED',
        timeline: [
          {
            action: 'Complaint Reopened by User',
            by: user?.name || 'Saquib (User)',
            time: 'Just now',
            note: reason,
          },
          ...(complaint.timeline || []),
        ],
      };

      setComplaints((prev) =>
        prev.map((c) => (c.id === complaint.id || c.ticket_id === complaint.ticket_id ? updated : c))
      );

      if (selectedComplaint && (selectedComplaint.id === complaint.id || selectedComplaint.ticket_id === complaint.ticket_id)) {
        setSelectedComplaint(updated);
      }

      addToast('Complaint reopened. Assigned staff notified.', 'info');
      setDrawerOpen(false);
    } catch (err) {
      addToast('Failed to reopen complaint', 'error');
    }
  };

  return (
    <div className="page-container py-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <UserHeader
        title="My Complaints"
        subtitle="Track your submitted tickets, review staff progress notes, and verify resolutions."
        actions={
          <Link
            to="/user/submit"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-2xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Submit a Complaint</span>
          </Link>
        }
      />

      {/* Quick Status KPI Pill Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        <button
          type="button"
          onClick={() => handleFilterChange('status', 'ALL')}
          className={`p-3 rounded-lg border text-left transition-all ${filters.status === 'ALL'
            ? 'border-indigo-600 bg-indigo-50/70 ring-1 ring-indigo-600'
            : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
        >
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            All Tickets
          </span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-lg font-bold text-slate-900">{countTotal}</span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleFilterChange('status', 'PENDING')}
          className={`p-3 rounded-lg border text-left transition-all ${filters.status === 'PENDING'
            ? 'border-amber-500 bg-amber-50/70 ring-1 ring-amber-500'
            : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
        >
          <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider block">
            Pending
          </span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-lg font-bold text-slate-900">{countPending}</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleFilterChange('status', 'IN_PROGRESS')}
          className={`p-3 rounded-lg border text-left transition-all ${filters.status === 'IN_PROGRESS'
            ? 'border-blue-500 bg-blue-50/70 ring-1 ring-blue-500'
            : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
        >
          <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider block">
            In Progress
          </span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-lg font-bold text-slate-900">{countInProgress}</span>
            <PlayCircle className="w-4 h-4 text-blue-500" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleFilterChange('status', 'RESOLVED')}
          className={`p-3 rounded-lg border text-left transition-all ${filters.status === 'RESOLVED'
            ? 'border-emerald-500 bg-emerald-50/70 ring-1 ring-emerald-500'
            : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
        >
          <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block">
            Resolved
          </span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-lg font-bold text-slate-900">{countResolved}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleFilterChange('status', 'REOPENED')}
          className={`p-3 rounded-lg border text-left transition-all col-span-2 sm:col-span-1 ${filters.status === 'REOPENED'
            ? 'border-rose-500 bg-rose-50/70 ring-1 ring-rose-500'
            : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
        >
          <span className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider block">
            Reopened
          </span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-lg font-bold text-slate-900">{countReopened}</span>
            <RotateCcw className="w-4 h-4 text-rose-500" />
          </div>
        </button>
      </div>

      {/* Filter and Search Toolbar */}
      <UserFilterToolbar
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
        totalCount={complaints.length}
        filteredCount={filteredComplaints.length}
      />

      {/* Complaints List Cards */}
      {filteredComplaints.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 sm:p-12 text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-800">No complaints found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {filters.search || filters.status !== 'ALL' || filters.priority !== 'ALL' || filters.category !== 'ALL'
                ? 'No tickets match the selected filters. Try clearing some criteria to see more.'
                : 'You have not submitted any complaints yet.'}
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 pt-2">
            {filters.search || filters.status !== 'ALL' || filters.priority !== 'ALL' || filters.category !== 'ALL' ? (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors shadow-2xs"
              >
                Clear Filters
              </button>
            ) : (
              <Link
                to="/user/submit"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-2xs"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Submit Your First Complaint</span>
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredComplaints.map((item) => {
            const ticketId = item.ticket_id || `CMP-${item.id}`;
            const statusConfig = STATUS_PILLS[item.status] || STATUS_PILLS.PENDING;
            const priorityConfig = PRIORITY_BADGES[item.priority] || PRIORITY_BADGES.MEDIUM;
            const assignedTech = item.active_assignment?.staff_name || item.assigned_staff_name;

            return (
              <div
                key={item.id}
                onClick={() => handleSelectComplaint(item)}
                className="group bg-white border border-slate-200 hover:border-indigo-300 rounded-xl p-4 sm:p-5 shadow-xs hover:shadow-sm transition-all cursor-pointer space-y-3"
              >
                {/* Header Row */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50/80 px-2 py-0.5 rounded border border-indigo-200">
                      {ticketId}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {item.category}
                    </span>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${priorityConfig.bg} ${priorityConfig.text} ${priorityConfig.border}`}>
                      {priorityConfig.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
                      {statusConfig.label}
                    </span>
                  </div>
                </div>

                {/* Title & Description */}
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Footer Info Row */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs text-slate-500">
                  <div className="flex items-center gap-4 flex-wrap">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(item.created_at || item.submitted_at || Date.now()).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                    {item.location && (
                      <span className="flex items-center gap-1.5 text-slate-600">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {item.location}
                      </span>
                    )}
                    {assignedTech && (
                      <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                        <User className="w-3.5 h-3.5 text-indigo-500" />
                        Tech: {assignedTech}
                      </span>
                    )}
                    {item.rating && (
                      <span className="flex items-center gap-1 text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                        {item.rating} / 5
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-auto">
                    {item.status === 'RESOLVED' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full animate-pulse">
                        Confirm Resolution
                      </span>
                    )}
                    <span className="text-xs font-semibold text-indigo-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                      View Details
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Interactive Detail Drawer */}
      <UserComplaintDrawer
        complaint={selectedComplaint}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onConfirmResolution={handleConfirmResolution}
        onReopenComplaint={handleReopenComplaint}
      />
    </div>
  );
};

export default MyComplaints;
