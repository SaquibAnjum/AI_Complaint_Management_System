import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { PlusCircle, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

const UserHeader = ({
  title = "Dashboard",
  subtitle = "Track your complaints and stay updated on their progress.",
  actions = null,
}) => {
  const { user } = useAuth();

  const userName = user?.name || 'Saquib Khan';
  const departmentOrRole = user?.department || 'Student / Resident';
  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="mb-6 pb-4 border-b border-slate-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Title & Subtitle */}
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {title}
            </h1>
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              User Portal
            </span>
          </div>
          {subtitle && (
            <p className="text-sm text-slate-500 mt-1">
              {subtitle}
            </p>
          )}
        </div>

        {/* Right Side: Profile & Actions */}
        <div className="flex items-center gap-3">
          {actions}

          {/* User Profile Pill */}
          <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
            <div className="w-9 h-9 rounded-full bg-slate-800 text-white font-bold text-xs flex items-center justify-center shadow-sm border border-slate-700">
              {initials}
            </div>
            <div className="text-left hidden md:block">
              <p className="text-xs font-semibold text-slate-900 leading-tight">
                {userName}
              </p>
              <p className="text-[11px] text-slate-500 font-medium truncate max-w-[140px]">
                {departmentOrRole}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserHeader;
