import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import { useToast } from '../../components/Toast';
import { ComplaintStatusBadge, PriorityBadge } from '../../components/ComplaintStatusBadge';
import ComplaintTimeline from '../../components/ComplaintTimeline';
import LoadingSpinner from '../../components/LoadingSpinner';
import { CATEGORIES, PRIORITIES, DEPARTMENTS } from '../../utils/constants';
import {
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  User,
  Building,
  Save,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';

const ComplaintReview = () => {
  const { id } = useParams();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingClassification, setSavingClassification] = useState(false);

  // Classification Override Form
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('');
  const [department, setDepartment] = useState('');
  const [status, setStatus] = useState('');

  const { toastSuccess, toastError } = useToast();

  const loadData = async () => {
    try {
      const compRes = await adminAPI.getComplaint(id);

      let foundComplaint = null;
      if (compRes?.success && compRes?.data?.complaint) {
        foundComplaint = compRes.data.complaint;
      } else {
        foundComplaint = null;
      }

      if (foundComplaint) {
        setComplaint(foundComplaint);
        setCategory(foundComplaint.category || 'General');
        setPriority(foundComplaint.priority || 'MEDIUM');
        setDepartment(foundComplaint.department || 'Maintenance');
        setStatus(foundComplaint.status || 'PENDING');
      }
    } catch (err) {
      console.warn('Error loading complaint review details:', err);
      setComplaint(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleMarkReview = async () => {
    try {
      const res = await adminAPI.markReview(id);
      if (res.success) {
        toastSuccess('Complaint marked as Under Review');
        loadData();
      }
    } catch (err) {
      toastError(err.message || 'Failed to update review status');
    }
  };

  const handleSaveClassification = async (e) => {
    e.preventDefault();
    setSavingClassification(true);
    try {
      const res = await adminAPI.updateClassification(id, { category, priority, department, status });
      if (res.success) {
        toastSuccess('Classification & status updated successfully');
        loadData();
      }
    } catch (err) {
      toastError(err.message || 'Failed to update classification');
    } finally {
      setSavingClassification(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading complaint review panel..." />;
  }

  if (!complaint) {
    return (
      <div className="page-container" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <h2>Complaint Not Found</h2>
        <Link to="/admin/complaints" className="btn btn-primary" style={{ marginTop: 16 }}>
          Back to Complaints List
        </Link>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ maxWidth: 1100 }}>
      <div style={{ marginBottom: 16 }}>
        <Link to="/admin/complaints" className="btn btn-outline btn-sm">
          <ArrowLeft size={15} /> Back to Complaints List
        </Link>
      </div>

      {/* Complaint Header & User Details */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                COMPLAINT #{complaint.id}
              </span>
              <ComplaintStatusBadge status={complaint.status} />
              <PriorityBadge priority={complaint.priority} />
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: 8 }}>
              {complaint.title}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: '0.85rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <User size={14} /> Filed By: <strong>{complaint.user_name}</strong> ({complaint.user_email})
              </span>
              <span>Filed on: {new Date(complaint.created_at).toLocaleString()}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {complaint.status === 'PENDING' && (
              <button onClick={handleMarkReview} className="btn btn-secondary btn-sm">
                <Clock size={15} /> Mark Under Review
              </button>
            )}
            {complaint.status !== 'IN_PROGRESS' && complaint.status !== 'RESOLVED' && complaint.status !== 'CONFIRMED' && (
              <button
                onClick={async () => {
                  try {
                    const res = await adminAPI.updateStatus(id, { status: 'IN_PROGRESS', remark: 'Admin marked complaint status as In Progress.' });
                    if (res.success) {
                      toastSuccess('Status updated to IN PROGRESS');
                      loadData();
                    }
                  } catch (err) {
                    toastError(err.message || 'Failed to update status');
                  }
                }}
                className="btn btn-outline btn-sm"
              >
                Mark In Progress
              </button>
            )}
            {complaint.status !== 'RESOLVED' && complaint.status !== 'CONFIRMED' && (
              <button
                onClick={async () => {
                  try {
                    const res = await adminAPI.updateStatus(id, { status: 'RESOLVED', remark: 'Admin marked complaint as Resolved.' });
                    if (res.success) {
                      toastSuccess('Status updated to RESOLVED');
                      loadData();
                    }
                  } catch (err) {
                    toastError(err.message || 'Failed to update status');
                  }
                }}
                className="btn btn-success btn-sm"
              >
                Mark Resolved
              </button>
            )}
          </div>
        </div>

        <div style={{ marginTop: 20, paddingTop: 18, borderTop: '1px solid var(--border-light)' }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
            Grievance Description
          </h4>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-main)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
            {complaint.description}
          </p>
        </div>
      </div>

      {/* Side-by-Side: AI Suggestions vs. Admin Final Classification */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 24, marginBottom: 24 }}>
        {/* Left Card: AI Automated Analysis */}
        <div className="card" style={{ border: '2px solid #ddd6fe', background: '#faf5ff' }}>
          <div className="ai-header" style={{ marginBottom: 14 }}>
            <Sparkles size={18} />
            <span>AI Automated Analysis</span>
            <span className="ai-badge-chip">Advisory Only</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: 8, border: '1px solid #ede9fe' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                AI Suggested Category
              </span>
              <div style={{ fontWeight: 600, color: '#4c1d95', fontSize: '1rem', marginTop: 2 }}>
                {complaint.ai_category || 'Other'}
              </div>
            </div>

            <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: 8, border: '1px solid #ede9fe' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                AI Suggested Priority
              </span>
              <div style={{ marginTop: 2 }}>
                <PriorityBadge priority={complaint.ai_priority || 'MEDIUM'} />
              </div>
            </div>

            <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: 8, border: '1px solid #ede9fe' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                AI Suggested Department
              </span>
              <div style={{ fontWeight: 600, color: '#4c1d95', fontSize: '1rem', marginTop: 2 }}>
                {complaint.ai_department || 'Administration'}
              </div>
            </div>

            {complaint.ai_summary && (
              <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: 8, border: '1px solid #ede9fe' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                  AI Summary
                </span>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                  {complaint.ai_summary}
                </p>
              </div>
            )}

          </div>
        </div>

        {/* Right Card: Admin Final Approved Classification */}
        <div className="card" style={{ border: '2px solid #bfdbfe' }}>
          <div className="card-header" style={{ marginBottom: 14 }}>
            <div className="card-title">
              <ShieldCheck size={18} style={{ color: 'var(--primary)' }} />
              <span>Final Approved Classification</span>
            </div>
            <span style={{ fontSize: '0.75rem', background: '#eff6ff', color: '#1d4ed8', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>
              Admin Overridable
            </span>
          </div>

          <form onSubmit={handleSaveClassification}>
            <div className="form-group">
              <label className="form-label" htmlFor="category">Final Category</label>
              <select
                id="category"
                className="form-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="priority">Final Urgency / Priority</label>
              <select
                id="priority"
                className="form-select"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="department">Direct to Department</label>
              <select
                id="department"
                className="form-select"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="statusSelect">Complaint Status</label>
              <select
                id="statusSelect"
                className="form-select"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={{ fontWeight: 600, color: 'var(--primary)' }}
              >
                <option value="PENDING">Pending</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CONFIRMED">Confirmed / Closed</option>
              </select>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={savingClassification}
              style={{ width: '100%' }}
            >
              <Save size={16} />
              <span>{savingClassification ? 'Saving Changes...' : 'Save Approved Classification'}</span>
            </button>
          </form>
        </div>
      </div>

      {/* Timeline Audit History */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Clock size={18} style={{ color: 'var(--primary)' }} />
            <span>Complete Audit Timeline</span>
          </div>
        </div>
        <ComplaintTimeline updates={complaint.updates || []} />
      </div>
    </div>
  );
};

export default ComplaintReview;
