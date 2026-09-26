import React, { useState } from 'react';
import {
  User,
  Mail,
  Phone,
  Shield,
  FileText,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle,
  XCircle,
} from 'lucide-react';

const ROLE_BADGES = {
  ADMIN: 'bg-rose-50 text-rose-700 border-rose-200',
  STAFF: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  USER: 'bg-slate-50 text-slate-700 border-slate-200',
};

const UserTable = ({
  users = [],
  onSelectUser,
  onToggleStatus,
  pageSize = 10,
}) => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(users.length / pageSize) || 1;
  const paginatedUsers = users.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500 select-none">
              <th className="py-3.5 px-4">User</th>
              <th className="py-3.5 px-4">Contact</th>
              <th className="py-3.5 px-4">Location / Dept</th>
              <th className="py-3.5 px-4">Role</th>
              <th className="py-3.5 px-4">Complaints</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {paginatedUsers.map((u) => {
              const roleBadge = ROLE_BADGES[u.role] || ROLE_BADGES.USER;
              const isActive = u.status === 'ACTIVE';

              return (
                <tr
                  key={u.id}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                  onClick={() => onSelectUser && onSelectUser(u)}
                >
                  {/* User Profile */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center">
                        {u.name ? u.name.substring(0, 2).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 leading-snug">
                          {u.name}
                        </div>
                        <div className="text-xs text-slate-400">
                          ID: #{u.id} • Joined {u.joined_date || '2025'}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Contact */}
                  <td className="py-3 px-4 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate max-w-[180px]">{u.email}</span>
                    </div>
                    {u.phone && (
                      <div className="flex items-center gap-1.5 text-slate-500 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{u.phone}</span>
                      </div>
                    )}
                  </td>

                  {/* Location / Dept */}
                  <td className="py-3 px-4 text-xs text-slate-700">
                    <span className="font-medium text-slate-800">
                      {u.department || 'General Campus'}
                    </span>
                    {u.room_or_hostel && (
                      <span className="text-slate-400 block text-[11px]">
                        {u.room_or_hostel}
                      </span>
                    )}
                  </td>

                  {/* Role */}
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${roleBadge}`}
                    >
                      {u.role}
                    </span>
                  </td>

                  {/* Complaints Stats */}
                  <td className="py-3 px-4 text-xs">
                    <div className="flex items-center gap-1.5 font-medium text-slate-800">
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      <span>{u.complaints_count || 0} total</span>
                    </div>
                    {u.active_complaints > 0 ? (
                      <span className="text-[11px] text-amber-600 font-medium">
                        {u.active_complaints} in progress
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400">0 active</span>
                    )}
                  </td>

                  {/* Account Status */}
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {isActive ? (
                        <CheckCircle className="w-3 h-3 text-emerald-500" />
                      ) : (
                        <XCircle className="w-3 h-3 text-rose-500" />
                      )}
                      {u.status || 'ACTIVE'}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => onSelectUser && onSelectUser(u)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 rounded border border-slate-200 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Profile</span>
                      </button>

                      {onToggleStatus && u.role !== 'ADMIN' && (
                        <button
                          type="button"
                          onClick={() => onToggleStatus(u)}
                          className={`px-2.5 py-1 text-xs font-medium rounded border transition-colors ${
                            isActive
                              ? 'text-rose-700 hover:bg-rose-50 border-slate-200 hover:border-rose-200'
                              : 'text-emerald-700 hover:bg-emerald-50 border-slate-200 hover:border-emerald-200'
                          }`}
                        >
                          {isActive ? 'Suspend' : 'Activate'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-slate-50/70 border-t border-slate-200 text-xs text-slate-500">
          <div>
            Showing <span className="font-semibold text-slate-800">{paginatedUsers.length}</span> of{' '}
            <span className="font-semibold text-slate-800">{users.length}</span> members
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserTable;
