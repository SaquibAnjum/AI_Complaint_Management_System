/**
 * Global Constants and Enums for Complaint Management System
 */

export const USER_ROLES = {
  USER: 'USER',
  ADMIN: 'ADMIN',
  STAFF: 'STAFF',
};

export const COMPLAINT_STATUS = {
  PENDING: 'PENDING',
  UNDER_REVIEW: 'UNDER_REVIEW',
  ASSIGNED: 'ASSIGNED',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
  CONFIRMED: 'CONFIRMED',
  REOPENED: 'REOPENED',
};

export const STATUS_META = {
  PENDING: {
    label: 'Pending',
    color: '#f59e0b',
    bg: '#fef3c7',
    border: '#fde68a',
    badgeClass: 'badge-pending',
  },
  UNDER_REVIEW: {
    label: 'Under Review',
    color: '#8b5cf6',
    bg: '#ede9fe',
    border: '#ddd6fe',
    badgeClass: 'badge-review',
  },
  ASSIGNED: {
    label: 'Assigned',
    color: '#3b82f6',
    bg: '#dbeafe',
    border: '#bfdbfe',
    badgeClass: 'badge-assigned',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    color: '#0284c7',
    bg: '#e0f2fe',
    border: '#bae6fd',
    badgeClass: 'badge-progress',
  },
  RESOLVED: {
    label: 'Resolved',
    color: '#10b981',
    bg: '#d1fae5',
    border: '#a7f3d0',
    badgeClass: 'badge-resolved',
  },
  CONFIRMED: {
    label: 'Confirmed Closed',
    color: '#059669',
    bg: '#ecfdf5',
    border: '#6ee7b7',
    badgeClass: 'badge-confirmed',
  },
  REOPENED: {
    label: 'Reopened',
    color: '#ef4444',
    bg: '#fee2e2',
    border: '#fca5a5',
    badgeClass: 'badge-reopened',
  },
};

export const PRIORITY_META = {
  LOW: {
    label: 'Low',
    color: '#64748b',
    bg: '#f1f5f9',
    badgeClass: 'badge-priority-low',
  },
  MEDIUM: {
    label: 'Medium',
    color: '#3b82f6',
    bg: '#eff6ff',
    badgeClass: 'badge-priority-medium',
  },
  HIGH: {
    label: 'High',
    color: '#f97316',
    bg: '#fff7ed',
    badgeClass: 'badge-priority-high',
  },
  CRITICAL: {
    label: 'Critical',
    color: '#ef4444',
    bg: '#fef2f2',
    badgeClass: 'badge-priority-critical',
  },
};

export const CATEGORIES = [
  'Academic',
  'Fees',
  'Hostel',
  'Library',
  'Transport',
  'Infrastructure',
  'IT Support',
  'Security',
  'Cleanliness',
  'Other',
];

export const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export const DEPARTMENTS = [
  'Academic Department',
  'Accounts',
  'Hostel Management',
  'IT Support',
  'Transport',
  'Administration',
  'Maintenance',
  'Security',
  'Housekeeping',
];
