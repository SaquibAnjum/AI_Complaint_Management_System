import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Zap,
  Layers,
  ShieldCheck,
  AlertCircle,
  Loader2,
} from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { login } = useAuth();
  const { toastSuccess, toastError, toastInfo } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const isExpired = new URLSearchParams(location.search).get('expired') === '1';

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password) {
      setErrorMessage('Please fill in both email and password');
      return;
    }

    setSubmitting(true);
    try {
      const result = await login(email.trim().toLowerCase(), password);

      if (result.success && result.user) {
        toastSuccess(`Welcome back, ${result.user.name}!`);
        const role = result.user.role;
        if (role === 'ADMIN') {
          navigate('/admin/dashboard', { replace: true });
        } else {
          navigate('/user/dashboard', { replace: true });
        }
      } else {
        const msg = result.message || 'Invalid email or password';
        setErrorMessage(msg);
        toastError(msg);
      }
    } catch (err) {
      const msg = err?.message || 'Unable to connect to server. Please try again.';
      setErrorMessage(msg);
      toastError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSocialClick = (provider) => {
    toastInfo(`${provider} login is managed by your institutional SSO administrator.`);
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-b from-[#d9ebff] via-[#eef6ff] to-[#f8fafc] flex flex-col justify-between">
      {/* Background Campus Image with Soft Gradients */}
      <div className="absolute inset-0 pointer-events-none select-none z-0">
        <img
          src="/campus_bg.jpg"
          alt="Modern Institutional Campus"
          className="w-full h-full object-cover object-bottom opacity-70 sm:opacity-75"
        />
        {/* Soft top-to-bottom atmospheric fade to make text legible */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#e2edfa]/95 via-[#f0f6fd]/80 to-[#ffffff]/70" />
        <div className="absolute inset-y-0 right-0 w-full lg:w-1/2 bg-gradient-to-l from-white/70 via-white/30 to-transparent" />
      </div>

      {/* ── Top Navigation Bar ──────────────────────────────────────────────── */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-10 py-6 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 p-0.5 shadow-md flex items-center justify-center text-white">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">
            AI Complaint Hub
          </span>
        </Link>

        {/* Top Right Tagline */}
        <div className="text-right hidden sm:block">
          <div className="text-xs font-semibold text-slate-500">Smarter Support</div>
          <div className="text-xs font-bold text-slate-700">Better Communities</div>
        </div>
      </header>

      {/* ── Main Content Area ────────────────────────────────────────────────── */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-10 py-6 lg:py-10 flex-1 flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16">
        {/* Left Hero Column */}
        <div className="w-full lg:w-1/2 max-w-xl space-y-8">
          {/* Main Headline */}
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-extrabold text-slate-900 tracking-tight leading-[1.15]">
              A Better Way<br />
              to <span className="text-[#5b4ef5]">Be Heard</span>
            </h1>
            <p className="text-slate-600 text-base sm:text-lg leading-relaxed max-w-lg font-normal">
              Submit, track, and resolve complaints with the power of AI. Simple, transparent, and efficient.
            </p>
          </div>

          {/* Feature Badges List */}
          <div className="space-y-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-full bg-indigo-100 text-[#5b4ef5] flex items-center justify-center shadow-sm flex-shrink-0">
                <Zap className="w-5 h-5 fill-[#5b4ef5]/20 text-[#5b4ef5]" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900">Faster Resolution</div>
                <div className="text-xs text-slate-500">AI-powered triage</div>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-full bg-indigo-100 text-[#5b4ef5] flex items-center justify-center shadow-sm flex-shrink-0">
                <Layers className="w-5 h-5 text-[#5b4ef5]" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900">Transparent Tracking</div>
                <div className="text-xs text-slate-500">Real-time updates</div>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-full bg-indigo-100 text-[#5b4ef5] flex items-center justify-center shadow-sm flex-shrink-0">
                <ShieldCheck className="w-5 h-5 text-[#5b4ef5]" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900">Better Community</div>
                <div className="text-xs text-slate-500">A safer, smarter environment</div>
              </div>
            </div>
          </div>

          {/* Floating Testimonial Quote & Handwritten Script */}
          <div className="pt-4 relative max-w-lg">
            {/* White Quote Box */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-md max-w-md">
              <p className="text-sm font-semibold text-slate-800 italic leading-relaxed">
                “Small issues make a big difference when heard on time.”
              </p>
            </div>

            {/* Sub-label */}
            <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-slate-600">
              <span className="w-1 h-4 bg-[#5b4ef5] rounded-full" />
              <span>Trusted by institutions, built for people.</span>
            </div>

            {/* Handwritten script annotation with arrow (like photo) */}
            <div className="absolute right-0 -bottom-8 hidden sm:flex flex-col items-center select-none pointer-events-none translate-x-4">
              <span
                style={{ fontFamily: "'Caveat', cursive" }}
                className="text-2xl text-slate-700 font-bold -rotate-6 whitespace-nowrap"
              >
                Building<br />Better Communities<br />Together
              </span>
              <svg className="w-8 h-8 text-slate-600 mt-1 -rotate-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </div>
          </div>
        </div>

        {/* Right Form Card Column */}
        <div className="w-full lg:w-auto flex justify-center">
          <div className="w-full max-w-[440px] bg-white rounded-3xl shadow-xl border border-slate-100 p-8 sm:p-10 relative">
            {/* Card Header */}
            <div className="mb-7">
              <h2 className="text-2xl sm:text-[26px] font-bold text-slate-900 tracking-tight">
                Welcome back
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Sign in to your account
              </p>
            </div>

            {/* Expired Session Notice */}
            {isExpired && (
              <div className="mb-5 flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs leading-relaxed">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <span>Your session has expired. Please sign in again.</span>
              </div>
            )}

            {/* Backend Error Alert */}
            {errorMessage && (
              <div className="mb-5 flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs leading-relaxed">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="login-email">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errorMessage) setErrorMessage('');
                    }}
                    placeholder="Enter your email"
                    required
                    autoFocus
                    autoComplete="email"
                    className="w-full text-sm bg-white border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5b4ef5]/20 focus:border-[#5b4ef5] transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="login-password">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMessage) setErrorMessage('');
                    }}
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                    className="w-full text-sm bg-white border border-slate-200 rounded-xl pl-10 pr-11 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5b4ef5]/20 focus:border-[#5b4ef5] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-[#5b4ef5] border-slate-300 rounded focus:ring-[#5b4ef5]"
                  />
                  <span className="text-xs text-slate-600 font-medium">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => toastInfo('Contact your institution administrator for password recovery.')}
                  className="text-xs font-semibold text-[#5b4ef5] hover:underline"
                >
                  Forgot password?
                </button>
              </div>

              {/* Sign In Button */}
              <button
                id="login-submit"
                type="submit"
                disabled={submitting}
                className="w-full mt-2 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-[#5346e0] hover:bg-[#473ac9] active:bg-[#3d30b5] disabled:opacity-60 transition-all shadow-md hover:shadow-indigo-200 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing In…</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <span className="relative bg-white px-3 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                or continue with
              </span>
            </div>

            {/* Social Logins */}
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => handleSocialClick('Google')}
                className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 text-xs font-medium text-slate-700 transition-all shadow-2xs"
              >
                <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.36 7.33 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.94 0 12s.46 3.84 1.26 5.42l4.02-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.25 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                </svg>
                <span>Google</span>
              </button>

              <button
                type="button"
                onClick={() => handleSocialClick('Microsoft')}
                className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 text-xs font-medium text-slate-700 transition-all shadow-2xs"
              >
                <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24">
                  <path fill="#F25022" d="M1 1h10v10H1z"/>
                  <path fill="#7FBA00" d="M13 1h10v10H13z"/>
                  <path fill="#00A4EF" d="M1 13h10v10H1z"/>
                  <path fill="#FFB900" d="M13 13h10v10H13z"/>
                </svg>
                <span>Microsoft</span>
              </button>

              <button
                type="button"
                onClick={() => handleSocialClick('Apple')}
                className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 text-xs font-medium text-slate-700 transition-all shadow-2xs"
              >
                <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.93-2.85-.9.04-2 0.6-2.65 1.35-.58.66-1.09 1.73-.95 2.76 1 .08 2.05-.51 2.67-1.26z"/>
                </svg>
                <span>Apple</span>
              </button>
            </div>

            {/* Bottom Link */}
            <div className="mt-8 text-center text-xs text-slate-600">
              Don't have an account?{' '}
              <Link
                to="/signup"
                className="font-bold text-[#5b4ef5] hover:text-[#473ac9] inline-flex items-center gap-1 hover:underline"
              >
                <span>Create your organization</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* ── Minimal Bottom Spacer ────────────────────────────────────────────── */}
      <footer className="relative z-10 py-3 text-center text-[11px] text-slate-400 font-medium">
        © {new Date().getFullYear()} AI Complaint Hub. All rights reserved.
      </footer>
    </div>
  );
};

export default Login;
