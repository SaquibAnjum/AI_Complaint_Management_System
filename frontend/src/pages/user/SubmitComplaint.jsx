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
  {
    id: 'Academic',
    label: 'Academic',
    desc: 'Course schedules, grading queries, or faculty coordination',
  },
  {
    id: 'Fees',
    label: 'Fees',
    desc: 'Fee payments, refunds, or billing-related concerns',
  },
  {
    id: 'Hostel',
    label: 'Hostel',
    desc: 'Room maintenance, mess food, laundry, or sanitation',
  },
  {
    id: 'Library',
    label: 'Library',
    desc: 'Library access, books, study areas, or library facilities',
  },
  {
    id: 'Transport',
    label: 'Transport',
    desc: 'Campus shuttle, parking, or vehicle access',
  },
  {
    id: 'Infrastructure',
    label: 'Infrastructure',
    desc: 'Electricity, water supply, AC, furniture, or fixtures',
  },
  {
    id: 'IT Support',
    label: 'IT Support',
    desc: 'Software, Wi-Fi, lab equipment, or portal errors',
  },
  {
    id: 'Security',
    label: 'Security',
    desc: 'Lost property, access badges, or campus safety concerns',
  },
  {
    id: 'Cleanliness',
    label: 'Cleanliness',
    desc: 'Waste management, sanitation, or cleanliness concerns',
  },
  {
    id: 'Other',
    label: 'Other',
    desc: 'Any general concern not covered above',
  },
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
    const validTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
    ];

    if (!validTypes.includes(file.type)) {
      addToast(
        'Please upload a valid image (JPG, PNG) or PDF document.',
        'warning'
      );
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

        addToast(
          'Complaint submitted successfully! Ticket queued.',
          'success'
        );

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
      addToast(
        'An error occurred while submitting your complaint.',
        'error'
      );
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
    <div className="page-container py-6 max-w-5xl mx-auto space-y-7">
      <UserHeader
        title="Submit a Complaint"
        subtitle="Tell us what happened and provide the details needed to resolve your issue."
        actions={
          <Link
            to="/user/complaints"
            className="w-full sm:w-auto inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50/40 hover:text-indigo-700 transition-all shadow-sm"
          >
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            <span>My Complaints</span>
          </Link>
        }
      />

      {submittedTicket ? (
        <div className="bg-white border border-emerald-200/80 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-2xs">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Complaint Registered Successfully
            </h2>

            <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
              Your ticket{' '}
              <span className="font-semibold text-slate-900 font-mono">
                #{submittedTicket.ticket_id || `CMP-${submittedTicket.id}`}
              </span>{' '}
              has been registered and assigned to the departmental queue.
            </p>
          </div>

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
                <span className="font-semibold text-slate-500">
                  Complaint Title:
                </span>
                <p className="font-medium text-slate-900 mt-0.5">
                  {submittedTicket.title}
                </p>
              </div>

              <div>
                <span className="font-semibold text-slate-500">
                  Assigned Department:
                </span>
                <p className="font-medium text-slate-900 mt-0.5">
                  {submittedTicket.category}
                </p>
              </div>

              <div>
                <span className="font-semibold text-slate-500">
                  Location:
                </span>
                <p className="font-medium text-slate-900 mt-0.5">
                  {submittedTicket.location || 'Campus Facilities'}
                </p>
              </div>

              <div>
                <span className="font-semibold text-slate-500">
                  Date Filed:
                </span>
                <p className="font-medium text-slate-900 mt-0.5">
                  {new Date(
                    submittedTicket.created_at
                  ).toLocaleString()}
                </p>
              </div>
            </div>

            {submittedTicket.attachment_name && (
              <div className="pt-3 border-t border-slate-200 flex items-center gap-2 text-xs text-slate-600">
                <File className="w-4 h-4 text-slate-400" />
                <span>
                  Attachment:{' '}
                  <strong>{submittedTicket.attachment_name}</strong>
                </span>
              </div>
            )}
          </div>

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
        <form onSubmit={handleSubmit} className="space-y-7">
          <div className="relative bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-7 shadow-sm shadow-slate-200/50 space-y-7 overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-400" />

            <div className="space-y-2.5">
              <label
                htmlFor="complaint-title"
                className="block text-[11px] font-bold text-slate-700 uppercase tracking-[0.08em]"
              >
                1. Complaint Title{' '}
                <span className="text-rose-500">*</span>
              </label>

              <input
                id="complaint-title"
                type="text"
                value={formData.title}
                onChange={(e) =>
                  handleChange('title', e.target.value)
                }
                placeholder="Briefly describe your issue (e.g. Water leakage in Hostel Block B - Room 304)"
                className={`w-full text-sm px-4 py-3 rounded-xl border ${fieldErrors.title
                    ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/20'
                    : 'border-slate-200 focus:border-indigo-500 bg-slate-50/40'
                  } text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all`}
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

            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-[0.08em]">
                2. Category <span className="text-rose-500">*</span>
              </label>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {CATEGORIES.map((cat) => {
                  const isSelected = formData.category === cat.id;

                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() =>
                        handleChange('category', cat.id)
                      }
                      className={`p-3.5 rounded-xl border text-left transition-all duration-200 ${isSelected
                          ? 'border-indigo-500 bg-indigo-50 shadow-sm ring-2 ring-indigo-500/10'
                          : 'border-slate-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/30 hover:-translate-y-0.5 hover:shadow-sm'
                        }`}
                    >
                      <span
                        className={`block text-sm font-bold ${isSelected
                            ? 'text-indigo-700'
                            : 'text-slate-800'
                          }`}
                      >
                        {cat.label}
                      </span>

                      <span className="block text-[10px] leading-relaxed text-slate-500 mt-1 line-clamp-2">
                        {cat.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-[0.08em]">
                  3. Urgency / Priority Level{' '}
                  <span className="text-rose-500">*</span>
                </label>

                <span className="text-[11px] text-slate-500">
                  Staff reviews will confirm the final SLA priority.
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {PRIORITIES.map((pri) => {
                  const isSelected = formData.priority === pri.id;

                  return (
                    <button
                      key={pri.id}
                      type="button"
                      onClick={() =>
                        handleChange('priority', pri.id)
                      }
                      className={`p-3 rounded-xl border text-left transition-all duration-200 ${isSelected
                          ? 'border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-600'
                          : 'border-slate-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/30 hover:-translate-y-0.5 hover:shadow-sm'
                        }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`text-sm font-bold ${isSelected
                              ? 'text-indigo-700'
                              : 'text-slate-800'
                            }`}
                        >
                          {pri.label}
                        </span>

                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${pri.badgeClass}`}
                        >
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

            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="complaint-desc"
                  className="block text-[11px] font-bold text-slate-700 uppercase tracking-[0.08em]"
                >
                  4. Detailed Description{' '}
                  <span className="text-rose-500">*</span>
                </label>

                <span
                  className={`text-xs font-mono ${formData.description.length > MAX_CHARS
                      ? 'text-rose-600 font-semibold'
                      : 'text-slate-500'
                    }`}
                >
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
                className={`w-full text-sm p-4 rounded-xl border ${fieldErrors.description
                    ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/20'
                    : 'border-slate-200 focus:border-indigo-500 bg-slate-50/40'
                  } text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all leading-relaxed min-h-[150px]`}
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2.5">
                <label
                  htmlFor="complaint-loc"
                  className="block text-[11px] font-bold text-slate-700 uppercase tracking-[0.08em]"
                >
                  5. Location / Department
                </label>

                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />

                  <input
                    id="complaint-loc"
                    type="text"
                    value={formData.location}
                    onChange={(e) =>
                      handleChange('location', e.target.value)
                    }
                    placeholder="e.g. Hostel B Room 304, or CSE Dept Lab 2"
                    className="w-full text-sm pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/40 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2.5">
                <label
                  htmlFor="complaint-extra"
                  className="block text-[11px] font-bold text-slate-700 uppercase tracking-[0.08em]"
                >
                  6. Additional Information (Optional)
                </label>

                <div className="relative">
                  <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />

                  <input
                    id="complaint-extra"
                    type="text"
                    value={formData.additionalInfo}
                    onChange={(e) =>
                      handleChange('additionalInfo', e.target.value)
                    }
                    placeholder="Preferred contact hours (e.g. Weekdays 2 PM - 5 PM)"
                    className="w-full text-sm pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/40 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-[0.08em]">
                7. Attachment (Photos or Documents)
              </label>

              {attachedFile ? (
                <div className="flex items-center justify-between p-4 rounded-xl border border-indigo-200/80 bg-indigo-50/50 shadow-sm">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600/10 text-indigo-600 flex items-center justify-center shrink-0">
                      <File className="w-4 h-4" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 truncate">
                        {attachedFile.name}
                      </p>

                      <p className="text-[10px] text-slate-500">
                        {(attachedFile.size / (1024 * 1024)).toFixed(2)} MB
                        {' • '}
                        Ready to upload
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
                  className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 ${isDragging
                      ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                      : 'border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/20 bg-slate-50/60'
                    }`}
                >
                  <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />

                  <p className="text-sm font-medium text-slate-700">
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

          <div className="flex items-center justify-between pt-3 border-t border-slate-200/80">
            <button
              type="button"
              onClick={() => navigate('/user/dashboard')}
              className="px-4 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50 rounded-xl transition-all shadow-md shadow-indigo-200 hover:shadow-lg hover:shadow-indigo-200/70 hover:-translate-y-0.5"
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