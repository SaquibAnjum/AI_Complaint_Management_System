/**
 * Centralized Authentication Service
 * Communicates with backend /api/auth endpoints
 */

import api from './api';

export const authService = {
  /**
   * Register a new organization and its administrator
   * @param {Object} data { organization_name, organization_type, admin_name, admin_email, phone, password }
   */
  registerOrganization: (data) => api.post('/auth/register-organization', data),

  /**
   * Register a standard user bound to an organization
   * @param {Object} data { join_code, org_slug, name, email, phone, password }
   */
  registerUser: (data) => api.post('/auth/register-user', data),

  /**
   * Common login endpoint for ADMIN, STAFF, and USER
   * @param {Object} credentials { email, password }
   */
  login: (credentials) => api.post('/auth/login', credentials),

  /**
   * Get authenticated user profile
   */
  getMe: () => api.get('/auth/me'),

  /**
   * Client logout
   */
  logout: () => api.post('/auth/logout'),
};

export default authService;
