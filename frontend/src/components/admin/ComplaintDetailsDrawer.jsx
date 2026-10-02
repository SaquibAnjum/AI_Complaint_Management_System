import React, { useState, useEffect } from 'react';
import {
  X,
  Clock,
  User,
  MapPin,
  Calendar,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Send,
  Copy,
  Check,
  ShieldCheck,
  History,
} from 'lucide-react';
import { PRIORITY_STYLES, STATUS_STYLES } from './ComplaintTable';

const ComplaintDetailsDrawer = ({
  complaint,
  isOpen,
  onClose,
  onUpdateComplaint,
}) => {
  const [selectedStatus, setSelectedStatus] = useState(complaint?.status || 'PENDING');
  const [selectedPriority, setSelectedPriority] = useState(complaint?.priority || 'MEDIUM');
  const [adminNote, setAdminNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'timeline' | 'ai'

  useEffect(() => {
    if (complaint) {
      setSelectedStatus(complaint.status || 'PENDING');
      setSelectedPriority(complaint.priority || 'MEDIUM');
      setAdminNote('');
    }
  }, [complaint]);

  if (!isOpen || !complaint) return null;

  const handleCopyId = () => {
    const id = complaint.ticket_id || `CMP-${complaint.id}`;
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    const updatedData = {
      ...complaint,
      status: selectedStatus,
      priority: selectedPriority,
      updated_at: new Date().toISOString(),
      admin_note: adminNote,
    };

    try {
      if (onUpdateComplaint) {
        await onUpdateComplaint(updatedData);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const priorityStyle = PRIORITY_STYLES[complaint.priority] || PRIORITY_STYLES.LOW;
  const statusStyle = STATUS_STYLES[complaint.status] || 'bg-slate-50 text-slate-700 border-slate-200';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-200"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-2xl bg-white shadow-2xl flex flex-col border-l border-slate-200">
          {/* Drawer Header */}
          <div className="p-5 border-b border-slate-200 bg-slate-50/70 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-mono text-xs font-semibold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
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
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${priorityStyle.badge}`}
                >
                  {complaint.priority || 'MEDIUM'}
                </span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${statusStyle}`}
                >
                  {(complaint.status || 'PENDING').replace('_', ' ')}
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

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 px-5 bg-white text-xs font-medium text-slate-600 gap-6">
            <button
              onClick={() => setActiveTab('details')}
              className={`py-3 border-b-2 transition-colors ${activeTab === 'details'
                  ? 'border-indigo-600 text-indigo-600 font-semibold'
                  : 'border-transparent hover:text-slate-900'
                }`}
            >
              Overview & Manage
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${activeTab === 'timeline'
                  ? 'border-indigo-600 text-indigo-600 font-semibold'
                  : 'border-transparent hover:text-slate-900'
                }`}
            >
              <History className="w-3.5 h-3.5" />
              Activity Audit ({complaint.timeline?.length || 3})
            </button>
            {complaint.ai_sentiment && (
              <button
                onClick={() => setActiveTab('ai')}
                className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${activeTab === 'ai'
                    ? 'border-indigo-600 text-indigo-600 font-semibold'
                    : 'border-transparent hover:text-slate-900'
                  }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                AI Triage Advisory
              </button>
            )}
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {activeTab === 'details' && (
              <>
                {/* Description Box */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Complaint Description
                  </h4>
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 text-sm text-slate-800 leading-relaxed">
                    {complaint.description}
                  </div>
                </div>

                {/* Submitter & Location Meta */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-white rounded-lg border border-slate-200 p-3.5">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Submitter Details
                    </p>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-700">
                        {complaint.user_name
                          ? complaint.user_name.substring(0, 2).toUpperCase()
                          : 'U'}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {complaint.user_name || 'Portal User'}
                        </p>
                        <p className="text-xs text-slate-500">
                          {complaint.user_email || 'No email provided'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg border border-slate-200 p-3.5">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Location & Categorization
                    </p>
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{complaint.location || 'Institutional Campus'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <span>Category:</span>
                        <strong className="text-slate-800 font-medium">
                          {complaint.category || 'General'}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Management Form */}
                <form
                  onSubmit={handleSave}
                  className="bg-slate-50/70 rounded-xl border border-slate-200 p-4 space-y-4"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-indigo-600" />
                      Administrative Controls
                    </h4>
                    <span className="text-[11px] text-slate-400">
                      Changes log to ticket audit
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Status Select */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Lifecycle Status
                      </label>
                      <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                      >
                        <option value="PENDING">Pending</option>
                        <option value="UNDER_REVIEW">Under Review</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="RESOLVED">Resolved</option>
                        <option value="CONFIRMED">Confirmed</option>
                      </select>
                    </div>

                    {/* Priority Select */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Severity / Priority
                      </label>
                      <select
                        value={selectedPriority}
                        onChange={(e) => setSelectedPriority(e.target.value)}
                        className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                      >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="CRITICAL">Critical</option>
                      </select>
                    </div>
                  </div>

                  {/* Internal Admin Note */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Resolution / Audit Note (Optional)
                    </label>
                    <textarea
                      rows={3}
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      placeholder="Add an internal log entry or specific resolution instructions..."
                      className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                    />
                  </div>

                  {/* Save button */}
                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200/50 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                    >
                      {isSaving ? 'Updating...' : 'Save & Update Ticket'}
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* Timeline Tab */}
            {activeTab === 'timeline' && (
              <div className="space-y-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Complete Event History
                </h4>
                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {complaint.timeline && complaint.timeline.length > 0 ? (
                    complaint.timeline.map((item, idx) => (
                      <div key={idx} className="relative group">
                        <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-white border-2 border-indigo-600" />
                        <div className="text-xs">
                          <span className="font-semibold text-slate-900">{item.action}</span>
                          <span className="text-slate-400 text-[11px] ml-2">{item.time}</span>
                        </div>
                        {item.note && (
                          <p className="text-xs text-slate-600 mt-1 bg-slate-50 p-2 rounded border border-slate-100">
                            {item.note}
                          </p>
                        )}
                        <p className="text-[11px] text-slate-400 mt-0.5">By: {item.by}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-400">
                      Standard lifecycle created at {complaint.created_at}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* AI Advisory Tab */}
            {activeTab === 'ai' && (
              <div className="space-y-4">
                <div className="bg-indigo-50/50 rounded-xl border border-indigo-100 p-4">
                  <div className="flex items-center gap-2 text-indigo-900 font-semibold text-sm mb-1">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    Automated Triage Analysis
                  </div>
                  <p className="text-xs text-indigo-700">
                    Calculated based on complaint NLP content and past resolution records.
                  </p>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="font-semibold text-slate-700">AI Priority Score:</span>{' '}
                    <span className="font-mono font-bold text-slate-900">
                      {complaint.ai_priority || complaint.priority || 'MEDIUM'}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="font-semibold text-slate-700">Recommended Department:</span>{' '}
                    <span className="font-medium text-slate-900">
                      {complaint.ai_department || complaint.department || 'Administration'}
                    </span>
                  </div>
                  {complaint.ai_summary && (
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="font-semibold text-slate-700">AI Summary:</span>
                      <p className="mt-1 text-slate-600">{complaint.ai_summary}</p>
                    </div>
                  )}
                  {complaint.ai_reasoning && (
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="font-semibold text-slate-700">Analysis Reasoning:</span>
                      <p className="mt-1 text-slate-600">{complaint.ai_reasoning}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplaintDetailsDrawer;
