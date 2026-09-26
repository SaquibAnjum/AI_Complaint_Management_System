import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import {
  INITIAL_COMPLAINTS,
} from '../../data/adminData';
import AdminHeader from '../../components/admin/AdminHeader';
import FilterToolbar from '../../components/admin/FilterToolbar';
import ComplaintTable from '../../components/admin/ComplaintTable';
import ComplaintDetailsDrawer from '../../components/admin/ComplaintDetailsDrawer';
import { useToast } from '../../components/Toast';
import { Download, Filter, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';

const CATEGORY_OPTIONS = [
  'Hostel',
  'IT Support',
  'Maintenance',
  'Academic',
  'Cleanliness',
  'Transport',
  'Security',
];

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'UNDER_REVIEW', label: 'Under Review' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'REOPENED', label: 'Reopened' },
];

const ManageComplaints = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToast } = useToast();

  const [complaints, setComplaints] = useState(INITIAL_COMPLAINTS);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  useEffect(() => {
    const queryParam = searchParams.get('search');
    if (queryParam) setSearchQuery(queryParam);
    const statusParam = searchParams.get('status');
    if (statusParam) setStatusFilter(statusParam);
  }, [searchParams]);

  // Load from backend if available
  useEffect(() => {
    const loadComplaints = async () => {
      try {
        const compRes = await adminAPI.getComplaints({ per_page: 50 });

        if (compRes?.success && compRes?.data?.complaints) {
          const apiItems = compRes.data.complaints;
          if (apiItems.length > 0) {
            const merged = [...apiItems];
            INITIAL_COMPLAINTS.forEach((m) => {
              if (!merged.some((a) => a.id === m.id || a.ticket_id === m.ticket_id)) {
                merged.push(m);
              }
            });
            setComplaints(merged);
          }
        }
      } catch (err) {
        console.warn('Backend connection note:', err);
      }
    };

    loadComplaints();
  }, []);

  // Filter complaints based on criteria
  const filteredComplaints = useMemo(() => {
    return complaints.filter((c) => {
      // Search query filter (matches ID, title, description, user, location)
      if (searchQuery && searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchesId = (c.ticket_id || `CMP-${c.id}`).toLowerCase().includes(q);
        const matchesTitle = (c.title || '').toLowerCase().includes(q);
        const matchesDesc = (c.description || '').toLowerCase().includes(q);
        const matchesUser = (c.user_name || '').toLowerCase().includes(q) || (c.user_email || '').toLowerCase().includes(q);
        const matchesLocation = (c.location || '').toLowerCase().includes(q);

        if (!matchesId && !matchesTitle && !matchesDesc && !matchesUser && !matchesLocation) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== 'ALL' && c.status !== statusFilter) {
        return false;
      }

      // Priority filter
      if (priorityFilter !== 'ALL' && c.priority !== priorityFilter) {
        return false;
      }

      // Category filter
      if (categoryFilter !== 'ALL' && c.category !== categoryFilter) {
        return false;
      }

      return true;
    });
  }, [complaints, searchQuery, statusFilter, priorityFilter, categoryFilter]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setPriorityFilter('ALL');
    setCategoryFilter('ALL');
    setSearchParams({});
  };

  const handleSelectComplaint = (complaint) => {
    setSelectedComplaint(complaint);
    setDrawerOpen(true);
  };

  const handleUpdateComplaint = async (updatedData) => {
    try {
      try {
        await adminAPI.updateStatus(updatedData.id, {
          status: updatedData.status,
          remark: updatedData.admin_note || 'Administrative status change',
        });
      } catch (err) {
        console.warn('Backend update fallback:', err);
      }

      // Update state
      setComplaints((prev) =>
        prev.map((c) =>
          c.id === updatedData.id || c.ticket_id === updatedData.ticket_id
            ? updatedData
            : c
        )
      );
      setSelectedComplaint(updatedData);
      addToast(`Ticket ${updatedData.ticket_id || updatedData.id} updated to ${updatedData.status}`, 'success');
      setDrawerOpen(false);
    } catch (err) {
      addToast('Failed to update complaint', 'error');
    }
  };

  const handleExportCSV = () => {
    const headers = ['Ticket ID,Title,Category,Department,Priority,Status,Submitter,Created At\n'];
    const rows = filteredComplaints.map((c) =>
      `"${c.ticket_id || c.id}","${c.title}","${c.category}","${c.department || ''}","${c.priority}","${c.status}","${c.user_name || ''}","${c.created_at || ''}"`
    );

    const blob = new Blob([headers.concat(rows).join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `complaints_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    addToast(`Exported ${filteredComplaints.length} records to CSV`, 'info');
  };

  // Quick preset filter buttons
  const quickFilters = [
    { label: 'All', status: 'ALL' },
    { label: 'Needs Review', status: 'UNDER_REVIEW' },
    { label: 'Pending', status: 'PENDING' },
    { label: 'In Progress', status: 'IN_PROGRESS' },
    { label: 'Resolved', status: 'RESOLVED' },
  ];

  return (
    <div className="page-container py-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <AdminHeader
        title="Manage Complaints"
        subtitle="Full institutional ticket repository: inspect details, update status, and manage resolution lifecycles."
        breadcrumbs={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'Manage Complaints' },
        ]}
        actions={
          <>
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export ({filteredComplaints.length})</span>
            </button>
          </>
        }
      />

      {/* Quick Status Pill Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs font-semibold text-slate-500 whitespace-nowrap mr-1">
          Quick Filter:
        </span>
        {quickFilters.map((q) => {
          const isActive = statusFilter === q.status;
          return (
            <button
              key={q.status}
              onClick={() => setStatusFilter(q.status)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              {q.label}
            </button>
          );
        })}
      </div>

      {/* Filter Toolbar */}
      <FilterToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        statusOptions={STATUS_OPTIONS}
        priorityFilter={priorityFilter}
        onPriorityChange={setPriorityFilter}
        categoryFilter={categoryFilter}
        onCategoryChange={setCategoryFilter}
        categoryOptions={CATEGORY_OPTIONS}
        onReset={handleResetFilters}
        totalResults={complaints.length}
        filteredCount={filteredComplaints.length}
        placeholder="Filter by Ticket ID (e.g. CMP-1075), subject, user..."
      />

      {/* Complaints Table */}
      <ComplaintTable
        complaints={filteredComplaints}
        onSelectComplaint={handleSelectComplaint}
        selectedId={selectedComplaint?.id || selectedComplaint?.ticket_id}
        pageSize={10}
      />

      {/* Details Slide-Over Drawer */}
      <ComplaintDetailsDrawer
        complaint={selectedComplaint}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onUpdateComplaint={handleUpdateComplaint}
      />
    </div>
  );
};

export default ManageComplaints;
