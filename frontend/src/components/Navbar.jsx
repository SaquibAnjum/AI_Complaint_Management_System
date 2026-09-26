import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notificationsAPI } from '../services/api';
import {
  Bell,
  Cpu,
  User,
  LogOut,
  CheckCheck,
  Shield,
  Wrench,
  GraduationCap,
  ChevronDown,
  Settings,
  UserCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  X,
  Mail,
  Calendar,
  KeyRound,
  Sliders,
  Flame,
  FileText,
  AlertCircle,
} from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Dropdown states
  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Modal states
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Notifications state
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifFilter, setNotifFilter] = useState('all'); // 'all', 'role', 'unread'

  // Settings state
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [browserSounds, setBrowserSounds] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [settingsSaved, setSettingsSaved] = useState(false);

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const res = await notificationsAPI.list();
      if (res.success && res.data) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unread_count || 0);
      }
    } catch (e) {
      console.warn('Could not fetch notifications:', e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 25000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdowns on outside click or escape key
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifs(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowNotifs(false);
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkOneRead = async (id, complaintId) => {
    try {
      await notificationsAPI.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      if (complaintId) {
        setShowNotifs(false);
        if (user?.role === 'ADMIN') {
          navigate(`/admin/complaints/${complaintId}`);
        } else if (user?.role === 'STAFF') {
          navigate(`/staff/complaints/${complaintId}`);
        } else {
          navigate(`/user/complaints/${complaintId}`);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getHomeLink = () => {
    if (user?.role === 'ADMIN') return '/admin/dashboard';
    if (user?.role === 'STAFF') return '/staff/dashboard';
    return '/user/dashboard';
  };

  // Role Configuration
  const getRoleConfig = () => {
    switch (user?.role) {
      case 'ADMIN':
        return {
          label: 'Administrator',
          badgeText: 'ADMIN',
          badgeColor: '#dc2626',
          badgeBg: '#fef2f2',
          badgeBorder: '#fecaca',
          gradientAvatar: 'linear-gradient(135deg, #ef4444, #dc2626)',
          icon: <Shield size={14} color="#dc2626" />,
          description: 'Full System Authority & Escalations',
          tabLabel: 'Admin Alerts',
        };
      case 'STAFF':
        return {
          label: 'Staff Technician',
          badgeText: 'STAFF',
          badgeColor: '#0284c7',
          badgeBg: '#f0f9ff',
          badgeBorder: '#bae6fd',
          gradientAvatar: 'linear-gradient(135deg, #0284c7, #4f46e5)',
          icon: <Wrench size={14} color="#0284c7" />,
          description: 'Field Inspection & Grievance Resolution',
          tabLabel: 'Work Queue',
        };
      default:
        return {
          label: 'Citizen / User',
          badgeText: 'USER',
          badgeColor: '#059669',
          badgeBg: '#ecfdf5',
          badgeBorder: '#a7f3d0',
          gradientAvatar: 'linear-gradient(135deg, #10b981, #0d9488)',
          icon: <GraduationCap size={14} color="#059669" />,
          description: 'Verified Complainant & Tracking',
          tabLabel: 'Ticket Status',
        };
    }
  };

  const roleConfig = getRoleConfig();

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const classifyNotification = (notif) => {
    const text = (notif.message || '').toLowerCase();
    const role = user?.role;

    if (role === 'ADMIN') {
      if (text.includes('unassigned') || text.includes('escalat') || text.includes('critical') || text.includes('sla')) {
        return {
          category: 'SLA Escalation',
          badgeBg: '#fef3c7',
          badgeColor: '#92400e',
          badgeBorder: '#fde68a',
          icon: <Flame size={15} color="#d97706" />,
        };
      }
      return {
        category: 'System Alert',
        badgeBg: '#fee2e2',
        badgeColor: '#991b1b',
        badgeBorder: '#fecaca',
        icon: <Shield size={15} color="#dc2626" />,
      };
    }

    if (role === 'STAFF') {
      if (text.includes('assigned') || text.includes('reopened')) {
        return {
          category: 'Assignment',
          badgeBg: '#e0f2fe',
          badgeColor: '#075985',
          badgeBorder: '#bae6fd',
          icon: <UserCheck size={15} color="#0284c7" />,
        };
      }
      return {
        category: 'Work Update',
        badgeBg: '#e0e7ff',
        badgeColor: '#3730a3',
        badgeBorder: '#c7d2fe',
        icon: <Clock size={15} color="#4f46e5" />,
      };
    }

    // USER
    if (text.includes('resolved') || text.includes('confirmed')) {
      return {
        category: 'Resolved',
        badgeBg: '#d1fae5',
        badgeColor: '#065f46',
        badgeBorder: '#a7f3d0',
        icon: <CheckCircle2 size={15} color="#059669" />,
      };
    }
    if (text.includes('in progress') || text.includes('assigned') || text.includes('status changed')) {
      return {
        category: 'Status Changed',
        badgeBg: '#e0e7ff',
        badgeColor: '#3730a3',
        badgeBorder: '#c7d2fe',
        icon: <Clock size={15} color="#4f46e5" />,
      };
    }
    return {
      category: 'Acknowledgment',
      badgeBg: '#f1f5f9',
      badgeColor: '#334155',
      badgeBorder: '#e2e8f0',
      icon: <FileText size={15} color="#64748b" />,
    };
  };

  const filteredNotifications = notifications.filter((n) => {
    if (notifFilter === 'unread') return !n.is_read;
    if (notifFilter === 'role') {
      const text = (n.message || '').toLowerCase();
      if (user?.role === 'ADMIN') {
        return text.includes('admin') || text.includes('alert') || text.includes('escalat') || text.includes('status') || text.includes('complaint');
      }
      if (user?.role === 'STAFF') {
        return text.includes('assigned') || text.includes('reopened') || text.includes('work') || text.includes('update');
      }
      return text.includes('submitted') || text.includes('status') || text.includes('resolved') || text.includes('assigned');
    }
    return true;
  });

  const formatRelativeTime = (isoString) => {
    if (!isoString) return '';
    const now = new Date();
    const date = new Date(isoString);
    const diffMin = Math.floor((now - date) / 60000);
    const diffHours = Math.floor(diffMin / 60);

    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <>
      <header className="navbar" style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', background: 'rgba(255, 255, 255, 0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 40 }}>
        
        {/* =========================================================
            1. BRANDING & LOGO
           ========================================================= */}
        <Link
          to={getHomeLink()}
          className="navbar-brand"
          style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', color: 'inherit' }}
        >
          {/* Modern Tech Icon with vibrant gradient */}
          <div className="navbar-logo-badge" style={{ width: 38, height: 38, borderRadius: 12, background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #ec4899 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', boxShadow: '0 4px 10px rgba(79, 70, 229, 0.28)', position: 'relative', flexShrink: 0 }}>
            <Cpu size={20} color="#ffffff" />
            <span className="navbar-live-dot" style={{ position: 'absolute', top: -2, right: -2, width: 9, height: 9, borderRadius: '50%', background: '#10b981', border: '2px solid #ffffff' }} />
          </div>

          <span className="navbar-brand-title" style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
            AI Complaint Hub
          </span>
        </Link>

        {/* =========================================================
            2. ACTIONS: NOTIFICATION CENTER & PROFILE MENU
           ========================================================= */}
        <div className="navbar-actions" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>

          {/* Role Indicator Pill */}
          <div
            className="navbar-role-pill"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 12px',
              borderRadius: 9999,
              fontSize: '0.75rem',
              fontWeight: 600,
              background: roleConfig.badgeBg,
              color: roleConfig.badgeColor,
              border: `1px solid ${roleConfig.badgeBorder}`,
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
            }}
          >
            {roleConfig.icon}
            <span>{roleConfig.label}</span>
          </div>

          {/* Vertical Divider */}
          <div style={{ height: 24, width: 1, background: '#e2e8f0' }} />

          {/* -------------------------------------------------------
              ROLE-BASED NOTIFICATION CENTER DROPDOWN
             ------------------------------------------------------- */}
          <div style={{ position: 'relative' }} ref={notifRef}>
            <button
              type="button"
              id="navbar-notification-btn"
              onClick={() => {
                setShowNotifs(!showNotifs);
                setShowProfileMenu(false);
              }}
              className={`navbar-icon-btn ${showNotifs ? 'active' : ''}`}
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                border: showNotifs ? '1px solid #c7d2fe' : '1px solid #e2e8f0',
                background: showNotifs ? '#eef2ff' : '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                position: 'relative',
                color: showNotifs ? '#4f46e5' : '#475569',
              }}
              title="Role-Based Notification Center"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span
                  className="notif-counter-badge"
                  style={{
                    position: 'absolute',
                    top: -4,
                    right: -4,
                    minWidth: 18,
                    height: 18,
                    padding: '0 4px',
                    borderRadius: 9999,
                    background: '#ef4444',
                    color: '#ffffff',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid #ffffff',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  }}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown Panel */}
            {showNotifs && (
              <div
                className="navbar-dropdown-panel notif-dropdown-card"
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 8px)',
                  width: 380,
                  maxWidth: '92vw',
                  background: 'rgba(255, 255, 255, 0.98)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid #e2e8f0',
                  borderRadius: 16,
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
                  zIndex: 50,
                  overflow: 'hidden',
                }}
              >
                {/* Header */}
                <div style={{ padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>Notifications</span>
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', padding: '2px 8px', borderRadius: 9999, background: roleConfig.badgeBg, color: roleConfig.badgeColor, border: `1px solid ${roleConfig.badgeBorder}` }}>
                      {roleConfig.badgeText}
                    </span>
                  </div>

                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      style={{ background: 'none', border: 'none', color: '#4f46e5', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}
                    >
                      <CheckCheck size={14} /> Mark all read
                    </button>
                  )}
                </div>

                {/* Filter Tabs */}
                <div style={{ display: 'flex', borderBottom: '1px solid #f1f5f9', background: '#ffffff', padding: '0 10px', gap: 4 }}>
                  <button
                    onClick={() => setNotifFilter('all')}
                    className={`notif-tab-item ${notifFilter === 'all' ? 'active' : ''}`}
                    style={{ padding: '8px 10px', fontSize: '0.75rem', fontWeight: 600, color: notifFilter === 'all' ? '#4f46e5' : '#64748b', background: 'none', border: 'none', borderBottom: notifFilter === 'all' ? '2px solid #4f46e5' : '2px solid transparent', cursor: 'pointer' }}
                  >
                    All ({notifications.length})
                  </button>
                  <button
                    onClick={() => setNotifFilter('role')}
                    className={`notif-tab-item ${notifFilter === 'role' ? 'active' : ''}`}
                    style={{ padding: '8px 10px', fontSize: '0.75rem', fontWeight: 600, color: notifFilter === 'role' ? '#4f46e5' : '#64748b', background: 'none', border: 'none', borderBottom: notifFilter === 'role' ? '2px solid #4f46e5' : '2px solid transparent', cursor: 'pointer' }}
                  >
                    {roleConfig.tabLabel}
                  </button>
                  <button
                    onClick={() => setNotifFilter('unread')}
                    className={`notif-tab-item ${notifFilter === 'unread' ? 'active' : ''}`}
                    style={{ padding: '8px 10px', fontSize: '0.75rem', fontWeight: 600, color: notifFilter === 'unread' ? '#4f46e5' : '#64748b', background: 'none', border: 'none', borderBottom: notifFilter === 'unread' ? '2px solid #4f46e5' : '2px solid transparent', cursor: 'pointer' }}
                  >
                    Unread ({unreadCount})
                  </button>
                </div>

                {/* Notification Items List */}
                <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                  {filteredNotifications.length === 0 ? (
                    <div style={{ padding: '32px 16px', textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                      <Bell size={24} color="#cbd5e1" />
                      <span style={{ fontWeight: 600, color: '#64748b' }}>No notifications found</span>
                      <span style={{ fontSize: '0.72rem' }}>You're all caught up in your {roleConfig.label} queue</span>
                    </div>
                  ) : (
                    filteredNotifications.map((n) => {
                      const meta = classifyNotification(n);
                      return (
                        <div
                          key={n.id}
                          onClick={() => handleMarkOneRead(n.id, n.complaint_id)}
                          style={{
                            padding: '12px 16px',
                            borderBottom: '1px solid #f1f5f9',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 12,
                            background: n.is_read ? 'transparent' : 'rgba(238, 242, 255, 0.45)',
                            cursor: 'pointer',
                            transition: 'background 0.15s ease',
                          }}
                        >
                          <div style={{ marginTop: 2, padding: 6, borderRadius: 8, background: '#ffffff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {meta.icon}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                              <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: meta.badgeBg, color: meta.badgeColor, border: `1px solid ${meta.badgeBorder}` }}>
                                {meta.category}
                              </span>
                              <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                                {formatRelativeTime(n.created_at)}
                              </span>
                            </div>
                            <p style={{ fontSize: '0.78rem', color: '#1e293b', fontWeight: 500, lineHeight: 1.4, margin: 0 }}>
                              {n.message}
                            </p>
                            {n.complaint_id && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: '0.72rem', fontWeight: 600, color: '#4f46e5', marginTop: 4 }}>
                                Open Ticket #{n.complaint_id} <ExternalLink size={11} />
                              </span>
                            )}
                          </div>
                          {!n.is_read && (
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4f46e5', marginTop: 6, flexShrink: 0 }} />
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Footer status */}
                <div style={{ padding: '10px 16px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748b' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
                    Active Filter: <strong>{user?.role}</strong>
                  </span>
                  <span>Auto-sync active</span>
                </div>
              </div>
            )}
          </div>

          {/* -------------------------------------------------------
              INTERACTIVE PROFILE MENU DROPDOWN
             ------------------------------------------------------- */}
          <div style={{ position: 'relative' }} ref={profileRef}>
            <button
              type="button"
              id="navbar-profile-btn"
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setShowNotifs(false);
              }}
              className={`navbar-profile-btn ${showProfileMenu ? 'active' : ''}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '4px 10px 4px 4px',
                borderRadius: 12,
                border: showProfileMenu ? '1px solid #c7d2fe' : '1px solid #e2e8f0',
                background: showProfileMenu ? '#eef2ff' : '#ffffff',
                cursor: 'pointer',
              }}
            >
              {/* User Avatar with Initials */}
              <div
                className="navbar-avatar"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background: roleConfig.gradientAvatar,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  position: 'relative',
                  flexShrink: 0,
                }}
              >
                {getInitials(user?.name)}
                <span className="navbar-avatar-dot" style={{ position: 'absolute', bottom: -2, right: -2, width: 8, height: 8, borderRadius: '50%', background: '#10b981', border: '2px solid #ffffff' }} />
              </div>

              {/* User Name & Role text */}
              <div className="navbar-user-text" style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                <span className="navbar-user-name" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', maxWidth: 120, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.2 }}>
                  {user?.name || 'User'}
                </span>
                <span className="navbar-user-role" style={{ fontSize: '0.68rem', fontWeight: 600, color: roleConfig.badgeColor, lineHeight: 1.2 }}>
                  {roleConfig.badgeText}
                </span>
              </div>

              <ChevronDown
                size={14}
                color={showProfileMenu ? '#4f46e5' : '#94a3b8'}
                style={{ transition: 'transform 0.15s ease', transform: showProfileMenu ? 'rotate(180deg)' : 'none' }}
              />
            </button>

            {/* Profile Dropdown Menu Card */}
            {showProfileMenu && (
              <div
                className="navbar-dropdown-panel"
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 8px)',
                  width: 290,
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 16,
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
                  zIndex: 50,
                  overflow: 'hidden',
                }}
              >
                {/* Header User Card */}
                <div style={{ padding: 16, background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: roleConfig.gradientAvatar, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontWeight: 800, fontSize: '0.95rem', flexShrink: 0, boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                    {getInitials(user?.name)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {user?.name}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 2 }} title={user?.email}>
                      {user?.email}
                    </div>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 6, fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: 9999, background: roleConfig.badgeBg, color: roleConfig.badgeColor, border: `1px solid ${roleConfig.badgeBorder}` }}>
                      {roleConfig.icon}
                      {roleConfig.label}
                    </span>
                  </div>
                </div>

                {/* Menu Action Items */}
                <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  
                  {/* View Profile */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileMenu(false);
                      setShowProfileModal(true);
                    }}
                    className="profile-menu-action"
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, fontSize: '0.8rem', fontWeight: 600, color: '#334155', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                  >
                    <div style={{ padding: 5, borderRadius: 6, background: '#f1f5f9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <User size={15} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span>View Profile</span>
                      <span style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 400 }}>Account information & role</span>
                    </div>
                  </button>

                  {/* Account Settings */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileMenu(false);
                      setShowSettingsModal(true);
                    }}
                    className="profile-menu-action"
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, fontSize: '0.8rem', fontWeight: 600, color: '#334155', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                  >
                    <div style={{ padding: 5, borderRadius: 6, background: '#f1f5f9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Settings size={15} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span>Account Settings</span>
                      <span style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 400 }}>Preferences & notifications</span>
                    </div>
                  </button>

                  <div style={{ margin: '4px 0', borderTop: '1px solid #f1f5f9' }} />

                  {/* Logout with Red Accent */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileMenu(false);
                      logout();
                    }}
                    className="profile-menu-action logout"
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, fontSize: '0.8rem', fontWeight: 600, color: '#e11d48', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                  >
                    <div style={{ padding: 5, borderRadius: 6, background: '#ffe4e6', color: '#e11d48', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <LogOut size={15} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span>Logout</span>
                      <span style={{ fontSize: '0.68rem', color: '#f43f5e', fontWeight: 400 }}>End active session</span>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* =========================================================
          3. VIEW PROFILE MODAL
         ========================================================= */}
      {showProfileModal && (
        <div className="navbar-modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 100 }}>
          <div className="navbar-modal-card" style={{ background: '#ffffff', borderRadius: 18, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid #e2e8f0', width: '100%', maxWidth: 440, overflow: 'hidden' }}>
            
            {/* Modal Header */}
            <div style={{ padding: '18px 20px', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <User size={20} color="#ffffff" />
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Profile Overview</h3>
              </div>
              <button
                onClick={() => setShowProfileModal(false)}
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, color: '#ffffff', padding: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ width: 64, height: 64, borderRadius: 16, background: roleConfig.gradientAvatar, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontWeight: 800, fontSize: '1.4rem', boxShadow: '0 8px 16px rgba(0,0,0,0.12)', flexShrink: 0 }}>
                  {getInitials(user?.name)}
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>{user?.name}</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: '#64748b', marginTop: 4 }}>
                    <Mail size={13} />
                    <span>{user?.email}</span>
                  </div>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 8, fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: 9999, background: roleConfig.badgeBg, color: roleConfig.badgeColor, border: `1px solid ${roleConfig.badgeBorder}` }}>
                    {roleConfig.icon}
                    {roleConfig.label}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 10, background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontWeight: 600 }}>
                    <KeyRound size={15} color="#4f46e5" /> User ID
                  </span>
                  <strong style={{ color: '#0f172a' }}>#{user?.id || '—'}</strong>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 10, background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontWeight: 600 }}>
                    <Shield size={15} color="#4f46e5" /> Authority
                  </span>
                  <strong style={{ color: '#0f172a' }}>{roleConfig.description}</strong>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 10, background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontWeight: 600 }}>
                    <Calendar size={15} color="#4f46e5" /> Session Status
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#059669', fontWeight: 700 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
                    Active & Verified
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '14px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                className="btn btn-primary btn-sm"
                style={{ padding: '8px 16px', borderRadius: 10 }}
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          4. ACCOUNT SETTINGS MODAL
         ========================================================= */}
      {showSettingsModal && (
        <div className="navbar-modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 100 }}>
          <div className="navbar-modal-card" style={{ background: '#ffffff', borderRadius: 18, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid #e2e8f0', width: '100%', maxWidth: 440, overflow: 'hidden' }}>
            
            {/* Modal Header */}
            <div style={{ padding: '18px 20px', background: 'linear-gradient(135deg, #1e293b, #334155)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Sliders size={20} color="#ffffff" />
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Account Settings</h3>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, color: '#ffffff', padding: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16, fontSize: '0.825rem' }}>
              {settingsSaved && (
                <div style={{ padding: 12, borderRadius: 10, background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle2 size={16} color="#059669" />
                  Preferences updated successfully!
                </div>
              )}

              <div>
                <h5 style={{ margin: '0 0 10px 0', fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>Notification Alerts</h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 10, border: '1px solid #e2e8f0', cursor: 'pointer' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: '#1e293b' }}>Email Grievance Updates</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Receive email notifications on status transitions</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={emailAlerts}
                      onChange={(e) => setEmailAlerts(e.target.checked)}
                      style={{ width: 16, height: 16, accentColor: '#4f46e5' }}
                    />
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 10, border: '1px solid #e2e8f0', cursor: 'pointer' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: '#1e293b' }}>Audio Notifications</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Play chime on high priority alerts</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={browserSounds}
                      onChange={(e) => setBrowserSounds(e.target.checked)}
                      style={{ width: 16, height: 16, accentColor: '#4f46e5' }}
                    />
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 10, border: '1px solid #e2e8f0', cursor: 'pointer' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: '#1e293b' }}>Real-time Background Sync</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Check for updates every 25 seconds</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={autoRefresh}
                      onChange={(e) => setAutoRefresh(e.target.checked)}
                      style={{ width: 16, height: 16, accentColor: '#4f46e5' }}
                    />
                  </label>
                </div>
              </div>

              <div style={{ padding: 12, borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569' }}>
                <span style={{ fontWeight: 600 }}>Active Portal: <strong>Complaint Management Hub</strong></span>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.72rem', color: '#94a3b8' }}>Modern Glassmorphic styling with high contrast readability.</p>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '14px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="btn btn-outline btn-sm"
                style={{ padding: '8px 16px', borderRadius: 10 }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setSettingsSaved(true);
                  setTimeout(() => setSettingsSaved(false), 2500);
                }}
                className="btn btn-primary btn-sm"
                style={{ padding: '8px 16px', borderRadius: 10 }}
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
