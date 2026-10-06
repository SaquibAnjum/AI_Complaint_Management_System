import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notificationsAPI } from '../services/api';
import campusBannerImg from '../assets/campus_banner.jpg';
import {
  Home,
  FileText,
  Users,
  PlusCircle,
  Building2,
  ChevronDown,
  User,
  LogOut,
  Bell,
  X,
  ExternalLink,
  ShieldCheck,
  Briefcase,
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const role = user?.role;

  const [unreadCount, setUnreadCount] = useState(0);
  const [showOrgMenu, setShowOrgMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const orgMenuRef = useRef(null);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await notificationsAPI.list();
        if (res.success && res.data) {
          setUnreadCount(res.data.unread_count || 0);
        }
      } catch (err) {
        // Fallback default
      }
    };
    fetchUnread();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (orgMenuRef.current && !orgMenuRef.current.contains(e.target)) {
        setShowOrgMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const userName = user?.name || (role === 'ADMIN' ? 'Admin' : 'User');
  const userEmail = user?.email || '';
  const orgName = user?.organization_name || user?.org?.name || 'ABC University';
  const roleSubtitle =
    role === 'ADMIN'
      ? 'Administrator'
      : user?.department
        ? user.department
        : 'Student / Member';

  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const isRouteActive = (basePath, exact = false) => {
    if (exact) {
      return location.pathname === basePath;
    }
    return location.pathname === basePath || location.pathname.startsWith(`${basePath}/`);
  };

  return (
    <>
      <aside className="sidebar no-scrollbar px-3 py-4 flex flex-col justify-between select-none">
        <div>
          {/* ── Brand Header ────────────────────────────────────────── */}
          <div className="flex items-center gap-3 px-2 pt-1 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#4361ee] via-[#5c3fe6] to-[#7b2cbf] flex items-center justify-center shadow-md shadow-indigo-500/25 shrink-0">
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none">
                <path
                  d="M19 4H5a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h2v3l4.5-3H19a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3z"
                  fill="white"
                />
                <circle cx="8" cy="11" r="1.3" fill="#583ee8" />
                <circle cx="12" cy="11" r="1.3" fill="#583ee8" />
                <circle cx="16" cy="11" r="1.3" fill="#583ee8" />
              </svg>
            </div>
            <div className="flex flex-col min-w-0">
              <h1 className="font-extrabold text-[16.5px] tracking-tight text-slate-900 leading-tight">
                AI Complaint Hub
              </h1>
            </div>
          </div>

          {/* ── Organization Card with Dropdown ────────────────────────── */}
          <div className="relative px-1 mb-4" ref={orgMenuRef}>
            <button
              type="button"
              onClick={() => setShowOrgMenu((prev) => !prev)}
              className="w-full bg-[#f1f4fd] hover:bg-[#eaf0fc] active:bg-[#e3ecfb] border border-[#e2e8f8] rounded-2xl p-2.5 flex items-center justify-between gap-2.5 transition-all text-left shadow-2xs group"
              title="Click to view organization details"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-[#e3eafd] border border-[#d5ddfb] flex items-center justify-center text-[#4361ee] shrink-0 group-hover:scale-105 transition-transform">
                  <Building2 size={18} strokeWidth={2.2} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-bold text-slate-900 leading-tight truncate">
                    {orgName}
                  </p>
                  <p className="text-[11.5px] text-slate-500 font-medium leading-tight truncate mt-0.5">
                    {roleSubtitle}
                  </p>
                </div>
              </div>
              <ChevronDown
                size={16}
                className={`text-slate-400 shrink-0 transition-transform duration-200 ${showOrgMenu ? 'rotate-180 text-indigo-600' : ''
                  }`}
              />
            </button>

            {/* Organization & Quick Actions Popover Menu */}
            {showOrgMenu && (
              <div className="absolute left-1 right-1 top-[54px] z-50 bg-white rounded-2xl shadow-xl border border-slate-200/80 p-2.5 space-y-1 animate-fade-in">
                <div className="px-2.5 py-2 border-b border-slate-100 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Active Workspace
                    </p>
                    <p className="text-xs font-bold text-slate-800 truncate">{orgName}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Live
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowOrgMenu(false);
                    setShowProfileModal(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors text-left"
                >
                  <User size={15} className="text-indigo-600" />
                  <span>My Profile & Details</span>
                </button>

                {role === 'ADMIN' && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowOrgMenu(false);
                      navigate('/admin/users');
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors text-left"
                  >
                    <Briefcase size={15} className="text-indigo-600" />
                    <span>Workspace Members</span>
                  </button>
                )}

                <div className="pt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setShowOrgMenu(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors text-left"
                  >
                    <LogOut size={15} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Navigation Items ────────────────────────────────────── */}
          <nav className="flex flex-col gap-1.5 px-1">
            {/* Organisation / Administrator Navigation */}
            {role === 'ADMIN' && (
              <>
                <NavLink
                  to="/admin/dashboard"
                  end
                  className={() =>
                    `nav-item ${isRouteActive('/admin/dashboard', true) ? 'active' : ''}`
                  }
                >
                  <Home size={19} strokeWidth={2} />
                  <span>Admin Overview</span>
                </NavLink>

                <NavLink
                  to="/admin/complaints"
                  className={() =>
                    `nav-item ${isRouteActive('/admin/complaints') ? 'active' : ''}`
                  }
                >
                  <FileText size={19} strokeWidth={2} />
                  <span>Complaint Management</span>
                </NavLink>

                <NavLink
                  to="/admin/users"
                  className={() =>
                    `nav-item ${isRouteActive('/admin/users') ? 'active' : ''}`
                  }
                >
                  <Users size={19} strokeWidth={2} />
                  <span>User Directory</span>
                </NavLink>
              </>
            )}

            {/* User Section Navigation */}
            {role === 'USER' && (
              <>
                <NavLink
                  to="/user/dashboard"
                  end
                  className={() =>
                    `nav-item ${isRouteActive('/user/dashboard', true) ? 'active' : ''}`
                  }
                >
                  <Home size={19} strokeWidth={2} />
                  <span>User Overview</span>
                </NavLink>

                <NavLink
                  to="/user/submit"
                  className={() =>
                    `nav-item ${isRouteActive('/user/submit') ? 'active' : ''}`
                  }
                >
                  <PlusCircle size={19} strokeWidth={2} />
                  <span>Submit Complaint</span>
                </NavLink>

                <NavLink
                  to="/user/complaints"
                  className={() =>
                    `nav-item ${isRouteActive('/user/complaints') ? 'active' : ''}`
                  }
                >
                  <FileText size={19} strokeWidth={2} />
                  <span>Complaint Management</span>
                </NavLink>
              </>
            )}
          </nav>
        </div>

        {/* ── Bottom Section: Modern Community Poster Card ───────────── */}
        <div className="px-1 pt-4 mt-auto">
          <div className="theme-poster rounded-3xl overflow-hidden border border-[#edf0f9] bg-gradient-to-b from-[#f3f0ff] via-[#edf2fe] to-[#e4eaff] relative shadow-xs">
            {/* Ambient background glows */}
            <div className="absolute top-0 right-0 w-36 h-36 bg-purple-200/50 rounded-full blur-2xl -mr-12 -mt-12 pointer-events-none" />
            <div className="absolute top-16 left-0 w-24 h-24 bg-indigo-200/40 rounded-full blur-xl -ml-8 pointer-events-none" />

            {/* Poster Header & Typography */}
            <div className="p-5 pb-0 relative z-10">
              <h2 className="font-extrabold text-[21px] leading-[1.12] text-slate-900 tracking-tight">
                Building
                <br />
                Better
                <br />
                Communities
                <br />
                <span className="text-[#523bf5] inline-block relative mt-0.5">
                  Together
                  <span className="block h-[3.5px] w-12 bg-[#523bf5] rounded-full mt-1.5" />
                </span>
              </h2>

              <p className="mt-3.5 text-[12px] text-slate-500 font-medium leading-relaxed max-w-[195px]">
                A cleaner, safer and more responsive campus.
              </p>
            </div>

            {/* Campus Architectural Photograph */}
            <div className="mt-3.5 w-full h-[140px] overflow-hidden rounded-b-3xl">
              <img
                src={campusBannerImg}
                alt="Campus community building"
                className="w-full h-full object-cover object-center transform hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar (Shown on small screens for User) */}
      {role === 'USER' && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 z-40 px-4 py-2 flex items-center justify-around shadow-lg">
          <NavLink
            to="/user/dashboard"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 text-[10px] font-medium transition-colors ${isActive ? 'text-indigo-600 font-semibold' : 'text-slate-500 hover:text-slate-800'
              }`
            }
          >
            <Home size={18} />
            <span>Overview</span>
          </NavLink>

          <NavLink
            to="/user/submit"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 text-[10px] font-medium transition-colors ${isActive ? 'text-indigo-600 font-semibold' : 'text-slate-500 hover:text-slate-800'
              }`
            }
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-center -mt-3 shadow-md shadow-indigo-500/30">
              <PlusCircle size={18} />
            </div>
            <span>Submit</span>
          </NavLink>

          <NavLink
            to="/user/complaints"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 text-[10px] font-medium transition-colors ${isActive ? 'text-indigo-600 font-semibold' : 'text-slate-500 hover:text-slate-800'
              }`
            }
          >
            <FileText size={18} />
            <span>Complaints</span>
          </NavLink>
        </div>
      )}

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-200" />
                <h3 className="text-sm font-bold">User Profile</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-bold text-base flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/20">
                  {initials}
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-slate-900 truncate">{userName}</h4>
                  <p className="text-slate-500 truncate">{userEmail}</p>
                  <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {role === 'ADMIN' ? 'Administrator' : 'Verified Member'}
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-slate-600">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="font-semibold text-slate-500">Organization:</span>
                  <span className="font-bold text-slate-800">{orgName}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="font-semibold text-slate-500">Role:</span>
                  <span className="font-bold text-slate-800">{role}</span>
                </div>
                {user?.department && (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="font-semibold text-slate-500">Department:</span>
                    <span className="font-bold text-slate-800">{user.department}</span>
                  </div>
                )}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="font-semibold text-slate-500">Workspace Status:</span>
                  <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                    Active
                  </span>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-xl transition-all shadow-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
