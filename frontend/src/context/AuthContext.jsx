/**
 * Global Authentication Context and Provider
 *
 * Handles session management for all roles: ADMIN, STAFF, USER
 * Role determination is done server-side — never on the frontend.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // ─── Internal logout helper (does NOT call server — used internally) ─────
  const clearSession = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }, []);

  // ─── Verify token and fetch fresh user profile on app boot ──────────────
  const fetchCurrentUser = useCallback(async () => {
    const savedToken = localStorage.getItem('token');
    if (!savedToken) {
      setLoading(false);
      return;
    }

    try {
      const res = await authService.getMe();
      if (res.success && res.data?.user) {
        setUser(res.data.user);
        setToken(savedToken);
        localStorage.setItem('user', JSON.stringify(res.data.user));
      } else {
        clearSession();
      }
    } catch (err) {
      console.warn('Auth token verification failed:', err);
      clearSession();
    } finally {
      setLoading(false);
    }
  }, [clearSession]);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  // ─── Login (unified for ADMIN / STAFF / USER) ──────────────────────────
  const login = async (email, password) => {
    setAuthError(null);
    try {
      const res = await authService.login({ email, password });
      if (res.success && res.data) {
        const { token: receivedToken, user: receivedUser } = res.data;
        setToken(receivedToken);
        setUser(receivedUser);
        localStorage.setItem('token', receivedToken);
        localStorage.setItem('user', JSON.stringify(receivedUser));
        return { success: true, user: receivedUser };
      }
      return { success: false, message: res.message || 'Login failed' };
    } catch (err) {
      const msg = err?.message || 'Invalid email or password';
      setAuthError(msg);
      return { success: false, message: msg };
    }
  };

  // ─── Logout ─────────────────────────────────────────────────────────────
  const logout = () => {
    try {
      authService.logout(); // Fire-and-forget server notification
    } catch {
      // Ignore network errors on logout
    }
    clearSession();
  };

  // ─── Expose a way for pages to update user state after direct API calls ─
  const setAuthFromToken = useCallback((newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    if (newToken) localStorage.setItem('token', newToken);
    if (newUser) localStorage.setItem('user', JSON.stringify(newUser));
  }, []);

  const organization = user?.organization || (user?.organization_name ? {
    id: user.organization_id,
    name: user.organization_name,
    slug: user.organization_slug,
  } : null);

  const isAuth = !!token && !!user;

  const value = {
    authenticated: isAuth,
    isAuthenticated: isAuth,
    user,
    role: user?.role || null,
    organization,
    loading,
    token,
    authError,
    login,
    logout,
    refreshUser: fetchCurrentUser,
    setAuthFromToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
