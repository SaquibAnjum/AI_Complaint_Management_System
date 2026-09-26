import React from 'react';
import {
  X,
  Mail,
  Phone,
  MapPin,
  Calendar,
  FileText,
  Shield,
  ExternalLink,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UserDetailsDrawer = ({
  user,
  isOpen,
  onClose,
  complaints = [],
  onToggleStatus,
}) => {
  const navigate = useNavigate();
  if (!isOpen || !user) return null;

  // Filter complaints submitted by this user
  const userComplaints = complaints.filter(
    (c) => c.user_id === user.id || c.user_email === user.email
  );

  const isActive = user.status === 'ACTIVE';

  const handleViewAllComplaints = () => {
    onClose();
    navigate(`/admin/complaints?search=${encodeURIComponent(user.email)}`);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-200"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-slate-200">
          {/* Header */}
          <div className="p-5 border-b border-slate-200 bg-slate-50/70 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-slate-200 text-slate-700 font-bold text-base flex items-center justify-center border border-slate-300">
                {user.name ? user.name.substring(0, 2).toUpperCase() : 'U'}
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 leading-snug">
                  {user.name}
                </h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-slate-500 font-medium">
                    {user.role}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                      isActive ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {isActive ? (
                      <CheckCircle className="w-3 h-3" />
                    ) : (
                      <XCircle className="w-3 h-3" />
                    )}
                    {user.status || 'ACTIVE'}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* Contact Details */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                Account Information
              </h4>
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" /> Email:
                  </span>
                  <span className="font-semibold text-slate-900">{user.email}</span>
                </div>
                {user.phone && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" /> Phone:
                    </span>
                    <span className="font-semibold text-slate-900">{user.phone}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" /> Department:
                  </span>
                  <span className="font-semibold text-slate-900">
                    {user.department || 'Campus'}
                  </span>
                </div>
                {user.room_or_hostel && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Hostel/Room:</span>
                    <span className="font-semibold text-slate-900">
                      {user.room_or_hostel}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" /> Registered:
                  </span>
                  <span className="text-slate-700">
                    {user.joined_date || 'March 2025'}
                  </span>
                </div>
              </div>
            </div>

            {/* Complaints Activity */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Ticket Activity ({userComplaints.length})
                </h4>
                {userComplaints.length > 0 && (
                  <button
                    onClick={handleViewAllComplaints}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    View in table <ExternalLink className="w-3 h-3" />
                  </button>
                )}
              </div>

              {userComplaints.length > 0 ? (
                <div className="space-y-2">
                  {userComplaints.slice(0, 5).map((c) => (
                    <div
                      key={c.id || c.ticket_id}
                      className="p-3 bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition-colors text-xs"
                    >
                      <div className="flex items-center justify-between font-mono font-semibold text-slate-800 mb-1">
                        <span>{c.ticket_id || `CMP-${c.id}`}</span>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                          {c.status?.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-slate-700 font-medium truncate">{c.title}</p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Priority: <strong>{c.priority}</strong> • Category: {c.category}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-slate-50 rounded-lg p-6 border border-slate-200 text-center text-xs text-slate-400">
                  No grievances submitted by this account yet.
                </div>
              )}
            </div>

            {/* Account Controls */}
            {user.role !== 'ADMIN' && onToggleStatus && (
              <div className="pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => onToggleStatus(user)}
                  className={`w-full py-2.5 px-4 text-xs font-semibold rounded-lg border transition-all ${
                    isActive
                      ? 'border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100/70'
                      : 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100/70'
                  }`}
                >
                  {isActive ? 'Suspend Account Access' : 'Reactivate User Account'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetailsDrawer;
