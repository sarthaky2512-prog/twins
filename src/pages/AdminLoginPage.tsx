import React, { useEffect, useState } from 'react';
import { ArrowLeft, Eye, EyeOff, KeyRound, Lock } from 'lucide-react';
import { useStudio } from '../context/StudioContext';

export function AdminLoginPage() {
  const { data, navigate } = useStudio();
  const logoSrc = data.settings.logoUrl || '/assets/aistudio/logo1_twins_526fef3c.png';

  const [loadingStatus, setLoadingStatus] = useState(true);
  const [configured, setConfigured] = useState(true);
  const [mode, setMode] = useState<'login' | 'forgot' | 'reset'>('login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get('resetToken');
    if (tokenFromUrl) {
      setResetToken(tokenFromUrl);
      setMode('reset');
    }

    fetch('/api/auth/status', { cache: 'no-store' })
      .then((r) => r.json())
      .then((json) => {
        setConfigured(Boolean(json.configured));
        if (json.authenticated) {
          navigate('/admin/dashboard');
        }
      })
      .catch(() => {})
      .finally(() => setLoadingStatus(false));
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);
    if (!email.trim() || !password) {
      setErrorMsg('Please enter both your administrator email and password.');
      return;
    }

    setSubmitting(true);
    const endpoint = configured ? '/api/auth/login' : '/api/auth/setup';
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, rememberMe }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json.error || 'Invalid login credentials.');
      } else {
        navigate('/admin/dashboard');
      }
    } catch {
      setErrorMsg('Network error while connecting to authentication server.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json.error || 'Could not process password reset.');
      } else {
        setInfoMsg(json.message);
      }
    } catch {
      setErrorMsg('Network error during password reset request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, newPassword }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json.error || 'Could not reset password.');
      } else {
        setInfoMsg(json.message);
        setMode('login');
      }
    } catch {
      setErrorMsg('Network error resetting password.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingStatus) {
    return (
      <div className="min-h-screen bg-[#F5F4F1] flex items-center justify-center p-6">
        <p className="text-sm text-[#6E655D]">Checking secure studio session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F4F1] flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md bg-white border border-[#1C1917]/12 shadow-sm p-8 sm:p-10 space-y-6">
        <div className="text-center space-y-3">
          <img
            src={logoSrc}
            alt={data.businessInfo.businessName}
            className="w-16 h-16 rounded-full object-cover mx-auto border border-[#B89352]/40"
          />
          <div>
            <p className="text-xs tracking-[0.22em] uppercase text-[#B89352] font-semibold">
              {data.businessInfo.businessName}
            </p>
            <h1 className="font-serif-display text-3xl text-[#1C1917] mt-1">
              {mode === 'forgot'
                ? 'Reset Password'
                : mode === 'reset'
                ? 'Set New Password'
                : configured
                ? 'Studio CMS Login'
                : 'Initialize Super Admin'}
            </h1>
          </div>
          <p className="text-xs text-[#6E655D] leading-relaxed">
            {mode === 'forgot'
              ? 'Enter your administrator email address to receive password reset instructions.'
              : mode === 'reset'
              ? 'Choose a strong new password of at least 8 characters.'
              : configured
              ? 'Authorized studio staff sign-in. Public visitors cannot access CMS controls.'
              : 'First-time setup: enter your initial administrator email and password.'}
          </p>
        </div>

        {errorMsg && (
          <div role="alert" className="p-3.5 bg-red-50 border border-red-200 text-red-900 text-xs">
            {errorMsg}
          </div>
        )}
        {infoMsg && (
          <div role="status" className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs">
            {infoMsg}
          </div>
        )}

        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                htmlFor="login-email"
                className="block text-xs font-semibold uppercase tracking-[0.12em] text-[#1C1917] mb-1.5"
              >
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@gmail.com"
                className="w-full px-4 py-3 bg-[#FAF8F5] border border-[#1C1917]/15 text-sm text-[#1C1917] focus:outline-none focus:border-[#B89352]"
              />
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="block text-xs font-semibold uppercase tracking-[0.12em] text-[#1C1917] mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-4 py-3 pr-11 bg-[#FAF8F5] border border-[#1C1917]/15 text-sm text-[#1C1917] focus:outline-none focus:border-[#B89352]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6E655D] hover:text-[#1C1917] cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="inline-flex items-center gap-2 text-[#6E655D] cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember session (14 days)</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  setInfoMsg(null);
                  setMode('forgot');
                }}
                className="text-[#B89352] hover:underline cursor-pointer"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-[#1C1917] text-[#FAF8F5] text-xs font-semibold tracking-[0.16em] uppercase hover:bg-[#B89352] disabled:opacity-60 transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              <span>{submitting ? 'Signing In...' : 'Sign In to Admin CMS'}</span>
            </button>
          </form>
        )}

        {mode === 'forgot' && (
          <form onSubmit={handleForgot} className="space-y-4">
            <div>
              <label
                htmlFor="forgot-email"
                className="block text-xs font-semibold uppercase tracking-[0.12em] text-[#1C1917] mb-1.5"
              >
                Administrator Email
              </label>
              <input
                id="forgot-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@gmail.com"
                className="w-full px-4 py-3 bg-[#FAF8F5] border border-[#1C1917]/15 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-[#1C1917] text-[#FAF8F5] text-xs font-semibold tracking-[0.16em] uppercase hover:bg-[#B89352] cursor-pointer flex items-center justify-center gap-2"
            >
              <KeyRound className="w-4 h-4" />
              <span>{submitting ? 'Sending...' : 'Request Reset Link'}</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('login')}
              className="w-full text-xs text-[#6E655D] hover:text-[#1C1917] cursor-pointer"
            >
              Back to Sign In
            </button>
          </form>
        )}

        {mode === 'reset' && (
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label
                htmlFor="reset-new-pw"
                className="block text-xs font-semibold uppercase tracking-[0.12em] text-[#1C1917] mb-1.5"
              >
                New Password (min 8 chars)
              </label>
              <input
                id="reset-new-pw"
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 bg-[#FAF8F5] border border-[#1C1917]/15 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-[#1C1917] text-[#FAF8F5] text-xs font-semibold tracking-[0.16em] uppercase hover:bg-[#B89352] cursor-pointer"
            >
              {submitting ? 'Updating...' : 'Save New Password'}
            </button>
          </form>
        )}

        <div className="pt-4 border-t border-[#1C1917]/10 text-center">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-1.5 text-xs text-[#6E655D] hover:text-[#1C1917] cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Twins Twins Video Pro Website</span>
          </button>
        </div>
      </div>
    </div>
  );
}
