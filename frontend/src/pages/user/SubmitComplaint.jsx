import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { complaintsAPI } from '../../services/api';
import { useToast } from '../../components/Toast';
import { useAuth } from '../../context/AuthContext';
import UserHeader from '../../components/user/UserHeader';
import {
  FileText,
  Sparkles,
  Send,
  UploadCloud,
  X,
  File,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Clock,
  MapPin,
  HelpCircle,
  ShieldAlert,
} from 'lucide-react';

const CATEGORIES = [
  { id: 'Technical Issue', label: 'Technical Issue', desc: 'Software, Wi-Fi, lab equipment, or portal errors' },
  { id: 'Infrastructure', label: 'Infrastructure', desc: 'Electricity, water supply, AC, furniture, or fixtures' },
  { id: 'Academic', label: 'Academic', desc: 'Course schedules, grading queries, or faculty coordination' },
  { id: 'Hostel', label: 'Hostel', desc: 'Room maintenance, mess food, laundry, or sanitation' },
  { id: 'Transport', label: 'Transport', desc: 'Campus shuttle, parking, or vehicle access' },
  { id: 'Security', label: 'Security', desc: 'Lost property, access badges, or campus safety concerns' },
  { id: 'Administration', label: 'Administration', desc: 'Fees, certificates, documents, or student affairs' },
  { id: 'Other', label: 'Other', desc: 'Any general concern not covered above' },
];

const PRIORITIES = [
  {
    id: 'LOW',
    label: 'Low Priority',
    desc: 'General inquiry or minor inconvenience that does not impact daily activities.',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
  },
  {
    id: 'MEDIUM',
    label: 'Medium Priority',
    desc: 'Routine issue that needs attention within standard operational timeframes.',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  {
    id: 'HIGH',
    label: 'High Priority',
    desc: 'Significant issue affecting multiple users or critical daily workflows.',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  {
    id: 'CRITICAL',
    label: 'Critical / Urgent',
    desc: 'Severe outage, immediate safety hazard, or emergency campus disruption.',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
  },
];

const SubmitComplaint = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    title: '',
    category: 'Infrastructure',
    priority: 'MEDIUM',
    description: '',
    location: '',
    additionalInfo: '',
  });

  const [attachedFile, setAttachedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const MAX_CHARS = 1000;

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      addToast('Please upload a valid image (JPG, PNG) or PDF document.', 'warning');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      addToast('File size exceeds the 10MB limit.', 'error');
      return;
    }
    setAttachedFile(file);
    addToast(`Attached: ${file.name}`, 'info');
  };

  const removeFile = () => {
    setAttachedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.title.trim()) {
      errors.title = 'Please provide a descriptive title for your complaint.';
    } else if (formData.title.trim().length < 5) {
      errors.title = 'Title must be at least 5 characters long.';
    }

    if (!formData.description.trim()) {
      errors.description = 'Please explain the issue in detail.';
    } else if (formData.description.trim().length < 15) {
      errors.description = 'Please provide at least 15 characters of context.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      addToast('Please resolve the highlighted form fields.', 'error');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        priority: formData.priority,
        location: formData.location.trim() || undefined,
      };

      try {
        const res = await complaintsAPI.create(payload);

        if (!res.success || !res.data?.complaint) {
          throw new Error(res.message || 'Complaint submission failed');
        }

        const createdTicket = res.data.complaint;

        addToast('Complaint submitted successfully! Ticket queued.', 'success');
        setSubmittedTicket(createdTicket);
      } catch (err) {
        console.error('Complaint submission failed:', err);

        addToast(
          err?.message || 'Failed to submit complaint. Please try again.',
          'error'
        );
      } finally {
        setSubmitting(false);
      }
    } catch (error) {
      addToast('An error occurred while submitting your complaint.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSubmittedTicket(null);
    setFormData({
      title: '',
      category: 'Infrastructure',
      priority: 'MEDIUM',
      description: '',
      location: '',
      additionalInfo: '',
    });
    setAttachedFile(null);
    setFieldErrors({});
  };

  return (
    <div className="page-container py-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <UserHeader
        title="Submit a Complaint"
        subtitle="Tell us what happened and provide the details needed to resolve your issue."
        actions={
          <Link
            to="/user/complaints"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            <span>My Complaints</span>
          </Link>
        }
      />

      {/* Success View */}
      {submittedTicket ? (
        <div className="bg-white border border-emerald-200 rounded-xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-2xs">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Complaint Registered Successfully
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
              Your ticket <span className="font-semibold text-slate-900 font-mono">#{submittedTicket.ticket_id || `CMP-${submittedTicket.id}`}</span> has been registered and assigned to the departmental queue.
            </p>
          </div>

          {/* Ticket Summary Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Ticket Reference
                </span>
                <p className="text-base font-bold text-slate-900 font-mono">
                  {submittedTicket.ticket_id || `CMP-${submittedTicket.id}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                  Status: Pending Review
                </span>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                  {submittedTicket.priority} Priority
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="font-semibold text-slate-500">Complaint Title:</span>
                <p className="font-medium text-slate-900 mt-0.5">{submittedTicket.title}</p>
              </div>
              <div>
                <span className="font-semibold text-slate-500">Assigned Department:</span>
                <p className="font-medium text-slate-900 mt-0.5">{submittedTicket.category}</p>
              </div>
              <div>
                <span className="font-semibold text-slate-500">Location:</span>
                <p className="font-medium text-slate-900 mt-0.5">{submittedTicket.location || 'Campus Facilities'}</p>
              </div>
              <div>
                <span className="font-semibold text-slate-500">Date Filed:</span>
                <p className="font-medium text-slate-900 mt-0.5">
                  {new Date(submittedTicket.created_at).toLocaleString()}
                </p>
              </div>
            </div>

            {submittedTicket.attachment_name && (
              <div className="pt-3 border-t border-slate-200 flex items-center gap-2 text-xs text-slate-600">
                <File className="w-4 h-4 text-slate-400" />
                <span>Attachment: <strong>{submittedTicket.attachment_name}</strong></span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/user/complaints')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-2xs"
            >
              <span>Track in My Complaints</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors shadow-2xs"
            >
              <span>Submit Another Complaint</span>
            </button>
          </div>
        </div>
      ) : (
        /* Form View */
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-7 shadow-xs space-y-6">
            {/* 1. Complaint Title */}
            <div className="space-y-1.5">
              <label htmlFor="complaint-title" className="block text-xs font-semibold text-slate-900 uppercase tracking-wider">
                1. Complaint Title <span className="text-rose-500">*</span>
              </label>
              <input
                id="complaint-title"
                type="text"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="Briefly describe your issue (e.g. Water leakage in Hostel Block B - Room 304)"
                className={`w-full text-sm px-3.5 py-2.5 rounded-lg border ${fieldErrors.title ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-300 focus:border-indigo-500'
                  } bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors`}
              />
              {fieldErrors.title ? (
                <p className="text-xs text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {fieldErrors.title}
                </p>
              ) : (
                <p className="text-[11px] text-slate-500">
                  Keep it clear and specific so the relevant department can prioritize it quickly.
                </p>
              )}
            </div>

            {/* 2. Category Selection */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-900 uppercase tracking-wider">
                2. Category <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {CATEGORIES.map((cat) => {
                  const isSelected = formData.category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleChange('category', cat.id)}
                      className={`p-3 rounded-lg border text-left transition-all ${isSelected
                        ? 'border-indigo-600 bg-indigo-50/60 ring-1 ring-indigo-600'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                        }`}
                    >
                      <span className={`block text-xs font-semibold ${isSelected ? 'text-indigo-900' : 'text-slate-800'}`}>
                        {cat.label}
                      </span>
                      <span className="block text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                        {cat.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Priority Level with explanations */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-900 uppercase tracking-wider">
                  3. Urgency / Priority Level <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-slate-500">
                  Staff reviews will confirm the final SLA priority.
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {PRIORITIES.map((pri) => {
                  const isSelected = formData.priority === pri.id;
                  return (
                    <button
                      key={pri.id}
                      type="button"
                      onClick={() => handleChange('priority', pri.id)}
                      className={`p-3 rounded-lg border text-left transition-all ${isSelected
                        ? 'border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-600'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                        }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-semibold ${isSelected ? 'text-indigo-900' : 'text-slate-800'}`}>
                          {pri.label}
                        </span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${pri.badgeClass}`}>
                          {pri.id}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-snug">
                        {pri.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Description Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="complaint-desc" className="block text-xs font-semibold text-slate-900 uppercase tracking-wider">
                  4. Detailed Description <span className="text-rose-500">*</span>
                </label>
                <span className={`text-xs font-mono ${formData.description.length > MAX_CHARS ? 'text-rose-600 font-semibold' : 'text-slate-500'
                  }`}>
                  {formData.description.length} / {MAX_CHARS} characters
                </span>
              </div>
              <textarea
                id="complaint-desc"
                rows={5}
                value={formData.description}
                onChange={(e) => {
                  if (e.target.value.length <= MAX_CHARS) {
                    handleChange('description', e.target.value);
                  }
                }}
                placeholder="Explain what happened in as much detail as possible. Include exact room number, floor, when the issue started, and any immediate disruption caused..."
                className={`w-full text-sm p-3.5 rounded-lg border ${fieldErrors.description ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-300 focus:border-indigo-500'
                  } bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors leading-relaxed`}
              />
              {fieldErrors.description ? (
                <p className="text-xs text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {fieldErrors.description}
                </p>
              ) : (
                <p className="text-[11px] text-slate-500">
                  Helpful guidance: Detailed descriptions reduce follow-up questions and allow technicians to bring correct replacement tools.
                </p>
              )}
            </div>

            {/* 5. Location / Department */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="complaint-loc" className="block text-xs font-semibold text-slate-900 uppercase tracking-wider">
                  5. Location / Department
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    id="complaint-loc"
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleChange('location', e.target.value)}
                    placeholder="e.g. Hostel B Room 304, or CSE Dept Lab 2"
                    className="w-full text-sm pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              {/* 6. Optional Additional Information */}
              <div className="space-y-1.5">
                <label htmlFor="complaint-extra" className="block text-xs font-semibold text-slate-900 uppercase tracking-wider">
                  6. Additional Information (Optional)
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    id="complaint-extra"
                    type="text"
                    value={formData.additionalInfo}
                    onChange={(e) => handleChange('additionalInfo', e.target.value)}
                    placeholder="Preferred contact hours (e.g. Weekdays 2 PM - 5 PM)"
                    className="w-full text-sm pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* 7. Attachment (File Upload Area) */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-900 uppercase tracking-wider">
                7. Attachment (Photos or Documents)
              </label>

              {attachedFile ? (
                <div className="flex items-center justify-between p-3.5 rounded-lg border border-indigo-200 bg-indigo-50/40">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600/10 text-indigo-600 flex items-center justify-center shrink-0">
                      <File className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 truncate">
                        {attachedFile.name}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {(attachedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to upload
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={removeFile}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                    title="Remove file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleFileDrop}
                  className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${isDragging
                    ? 'border-indigo-500 bg-indigo-50/50'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                    }`}
                >
                  <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-medium text-slate-700">
                    Drag and drop a photo or document here, or{' '}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-indigo-600 font-semibold hover:underline"
                    >
                      browse files
                    </button>
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Supports JPG, PNG, WEBP or PDF (Maximum 10 MB)
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileSelect}
                    accept=".jpg,.jpeg,.png,.webp,.pdf"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => navigate('/user/dashboard')}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg transition-colors shadow-2xs"
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Submitting Complaint...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Complaint</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default SubmitComplaint;
