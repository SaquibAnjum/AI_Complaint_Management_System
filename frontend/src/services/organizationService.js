/**
 * Organization Service
 * Handles organization metadata and public lookup
 */

import api from './api';

export const organizationService = {
  /**
   * Fetch public organization information by slug (for join / signup page)
   * @param {string} slug Organization slug
   */
  getOrganizationInfo: (slug) => api.get(`/auth/organization-info/${encodeURIComponent(slug)}`),

  /**
   * Find organization by join code OR slug
   * Accepts the short 8-char code (e.g. "ABC12DEF") or the full slug
   * @param {string} code Join code or slug
   */
  joinByCode: (code) => api.get(`/auth/join/${encodeURIComponent(code.trim())}`),
};

export default organizationService;
