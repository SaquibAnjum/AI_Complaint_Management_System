import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  MapPin,
  Clock,
  User,
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Star,
  FileText,
  Paperclip,
  History,
  ShieldCheck,
} from 'lucide-react';

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

const UserComplaintDrawer = ({
  complaint,
  isOpen,
  onClose,
  onConfirmResolution,
  onReopenComplaint,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'timeline' | 'feedback'
  const [rating, setRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [reopenReason, setReopenReason] = useState('');
  const [showReopenBox, setShowReopenBox] = useState(false);

  if (!isOpen || !complaint) return null;

  const handleCopyId = () => {
    const id = complaint.ticket_id || `CMP-${complaint.id}`;
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFeedbackSubmit = (e) => {
    e.preventDefault();
    if (onConfirmResolution) {
      onConfirmResolution(complaint, { rating, comment: feedbackComment });
    }
  };

  const handleReopenSubmit = (e) => {
    e.preventDefault();
    if (onReopenComplaint && reopenReason.trim()) {
      onReopenComplaint(complaint, reopenReason.trim());
      setReopenReason('');
      setShowReopenBox(false);
    }
  };

  const priorityStyle =
    PRIORITY_BADGES[complaint.priority] || PRIORITY_BADGES.MEDIUM;
  const statusStyle =
    STATUS_BADGES[complaint.status] || 'bg-slate-50 text-slate-700 border-slate-200';

  const isResolved = complaint.status === 'RESOLVED';
  const isConfirmed = complaint.status === 'CONFIRMED';
  const responses = complaint.responses || [];
  const timeline = complaint.timeline || [];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-200"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-screen max-w-2xl bg-white shadow-2xl flex flex-col border-l border-slate-200">
          {/* Drawer Header */}
          <div className="p-5 border-b border-slate-200 bg-slate-50/80 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-mono text-xs font-semibold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {complaint.ticket_id || `CMP-${complaint.id}`}
                </span>
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
                  title="Copy Ticket ID"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border ${priorityStyle}`}
                >
                  {complaint.priority}
                </span>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusStyle}`}
                >
                  {complaint.status.replace('_', ' ')}
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 leading-snug">
                {complaint.title}
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stepper Progress Indicator */}
          <div className="px-5 py-3 bg-slate-100/60 border-b border-slate-200 overflow-x-auto">
            <div className="flex items-center justify-between min-w-[320px] text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[11px]">
                  ✓
                </span>
                <span>Submitted</span>
              </div>
              <div className={`h-0.5 flex-1 mx-2 ${complaint.status !== 'PENDING' ? 'bg-indigo-600' : 'bg-slate-300'}`} />
              <div className={`flex items-center gap-1.5 ${complaint.status !== 'PENDING' ? 'font-semibold text-slate-900' : 'text-slate-400'}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${complaint.status !== 'PENDING' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                  {complaint.status === 'IN_PROGRESS' || isResolved || isConfirmed ? '✓' : '2'}
                </span>
                <span>In Progress</span>
              </div>
              <div className={`h-0.5 flex-1 mx-2 ${isResolved || isConfirmed ? 'bg-emerald-600' : 'bg-slate-300'}`} />
              <div className={`flex items-center gap-1.5 ${isResolved || isConfirmed ? 'font-semibold text-emerald-700' : 'text-slate-400'}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${isResolved || isConfirmed ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                  {isConfirmed ? '✓' : '3'}
                </span>
                <span>Resolved</span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-200 px-5 bg-white text-xs font-medium text-slate-600 gap-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-3 border-b-2 transition-colors ${
                activeTab === 'overview'
                  ? 'border-indigo-600 text-indigo-600 font-semibold'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              Overview & Details
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'timeline'
                  ? 'border-indigo-600 text-indigo-600 font-semibold'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Event Timeline ({timeline.length})</span>
            </button>
            {isResolved && (
              <button
                onClick={() => setActiveTab('feedback')}
                className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeTab === 'feedback'
                    ? 'border-indigo-600 text-indigo-600 font-semibold'
                    : 'border-transparent hover:text-slate-900'
                }`}
              >
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>Verification & Rating</span>
              </button>
            )}
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <>
                {/* Description */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Complaint Description
                  </h4>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                    {complaint.description}
                  </div>
                </div>

                {/* Location & Metadata Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2 text-xs">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Location & Categorization
                    </p>
                    <div className="flex items-start gap-1.5 text-slate-700">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="font-medium">
                        {complaint.location || 'Institutional Campus'}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-slate-500 text-[11px]">
                      <span>Category:</span>
                      <strong className="text-slate-800 font-semibold">
                        {complaint.category}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between text-slate-500 text-[11px]">
                      <span>Filed On:</span>
                      <span>{complaint.created_at ? new Date(complaint.created_at).toLocaleDateString() : 'Today'}</span>
                    </div>
                  </div>

                  {/* Assigned Staff Card */}
                  <div className="bg-white rounded-xl border border-slate-200 p-4 text-xs space-y-2">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Assigned Resolution Officer
                    </p>
                    {complaint.assigned_staff || complaint.staff_name ? (
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-xs flex items-center justify-center">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 text-xs">
                            {complaint.assigned_staff || complaint.staff_name}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {complaint.staff_department || complaint.department || 'Field Technician'}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-800 text-[11px]">
                        Currently in administrative queue awaiting technician assignment.
                      </div>
                    )}
                  </div>
                </div>

                {/* Attachment info if present */}
                {complaint.attachment_name && (
                  <div className="bg-slate-50 rounded-xl border border-slate-200 p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Paperclip className="w-4 h-4 text-slate-400" />
                      <span className="text-xs font-semibold text-slate-800">
                        {complaint.attachment_name}
                      </span>
                      {complaint.attachment_size && (
                        <span className="text-[11px] text-slate-400">
                          ({complaint.attachment_size})
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-medium">
                      Verified Attachment
                    </span>
                  </div>
                )}

                {/* Staff Responses / Remarks */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Technician Progress Updates ({responses.length})
                  </h4>
                  {responses.length > 0 ? (
                    <div className="space-y-2.5">
                      {responses.map((r, idx) => (
                        <div
                          key={idx}
                          className="bg-white rounded-xl border border-slate-200 p-4 text-xs shadow-2xs"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-900">
                                {r.author}
                              </span>
                              <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-medium border border-indigo-100">
                                {r.role || 'Staff'}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400">
                              {r.time}
                            </span>
                          </div>
                          <p className="text-slate-700 leading-relaxed whitespace-pre-wrap mt-1">
                            {r.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-400">
                      No remarks added yet. You will receive real-time notifications as technicians inspect and repair.
                    </div>
                  )}
                </div>

                {/* Resolution Confirmation Card (If Resolved) */}
                {isResolved && (
                  <div className="p-4 bg-emerald-50/80 rounded-xl border border-emerald-200 space-y-3">
                    <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <span>Technician Marked This Complaint as Resolved</span>
                    </div>
                    {complaint.resolution_summary && (
                      <p className="text-xs text-emerald-800 leading-relaxed bg-white p-3 rounded-lg border border-emerald-200">
                        {complaint.resolution_summary}
                      </p>
                    )}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setActiveTab('feedback')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-2xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Confirm & Rate Experience</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowReopenBox(!showReopenBox)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100/70 border border-rose-200 rounded-lg transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Issue Still Exists? Reopen</span>
                      </button>
                    </div>

                    {showReopenBox && (
                      <form onSubmit={handleReopenSubmit} className="pt-2 space-y-2">
                        <textarea
                          rows={2}
                          value={reopenReason}
                          onChange={(e) => setReopenReason(e.target.value)}
                          placeholder="Explain why this issue is not fully resolved..."
                          className="w-full text-xs bg-white border border-rose-300 rounded-lg p-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                          required
                        />
                        <button
                          type="submit"
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors"
                        >
                          Submit Reopen Request
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Timeline Tab */}
            {activeTab === 'timeline' && (
              <div className="space-y-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Complete Event History
                </h4>

                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {timeline.map((item, idx) => (
                    <div key={idx} className="relative">
                      <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-white border-2 border-indigo-600" />
                      <div className="text-xs">
                        <span className="font-semibold text-slate-900">
                          {item.action}
                        </span>
                        <span className="text-slate-400 text-[11px] ml-2">
                          {item.time}
                        </span>
                      </div>
                      {item.note && (
                        <p className="text-xs text-slate-600 mt-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-relaxed">
                          {item.note}
                        </p>
                      )}
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Actor: {item.by}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Feedback Tab */}
            {activeTab === 'feedback' && (
              <div className="space-y-4">
                <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                  <h4 className="text-sm font-bold text-indigo-900">
                    Verify Resolution & Rate Service
                  </h4>
                  <p className="text-xs text-indigo-700 mt-1">
                    Your feedback helps campus administration evaluate departmental performance and speed.
                  </p>
                </div>

                <form onSubmit={handleFeedbackSubmit} className="space-y-4 bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2">
                      How satisfied are you with the resolution?
                    </label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="p-1 hover:scale-110 transition-transform"
                        >
                          <Star
                            className={`w-6 h-6 ${
                              star <= rating
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-slate-200'
                            }`}
                          />
                        </button>
                      ))}
                      <span className="text-xs font-semibold text-slate-700 ml-2">
                        {rating} / 5 Stars
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Comments / Feedback (Optional)
                    </label>
                    <textarea
                      rows={3}
                      value={feedbackComment}
                      onChange={(e) => setFeedbackComment(e.target.value)}
                      placeholder="Was the technician courteous and prompt? Any lingering concerns?"
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-2xs"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm Resolution & Submit Feedback</span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserComplaintDrawer;
