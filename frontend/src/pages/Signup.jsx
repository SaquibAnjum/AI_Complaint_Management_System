import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { organizationService } from '../services/organizationService';
import {
  Building2,
  Users,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowRight,
  ChevronDown,
  Hash,
  Zap,
  Shield,
  Globe,
} from 'lucide-react';

const ORG_TYPES = [
  { value: 'University', label: 'University / College' },
  { value: 'College', label: 'College / Institute' },
  { value: 'School', label: 'School' },
  { value: 'Hospital', label: 'Hospital / Healthcare' },
  { value: 'Company', label: 'Corporate / Enterprise' },
  { value: 'Institution', label: 'Public Institution / Government' },
  { value: 'Other', label: 'Other' },
];

const Signup = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toastSuccess, toastError } = useToast();
  const { setAuthFromToken } = useAuth();

  const orgParam = searchParams.get('org') || searchParams.get('org_slug') || '';
  const isJoinMode = Boolean(orgParam);

  // ── Organization Creation Form State ─────────────────────────────────────
  const [orgForm, setOrgForm] = useState({
    organization_name: '',
    organization_type: 'University',
    admin_name: '',
    admin_email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  // ── User Join Form State ──────────────────────────────────────────────────
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [lookupCode, setLookupCode] = useState(orgParam === 'lookup' ? '' : orgParam);
  const [validatedOrg, setValidatedOrg] = useState(null);
  const [orgLoading, setOrgLoading] = useState(false);
  const [orgError, setOrgError] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Auto-validate when a real org param is given (not 'lookup')
  useEffect(() => {
    if (orgParam && orgParam !== 'lookup') {
      validateOrganization(orgParam);
    }
  }, [orgParam]);

  const validateOrganization = async (code) => {
    const clean = code.trim();
    if (!clean) return;

    setOrgLoading(true);
    setOrgError('');
    setValidatedOrg(null);

    try {
      const res = await organizationService.joinByCode(clean);
      if (res.success && res.data?.organization) {
        setValidatedOrg(res.data.organization);
      } else {
        setOrgError(res.message || 'Organization not found. Please check your code.');
      }
    } catch (err) {
      setOrgError(err?.message || 'Organization not found. Please check your join code or slug.');
    } finally {
      setOrgLoading(false);
    }
  };

  const handleLookupSubmit = (e) => {
    e.preventDefault();
    if (!lookupCode.trim()) return;
    setSearchParams({ org: lookupCode.trim() });
    validateOrganization(lookupCode);
  };

  // ── Handle Organization + Admin Submission ──────────────────────────────
  const handleOrgSignupSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (orgForm.password !== orgForm.confirmPassword) {
      setSubmitError('Passwords do not match');
      return;
    }
    if (orgForm.password.length < 8) {
      setSubmitError('Password must be at least 8 characters long');
      return;
    }
    if (!orgForm.organization_name.trim()) {
      setSubmitError('Organization name is required');
      return;
    }

    setSubmitting(true);
    try {
      const res = await authService.registerOrganization({
        organization_name: orgForm.organization_name.trim(),
        organization_type: orgForm.organization_type,
        admin_name: orgForm.admin_name.trim(),
        admin_email: orgForm.admin_email.trim().toLowerCase(),
        phone: orgForm.phone.trim() || undefined,
        password: orgForm.password,
        confirm_password: orgForm.confirmPassword,
      });

      if (res.success && res.data) {
        const { token, user } = res.data;
        setAuthFromToken(token, user);
        toastSuccess(`Organization "${orgForm.organization_name}" created successfully!`);
        navigate('/admin/dashboard', { replace: true });
      } else {
        const msg = res.message || 'Failed to create organization';
        setSubmitError(msg);
        toastError(msg);
      }
    } catch (err) {
      const msg = err?.message || 'Failed to create organization. Please try again.';
      setSubmitError(msg);
      toastError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Handle User Join Submission ─────────────────────────────────────────
  const handleUserJoinSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!validatedOrg) {
      setSubmitError('Please validate your organization first');
      return;
    }
    if (userForm.password !== userForm.confirmPassword) {
      setSubmitError('Passwords do not match');
      return;
    }
    if (userForm.password.length < 8) {
      setSubmitError('Password must be at least 8 characters long');
      return;
    }

    setSubmitting(true);
    try {
      const res = await authService.registerUser({
        join_code: validatedOrg.join_code,
        org_slug: validatedOrg.slug,
        name: userForm.name.trim(),
        email: userForm.email.trim().toLowerCase(),
        phone: userForm.phone.trim() || undefined,
        password: userForm.password,
      });

      if (res.success && res.data) {
        const { token, user } = res.data;
        setAuthFromToken(token, user);
        toastSuccess(`Welcome to ${validatedOrg.name}, ${user.name}!`);
        navigate('/user/dashboard', { replace: true });
      } else {
        const msg = res.message || 'Failed to join organization';
        setSubmitError(msg);
        toastError(msg);
      }
    } catch (err) {
      const msg = err?.message || 'Failed to create account. Please try again.';
      setSubmitError(msg);
      toastError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  /* ─────────────────────────────────────────────────────────────────────────
     Shared input className helper (matches Login style exactly)
  ───────────────────────────────────────────────────────────────────────── */
  const inputCls =
    'w-full text-sm bg-white border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5b4ef5]/20 focus:border-[#5b4ef5] transition-all';
  const inputNoPadCls =
    'w-full text-sm bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5b4ef5]/20 focus:border-[#5b4ef5] transition-all';
  const labelCls = 'block text-xs font-semibold text-slate-700 mb-1.5';
  const sectionHeaderCls =
    'text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5 pt-1';

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-b from-[#d9ebff] via-[#eef6ff] to-[#f8fafc] flex flex-col justify-between">
      {/* Background Image with Gradient Overlay */}
      <div className="absolute inset-0 pointer-events-none select-none z-0">
        <img
          src="/campus_bg.jpg"
          alt="Modern Institutional Campus"
          className="w-full h-full object-cover object-bottom opacity-70 sm:opacity-75"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#e2edfa]/95 via-[#f0f6fd]/80 to-[#ffffff]/70" />
        <div className="absolute inset-y-0 right-0 w-full lg:w-1/2 bg-gradient-to-l from-white/70 via-white/30 to-transparent" />
      </div>

      {/* ── Top Navigation Bar ── */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-10 py-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 p-0.5 shadow-md flex items-center justify-center text-white">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">AI Complaint Hub</span>
        </Link>
        <div className="text-right hidden sm:block">
          <div className="text-xs font-semibold text-slate-500">Smarter Support</div>
          <div className="text-xs font-bold text-slate-700">Better Communities</div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-10 py-6 lg:py-10 flex-1 flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16">

        {/* Left Hero Column */}
        <div className="w-full lg:w-1/2 max-w-xl space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-extrabold text-slate-900 tracking-tight leading-[1.15]">
              {isJoinMode ? (
                <>Join your<br /><span className="text-[#5b4ef5]">Community</span></>
              ) : (
                <>Start your<br /><span className="text-[#5b4ef5]">Organization</span></>
              )}
            </h1>
            <p className="text-slate-600 text-base sm:text-lg leading-relaxed max-w-lg font-normal">
              {isJoinMode
                ? 'Enter your organization join code to create your member account and start submitting complaints.'
                : 'Register your institution and create the administrator account. Share a join code with your members.'}
            </p>
          </div>

          {/* Feature Badges */}
          <div className="space-y-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center shadow-sm flex-shrink-0">
                <Zap className="w-5 h-5 fill-[#5b4ef5]/20 text-[#5b4ef5]" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900">Instant Setup</div>
                <div className="text-xs text-slate-500">Live in under a minute</div>
              </div>
            </div>
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center shadow-sm flex-shrink-0">
                <Shield className="w-5 h-5 text-[#5b4ef5]" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900">Role-Based Access</div>
                <div className="text-xs text-slate-500">Admin, Staff, and User tiers</div>
              </div>
            </div>
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center shadow-sm flex-shrink-0">
                <Globe className="w-5 h-5 text-[#5b4ef5]" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900">Multi-Tenant</div>
                <div className="text-xs text-slate-500">Fully isolated per organization</div>
              </div>
            </div>
          </div>

          {/* Quote */}
          <div className="pt-4 relative max-w-lg">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-md max-w-md">
              <p className="text-sm font-semibold text-slate-800 italic leading-relaxed">
                "Small issues make a big difference when heard on time."
              </p>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-slate-600">
              <span className="w-1 h-4 bg-[#5b4ef5] rounded-full" />
              <span>Trusted by institutions, built for people.</span>
            </div>
          </div>
        </div>

        {/* Right Form Card Column */}
        <div className="w-full lg:w-auto flex justify-center">
          <div className="w-full max-w-[480px] bg-white rounded-3xl shadow-xl border border-slate-100 p-8 sm:p-10 relative">

            {/* Mode Toggle (Create / Join) */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl mb-7">
              <button
                type="button"
                onClick={() => { setSubmitError(''); setSearchParams({}); }}
                className={`flex-1 text-xs font-semibold py-2 px-3 rounded-lg transition-all ${
                  !isJoinMode
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Building2 className="w-3.5 h-3.5 inline mr-1.5" />
                Create Organization
              </button>
              <button
                type="button"
                onClick={() => { setSubmitError(''); setSearchParams({ org: lookupCode || 'lookup' }); }}
                className={`flex-1 text-xs font-semibold py-2 px-3 rounded-lg transition-all ${
                  isJoinMode
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Users className="w-3.5 h-3.5 inline mr-1.5" />
                Join Organization
              </button>
            </div>

            {/* ══════════════════════════════════════════════════
                MODE A: JOIN ORGANIZATION
            ══════════════════════════════════════════════════ */}
            {isJoinMode ? (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl sm:text-[26px] font-bold text-slate-900 tracking-tight">
                    {validatedOrg ? `Join ${validatedOrg.name}` : 'Join your Organization'}
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    {validatedOrg
                      ? 'Create your member account to submit and track complaints'
                      : 'Enter your organization join code or slug'}
                  </p>
                </div>

                {/* Code Lookup */}
                {!validatedOrg && (
                  <form onSubmit={handleLookupSubmit} className="mb-6">
                    <label className={labelCls} htmlFor="org-code-input">
                      Join Code or Organization Slug
                    </label>
                    <div className="relative flex gap-2">
                      <div className="relative flex-1">
                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Hash className="w-4 h-4" />
                        </span>
                        <input
                          id="org-code-input"
                          type="text"
                          value={lookupCode}
                          onChange={(e) => setLookupCode(e.target.value)}
                          placeholder="e.g. DXTFP96K or my-university"
                          className={inputCls}
                          autoFocus
                          autoComplete="off"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={orgLoading || !lookupCode.trim()}
                        className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-semibold text-white bg-[#5346e0] hover:bg-[#473ac9] rounded-xl disabled:opacity-50 transition-all shadow-md cursor-pointer whitespace-nowrap"
                      >
                        {orgLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Find'}
                      </button>
                    </div>
                    {orgError && (
                      <p className="text-xs text-rose-600 mt-2 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{orgError}</span>
                      </p>
                    )}
                  </form>
                )}

                {/* Validated Org Badge */}
                {validatedOrg && (
                  <div className="mb-6 flex items-center justify-between p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                      <div>
                        <div className="text-sm font-bold text-slate-900">{validatedOrg.name}</div>
                        <div className="text-xs text-emerald-700 capitalize">
                          {validatedOrg.organization_type} • Code: {validatedOrg.join_code}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setValidatedOrg(null); setSearchParams({ org: 'lookup' }); }}
                      className="text-[11px] font-medium text-emerald-800 hover:underline"
                    >
                      Change
                    </button>
                  </div>
                )}

                {/* Submit Error */}
                {submitError && (
                  <div className="mb-4 flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                    <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                    <span>{submitError}</span>
                  </div>
                )}

                {/* User Registration Form */}
                {validatedOrg && (
                  <form onSubmit={handleUserJoinSubmit} className="space-y-4">
                    <div>
                      <label className={labelCls} htmlFor="user-name">Full Name *</label>
                      <input
                        id="user-name"
                        type="text"
                        value={userForm.name}
                        onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                        placeholder="Jane Doe"
                        required
                        autoFocus
                        className={inputNoPadCls}
                      />
                    </div>

                    <div>
                      <label className={labelCls} htmlFor="user-email">Email Address *</label>
                      <input
                        id="user-email"
                        type="email"
                        value={userForm.email}
                        onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                        placeholder="jane@example.com"
                        required
                        autoComplete="email"
                        className={inputNoPadCls}
                      />
                    </div>

                    <div>
                      <label className={labelCls} htmlFor="user-phone">
                        Phone <span className="text-slate-400 font-normal">(optional)</span>
                      </label>
                      <input
                        id="user-phone"
                        type="tel"
                        value={userForm.phone}
                        onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                        placeholder="+1 555 0100"
                        className={inputNoPadCls}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelCls} htmlFor="user-pass">Password *</label>
                        <div className="relative">
                          <input
                            id="user-pass"
                            type={showPassword ? 'text' : 'password'}
                            value={userForm.password}
                            onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                            placeholder="Min. 8 chars"
                            required
                            autoComplete="new-password"
                            className={`${inputNoPadCls} pr-10`}
                          />
                          <button type="button" onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1">
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className={labelCls} htmlFor="user-confirm">Confirm *</label>
                        <div className="relative">
                          <input
                            id="user-confirm"
                            type={showConfirm ? 'text' : 'password'}
                            value={userForm.confirmPassword}
                            onChange={(e) => setUserForm({ ...userForm, confirmPassword: e.target.value })}
                            placeholder="Re-enter"
                            required
                            autoComplete="new-password"
                            className={`${inputNoPadCls} pr-10`}
                          />
                          <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1">
                            {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full mt-2 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-[#5346e0] hover:bg-[#473ac9] active:bg-[#3d30b5] disabled:opacity-60 transition-all shadow-md hover:shadow-indigo-200 cursor-pointer"
                    >
                      {submitting ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /><span>Creating Account…</span></>
                      ) : (
                        <><span>Join {validatedOrg.name}</span><ArrowRight className="w-4 h-4" /></>
                      )}
                    </button>
                  </form>
                )}
              </div>
            ) : (
              /* ══════════════════════════════════════════════════
                 MODE B: CREATE ORGANIZATION
              ══════════════════════════════════════════════════ */
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl sm:text-[26px] font-bold text-slate-900 tracking-tight">
                    Create your Organization
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Register your institution and administrator account
                  </p>
                </div>

                {submitError && (
                  <div className="mb-5 flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                    <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                    <span>{submitError}</span>
                  </div>
                )}

                <form onSubmit={handleOrgSignupSubmit} className="space-y-4">
                  {/* Organization Section */}
                  <div className={sectionHeaderCls}>
                    <Building2 className="w-3.5 h-3.5" /> Organization Details
                  </div>

                  <div>
                    <label className={labelCls} htmlFor="org-name">Organization Name *</label>
                    <input
                      id="org-name"
                      type="text"
                      value={orgForm.organization_name}
                      onChange={(e) => setOrgForm({ ...orgForm, organization_name: e.target.value })}
                      placeholder="e.g. Apex Institute of Technology"
                      required
                      autoFocus
                      className={inputNoPadCls}
                    />
                  </div>

                  <div>
                    <label className={labelCls} htmlFor="org-type">Organization Type *</label>
                    <div className="relative">
                      <select
                        id="org-type"
                        value={orgForm.organization_type}
                        onChange={(e) => setOrgForm({ ...orgForm, organization_type: e.target.value })}
                        required
                        className={`${inputNoPadCls} pr-10 appearance-none`}
                      >
                        {ORG_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* Administrator Section */}
                  <div className={sectionHeaderCls}>
                    <Users className="w-3.5 h-3.5" /> Administrator Details
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls} htmlFor="admin-name">Full Name *</label>
                      <input
                        id="admin-name"
                        type="text"
                        value={orgForm.admin_name}
                        onChange={(e) => setOrgForm({ ...orgForm, admin_name: e.target.value })}
                        placeholder="Dr. Arthur Smith"
                        required
                        className={inputNoPadCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls} htmlFor="admin-phone">
                        Phone <span className="text-slate-400 font-normal">(optional)</span>
                      </label>
                      <input
                        id="admin-phone"
                        type="tel"
                        value={orgForm.phone}
                        onChange={(e) => setOrgForm({ ...orgForm, phone: e.target.value })}
                        placeholder="+1 555 0199"
                        className={inputNoPadCls}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelCls} htmlFor="admin-email">Admin Email *</label>
                    <input
                      id="admin-email"
                      type="email"
                      value={orgForm.admin_email}
                      onChange={(e) => setOrgForm({ ...orgForm, admin_email: e.target.value })}
                      placeholder="admin@apex.edu"
                      required
                      autoComplete="email"
                      className={inputNoPadCls}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls} htmlFor="admin-pass">Password *</label>
                      <div className="relative">
                        <input
                          id="admin-pass"
                          type={showPassword ? 'text' : 'password'}
                          value={orgForm.password}
                          onChange={(e) => setOrgForm({ ...orgForm, password: e.target.value })}
                          placeholder="Min. 8 chars"
                          required
                          autoComplete="new-password"
                          className={`${inputNoPadCls} pr-10`}
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1">
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className={labelCls} htmlFor="admin-confirm">Confirm *</label>
                      <div className="relative">
                        <input
                          id="admin-confirm"
                          type={showConfirm ? 'text' : 'password'}
                          value={orgForm.confirmPassword}
                          onChange={(e) => setOrgForm({ ...orgForm, confirmPassword: e.target.value })}
                          placeholder="Re-enter"
                          required
                          autoComplete="new-password"
                          className={`${inputNoPadCls} pr-10`}
                        />
                        <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1">
                          {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full mt-2 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-[#5346e0] hover:bg-[#473ac9] active:bg-[#3d30b5] disabled:opacity-60 transition-all shadow-md hover:shadow-indigo-200 cursor-pointer"
                  >
                    {submitting ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /><span>Creating Organization…</span></>
                    ) : (
                      <><span>Create Organization</span><ArrowRight className="w-4 h-4" /></>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* Footer link */}
            <div className="mt-8 text-center text-xs text-slate-600">
              Already registered?{' '}
              <Link to="/login" className="font-bold text-[#5b4ef5] hover:text-[#473ac9] inline-flex items-center gap-1 hover:underline">
                <span>Sign in to your account</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-3 text-center text-[11px] text-slate-400 font-medium">
        © {new Date().getFullYear()} AI Complaint Hub. All rights reserved.
      </footer>
    </div>
  );
};

export default Signup;
