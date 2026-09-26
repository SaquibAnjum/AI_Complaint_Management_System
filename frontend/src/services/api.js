/**
 * Central API Service Layer using Axios
 */

import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Attach JWT Bearer Token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Extract response data and handle auth expiration
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response) {
      // If 401 Unauthorized, token might be invalid or expired
      if (error.response.status === 401 && !window.location.pathname.includes('/login')) {
        const errCode = error.response.data?.error;
        if (errCode === 'AUTH_TOKEN_EXPIRED' || errCode === 'AUTH_TOKEN_INVALID') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login?expired=1';
        }
      }
      return Promise.reject(error.response.data || error.response);
    }
    return Promise.reject({
      success: false,
      message: error.message || 'Network error: could not connect to server',
    });
  }
);

// Complaint Endpoints
export const complaintsAPI = {
  create: (data) => api.post('/complaints', data),
  list: (params) => api.get('/complaints', { params }),
  getDetails: (id) => api.get(`/complaints/${id}`),
  update: (id, data) => api.put(`/complaints/${id}`, data),
  confirmResolution: (id) => api.post(`/complaints/${id}/confirm`),
  rejectResolution: (id, data) => api.post(`/complaints/${id}/reject`, data),
  reopen: (id, data) => api.post(`/complaints/${id}/reopen`, data),
};

// Admin Endpoints
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getComplaints: (params) => api.get('/admin/complaints', { params }),
  getComplaint: (id) => api.get(`/admin/complaints/${id}`),
  markReview: (id) => api.put(`/admin/complaints/${id}/review`),
  updateStatus: (id, data) => api.put(`/admin/complaints/${id}/status`, data),
  updateClassification: (id, data) => api.put(`/admin/complaints/${id}/classification`, data),
  // User management
  getUsers: (params) => api.get('/admin/users', { params }),
  toggleUserStatus: (id, data) => api.put(`/admin/users/${id}/status`, data),
  // Organization
  getOrganization: () => api.get('/admin/organization'),
};

// Feedback Endpoints
export const feedbackAPI = {
  submit: (complaintId, data) => api.post(`/complaints/${complaintId}/feedback`, data),
  get: (complaintId) => api.get(`/complaints/${complaintId}/feedback`),
};

// Notifications Endpoints
export const notificationsAPI = {
  list: (unreadOnly = false) => api.get('/notifications', { params: { unread_only: unreadOnly } }),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
};

export default api;
