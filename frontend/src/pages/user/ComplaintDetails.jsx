import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { complaintsAPI, feedbackAPI } from '../../services/api';
import { useToast } from '../../components/Toast';
import { ComplaintStatusBadge, PriorityBadge } from '../../components/ComplaintStatusBadge';
import ComplaintTimeline from '../../components/ComplaintTimeline';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  ArrowLeft,
  Sparkles,
  Building,
  Calendar,
  CheckCircle,
  XCircle,
  RotateCcw,
  Star,
  User,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

const ComplaintDetails = () => {
  const { id } = useParams();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Rejection modal
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // Reopen modal
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [reopenReason, setReopenReason] = useState('');

  // Feedback form state
  const [rating, setRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const { toastSuccess, toastError } = useToast();
  const navigate = useNavigate();

  const fetchComplaint = async () => {
    try {
      const res = await complaintsAPI.getDetails(id);
      if (res.success && res.data?.complaint) {
        setComplaint(res.data.complaint);
      } else {
        toastError('Complaint not found');
      }
    } catch (err) {
      toastError(err.message || 'Error loading complaint');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaint();
  }, [id]);

  const handleConfirm = async () => {
    setActionLoading(true);
    try {
      const res = await complaintsAPI.confirmResolution(id);
      if (res.success) {
        toastSuccess('Resolution confirmed! You can now rate your experience.');
        fetchComplaint();
      }
    } catch (err) {
      toastError(err.message || 'Failed to confirm resolution');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      toastError('Please provide a reason for rejecting the resolution');
      return;
    }

    setActionLoading(true);
    try {
      const res = await complaintsAPI.rejectResolution(id, { reason: rejectionReason.trim() });
      if (res.success) {
        toastSuccess('Resolution rejected. Complaint has been reopened for staff action.');
        setShowRejectModal(false);
        setRejectionReason('');
        fetchComplaint();
      }
    } catch (err) {
      toastError(err.message || 'Failed to reject resolution');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReopen = async (e) => {
    e.preventDefault();
    if (!reopenReason.trim()) {
      toastError('Please provide a reason for reopening this complaint');
      return;
    }

    setActionLoading(true);
    try {
      const res = await complaintsAPI.reopen(id, { reason: reopenReason.trim() });
      if (res.success) {
        toastSuccess('Complaint reopened successfully.');
        setShowReopenModal(false);
        setReopenReason('');
        fetchComplaint();
      }
    } catch (err) {
      toastError(err.message || 'Failed to reopen complaint');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    setSubmittingFeedback(true);
    try {
      const res = await feedbackAPI.submit(id, { rating, comment: feedbackComment });
      if (res.success) {
        toastSuccess('Thank you! Your feedback has been recorded.');
        fetchComplaint();
      }
    } catch (err) {
      toastError(err.message || 'Failed to submit feedback');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading complaint details..." />;
  }

  if (!complaint) {
    return (
      <div className="page-container" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <h2>Complaint Not Found</h2>
        <p style={{ color: 'var(--text-muted)', margin: '12px 0 24px' }}>
          This complaint does not exist or you do not have permission to view it.
        </p>
        <Link to="/user/complaints" className="btn btn-primary">
          Back to My Complaints
        </Link>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ maxWidth: 1000 }}>
      {/* Back button */}
      <div style={{ marginBottom: 16 }}>
        <Link to="/user/complaints" className="btn btn-outline btn-sm">
          <ArrowLeft size={15} /> Back to My Complaints
        </Link>
      </div>

      {/* Main Header Card */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
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
                <Building size={14} /> Department: <strong>{complaint.department}</strong>
              </span>
              <span>Category: <strong>{complaint.category}</strong></span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Calendar size={14} /> Filed: {new Date(complaint.created_at).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Action Buttons for User Lifecycle */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {complaint.status === 'RESOLVED' && (
              <>
                <button
                  onClick={handleConfirm}
                  className="btn btn-success"
                  disabled={actionLoading}
                >
                  <CheckCircle size={16} /> Confirm Resolution
                </button>
                <button
                  onClick={() => setShowRejectModal(true)}
                  className="btn btn-danger"
                  disabled={actionLoading}
                >
                  <XCircle size={16} /> Reject Resolution
                </button>
              </>
            )}

            {complaint.status === 'CONFIRMED' && (
              <button
                onClick={() => setShowReopenModal(true)}
                className="btn btn-outline"
                disabled={actionLoading}
              >
                <RotateCcw size={15} /> Reopen Ticket
              </button>
            )}
          </div>
        </div>

        {/* Complaint Description */}
        <div style={{ marginTop: 20, paddingTop: 18, borderTop: '1px solid var(--border-light)' }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
            Grievance Description
          </h4>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-main)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
            {complaint.description}
          </p>
        </div>

        {/* AI Assisted Analysis Section */}
        <div className="ai-suggestion-box">
          <div className="ai-header">
            <Sparkles size={18} />
            <span>AI Automated Analysis</span>
            <span className="ai-badge-chip">AI Suggested — Admin Review Required</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, margin: '12px 0' }}>
            <div>
              <span style={{ fontSize: '0.78rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 600 }}>Suggested Category</span>
              <p style={{ fontWeight: 600, color: '#4b5563' }}>{complaint.ai_category || 'Other'}</p>
            </div>
            <div>
              <span style={{ fontSize: '0.78rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 600 }}>Suggested Priority</span>
              <p style={{ fontWeight: 600, color: '#4b5563' }}>{complaint.ai_priority || 'MEDIUM'}</p>
            </div>
            <div>
              <span style={{ fontSize: '0.78rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 600 }}>Suggested Department</span>
              <p style={{ fontWeight: 600, color: '#4b5563' }}>{complaint.ai_department || 'Administration'}</p>
            </div>
          </div>

          {complaint.ai_summary && (
            <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px dashed #c4b5fd', fontSize: '0.875rem', color: '#374151' }}>
              <strong>AI Summary:</strong> {complaint.ai_summary}
            </div>
          )}

        </div>

        {/* Active Staff Assignment if any */}
        {complaint.active_assignment && (
          <div style={{
            background: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '12px 16px',
            marginTop: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            border: '1px solid var(--border-light)',
          }}>
            <User size={18} style={{ color: 'var(--primary)' }} />
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Assigned Technician:</span>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>
                {complaint.active_assignment.staff_name} ({complaint.active_assignment.staff_email})
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Resolution Feedback Card */}
      {(complaint.status === 'RESOLVED' || complaint.status === 'CONFIRMED') && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <div className="card-title">
              <Star size={18} style={{ color: '#f59e0b' }} />
              <span>Resolution Feedback</span>
            </div>
          </div>

          {complaint.feedback ? (
            <div style={{ background: '#fefce8', border: '1px solid #fef08a', borderRadius: 8, padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={20}
                    fill={s <= complaint.feedback.rating ? '#f59e0b' : 'none'}
                    color="#f59e0b"
                  />
                ))}
                <span style={{ fontWeight: 700, marginLeft: 8, fontSize: '1rem', color: '#854d0e' }}>
                  {complaint.feedback.rating} out of 5 stars
                </span>
              </div>
              {complaint.feedback.comment && (
                <p style={{ color: '#713f12', fontSize: '0.925rem', marginTop: 4 }}>
                  "{complaint.feedback.comment}"
                </p>
              )}
            </div>
          ) : (
            <form onSubmit={handleFeedbackSubmit}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 14 }}>
                Please rate the speed and quality of the resolution provided by staff:
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setRating(s)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
                  >
                    <Star
                      size={28}
                      fill={s <= rating ? '#f59e0b' : 'none'}
                      color="#f59e0b"
                    />
                  </button>
                ))}
                <span style={{ fontWeight: 600, fontSize: '0.9rem', marginLeft: 8, color: 'var(--text-secondary)' }}>
                  {rating} / 5 Stars
                </span>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="feedbackComment">Comment / Suggestions (Optional)</label>
                <textarea
                  id="feedbackComment"
                  className="form-textarea"
                  rows={3}
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  placeholder="Share details about the work done..."
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={submittingFeedback}
              >
                {submittingFeedback ? 'Submitting...' : 'Submit Rating & Feedback'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Audit History / Timeline Card */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <ShieldCheck size={18} style={{ color: 'var(--primary)' }} />
            <span>Complaint History & Progress Audit</span>
          </div>
        </div>
        <ComplaintTimeline updates={complaint.updates || []} />
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.15rem', fontWeight: 600 }}>Reject Resolution</h3>
              <button onClick={() => setShowRejectModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleReject}>
              <div className="modal-body">
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 14 }}>
                  Please state why the resolution was unsatisfactory so the department can investigate further.
                </p>
                <div className="form-group">
                  <label className="form-label" htmlFor="rejectReason">Specific Reason *</label>
                  <textarea
                    id="rejectReason"
                    className="form-textarea"
                    rows={4}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="e.g. The leak was patched but ceiling paint is still wet and peeling..."
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowRejectModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-danger" disabled={actionLoading}>
                  {actionLoading ? 'Rejecting...' : 'Reject & Reopen Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reopen Modal */}
      {showReopenModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.15rem', fontWeight: 600 }}>Reopen Complaint</h3>
              <button onClick={() => setShowReopenModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleReopen}>
              <div className="modal-body">
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 14 }}>
                  If the problem has resurfaced, reopen this ticket for the assigned department.
                </p>
                <div className="form-group">
                  <label className="form-label" htmlFor="reopenReason">Reason for Reopening *</label>
                  <textarea
                    id="reopenReason"
                    className="form-textarea"
                    rows={4}
                    value={reopenReason}
                    onChange={(e) => setReopenReason(e.target.value)}
                    placeholder="Describe how or why the issue reoccurred..."
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowReopenModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? 'Reopening...' : 'Reopen Complaint'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplaintDetails;
