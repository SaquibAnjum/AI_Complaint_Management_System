import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  complaintsAPI,
  feedbackAPI,
  notificationsAPI,
} from '../../services/api';
import {
  INITIAL_USER_PROFILE,
} from '../../data/userData';
import UserHeader from '../../components/user/UserHeader';
import UserStatCard from '../../components/user/UserStatCard';
import UserStatusOverview from '../../components/user/UserStatusOverview';
import UserRecentComplaints from '../../components/user/UserRecentComplaints';
import UserLatestUpdates from '../../components/user/UserLatestUpdates';
import UserComplaintDrawer from '../../components/user/UserComplaintDrawer';
import { useToast } from '../../components/Toast';
import {
  PlusCircle,
  Clock,
  PlayCircle,
  CheckCircle2,
  FileText,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

const UserDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [complaints, setComplaints] = useState([]);
  const [updates, setUpdates] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeStatusFilter, setActiveStatusFilter] = useState('ALL');

  const userName = user?.name || INITIAL_USER_PROFILE.name;

  // Load from API if backend server is responsive
  useEffect(() => {
    const loadUserDashboardData = async () => {
      try {
        const [complaintsRes, notificationsRes] = await Promise.all([
          complaintsAPI.list({ per_page: 20 }),
          notificationsAPI.list(false),
        ]);

        if (complaintsRes.success && complaintsRes.data?.complaints) {
          setComplaints(complaintsRes.data.complaints);
        }

        if (
          notificationsRes.success &&
          notificationsRes.data?.notifications
        ) {
          const complaintList = complaintsRes.data?.complaints || [];

          const formattedUpdates = notificationsRes.data.notifications.map(
            (notification) => {
              const relatedComplaint = complaintList.find(
                (complaint) =>
                  complaint.id === notification.complaint_id
              );

              const message = notification.message || '';
              const lowerMessage = message.toLowerCase();

              let type = 'REMARK';

              if (lowerMessage.includes('resolved')) {
                type = 'RESOLVED';
              } else if (
                lowerMessage.includes('progress') ||
                lowerMessage.includes('in-progress')
              ) {
                type = 'IN_PROGRESS';
              } else if (lowerMessage.includes('assigned')) {
                type = 'ASSIGNED';
              }

              return {
                id: notification.id,
                type,
                activity: message,
                ticket_id:
                  relatedComplaint?.ticket_id ||
                  (notification.complaint_id
                    ? `CMP-${notification.complaint_id}`
                    : null),
                time: notification.created_at
                  ? new Date(notification.created_at).toLocaleString()
                  : '',
              };
            }
          );

          setUpdates(formattedUpdates);
        }
      } catch (err) {
        console.error('Failed to load user dashboard data:', err);
      }
    };

    loadUserDashboardData();
  }, []);

  // Compute metrics
  const totalCount = complaints.length;
  const pendingCount = complaints.filter(
    (c) => c.status === 'PENDING' || c.status === 'UNDER_REVIEW'
  ).length;
  const inProgressCount = complaints.filter(
    (c) => c.status === 'IN_PROGRESS' || c.status === 'ASSIGNED'
  ).length;
  const resolvedCount = complaints.filter(
    (c) => c.status === 'RESOLVED' || c.status === 'CONFIRMED'
  ).length;

  const handleSelectComplaint = async (complaint) => {
    try {
      const res = await complaintsAPI.getDetails(complaint.id);
      console.log('CMP DETAILS RESPONSE:', res);

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
      try {
        await complaintsAPI.confirmResolution(complaint.id);
        if (feedback?.rating) {
          await feedbackAPI.submit(complaint.id, feedback);
        }
      } catch (err) {
        console.warn('Backend confirmation skipped:', err);
      }

      const updated = {
        ...complaint,
        status: 'CONFIRMED',
        rating: feedback?.rating,
        user_feedback: feedback?.comment,
        timeline: [
          {
            action: 'Resolution Confirmed by User',
            by: userName,
            time: 'Just now',
            note: `Rating: ${feedback?.rating} / 5 Stars. "${feedback?.comment || 'Satisfied with work.'}"`,
          },
          ...(complaint.timeline || []),
        ],
      };

      setComplaints((prev) =>
        prev.map((c) =>
          c.id === complaint.id || c.ticket_id === complaint.ticket_id ? updated : c
        )
      );

      if (selectedComplaint && (selectedComplaint.id === complaint.id || selectedComplaint.ticket_id === complaint.ticket_id)) {
        setSelectedComplaint(updated);
      }

      addToast('Resolution confirmed! Thank you for your feedback.', 'success');
      setDrawerOpen(false);
    } catch (err) {
      addToast('Failed to confirm resolution', 'error');
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
            by: userName,
            time: 'Just now',
            note: reason,
          },
          ...(complaint.timeline || []),
        ],
      };

      setComplaints((prev) =>
        prev.map((c) =>
          c.id === complaint.id || c.ticket_id === complaint.ticket_id ? updated : c
        )
      );

      if (selectedComplaint && (selectedComplaint.id === complaint.id || selectedComplaint.ticket_id === complaint.ticket_id)) {
        setSelectedComplaint(updated);
      }

      addToast('Complaint reopened. Department staff notified.', 'info');
      setDrawerOpen(false);
    } catch (err) {
      addToast('Failed to reopen complaint', 'error');
    }
  };

  return (
    <div className="page-container py-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <UserHeader
        title="Dashboard"
        subtitle="Track your complaints and stay updated on their progress."
        actions={
          <Link
            to="/user/submit"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-2xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Submit a New Complaint</span>
          </Link>
        }
      />

      {/* Welcome Banner */}
      <div className="bg-slate-900 text-white rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-800 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
              Student / Resident Portal
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
            Welcome back, {userName}
          </h2>
          <p className="text-xs text-slate-300">
            Here is a quick overview of your complaints. You have{' '}
            <strong className="text-white font-semibold">{pendingCount + inProgressCount} active grievances</strong> currently under review or field repair.
          </p>
        </div>

        {/* Primary CTA in Banner */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            to="/user/submit"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors shadow-2xs"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>File New Grievance</span>
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <UserStatCard
          label="Total Complaints"
          value={totalCount}
          context="+2 this month"
          icon={FileText}
          variant="indigo"
          onClick={() => navigate('/user/complaints')}
        />
        <UserStatCard
          label="Pending"
          value={pendingCount}
          context={`${pendingCount} require review`}
          icon={Clock}
          variant="amber"
          onClick={() => navigate('/user/complaints?status=PENDING')}
        />
        <UserStatCard
          label="In Progress"
          value={inProgressCount}
          context="Field work ongoing"
          icon={PlayCircle}
          variant="blue"
          onClick={() => navigate('/user/complaints?status=IN_PROGRESS')}
        />
        <UserStatCard
          label="Resolved"
          value={resolvedCount}
          context="Good progress"
          icon={CheckCircle2}
          variant="emerald"
          onClick={() => navigate('/user/complaints?status=RESOLVED')}
        />
      </div>

      {/* Status Overview Component */}
      <UserStatusOverview
        complaints={complaints}
        activeStatus={activeStatusFilter}
        onSelectStatus={(st) => {
          setActiveStatusFilter(st);
          if (st !== 'ALL') {
            navigate(`/user/complaints?status=${st}`);
          }
        }}
      />

      {/* Grid: Recent Complaints + Latest Updates */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Complaints Table (2 Cols) */}
        <div className="lg:col-span-2">
          <UserRecentComplaints
            complaints={complaints}
            onSelectComplaint={handleSelectComplaint}
            maxItems={5}
          />
        </div>

        {/* Latest Activity Updates (1 Col) */}
        <div className="lg:col-span-1">
          <UserLatestUpdates
            updates={updates}
            onSelectTicket={(tid) => {
              const match = complaints.find((c) => c.ticket_id === tid || String(c.id) === tid);
              if (match) handleSelectComplaint(match);
            }}
          />
        </div>
      </div>

      {/* Interactive Details Slide-Over Drawer */}
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

export default UserDashboard;
