import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ArrowLeft, Eye, EyeOff, Key, Loader2, Mail, ShieldCheck } from 'lucide-react';
import VaultVisual from './VaultVisual';
import PixelKeyIcon from './PixelKeyIcon';

/**
 * Two-column cinematic Authentication Page.
 * Left: Atmospheric 3D Vault visualization.
 * Right: Clean glassmorphic authentication card preserving existing Firebase auth handlers.
 */
export default function AuthPage({
  authMode,
  setAuthMode,
  emailInput,
  setEmailInput,
  passwordInput,
  setPasswordInput,
  authSubmitting,
  onGoogleSignIn,
  onEmailAuth,
  onBack,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState('');
  const cardRef = useRef(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced || !cardRef.current) return;

    const ctx = gsap.context(() => {
      gsap.from(cardRef.current, {
        y: 18,
        opacity: 0,
        duration: 0.65,
        ease: 'power3.out',
        clearProps: 'transform,opacity',
      });
    });

    return () => ctx.revert();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationError('');

    const trimmedEmail = emailInput.trim();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setValidationError('Please enter a valid email address.');
      return;
    }
    if (!passwordInput || passwordInput.length < 6) {
      setValidationError('Password must be at least 6 characters.');
      return;
    }

    onEmailAuth(e);
  };

  return (
    <div className="relative flex-1 flex flex-col lg:grid lg:grid-cols-12 min-h-[calc(100vh-4rem)] bg-[#05050a] overflow-hidden">
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-[480px] h-[480px] rounded-full bg-purple-700/15 blur-[140px]" />
        <div className="absolute bottom-0 right-1/4 w-[420px] h-[420px] rounded-full bg-blue-700/10 blur-[130px]" />
      </div>

      {/* Left Column: Atmospheric 3D Vault (Simplified on mobile, full on desktop) */}
      <div className="relative lg:col-span-6 flex flex-col justify-between p-6 sm:p-10 lg:border-r lg:border-white/[0.06]">
        <div className="relative z-10 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>

          <div className="hidden sm:flex lg:hidden items-center gap-2 text-xs text-purple-300/80">
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            <span>AES-256-GCM Encrypted</span>
          </div>
        </div>

        {/* Vault Visual (Hidden on mobile to prioritize form, visible on md+) */}
        <div className="hidden md:flex flex-1 items-center justify-center my-4">
          <div className="w-full max-w-[480px]">
            <VaultVisual compact />
          </div>
        </div>

        <div className="hidden lg:flex items-center justify-between text-xs text-slate-500 relative z-10">
          <span>Protected digital vault environment</span>
          <span className="flex items-center gap-1.5 text-purple-300/80">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
            AES-256-GCM
          </span>
        </div>
      </div>

      {/* Right Column: Glassmorphic Authentication Card */}
      <div className="relative z-10 lg:col-span-6 flex items-center justify-center px-5 py-8 sm:p-10">
        <div
          ref={cardRef}
          className="w-full max-w-md rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-2xl p-7 sm:p-9 shadow-[0_24px_80px_rgba(0,0,0,0.65)] ring-1 ring-purple-500/10"
        >
          {/* LoginKeep Logo & Branding */}
          <div className="flex items-center gap-3 mb-7">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-violet-600 to-blue-500 flex items-center justify-center shadow-[0_0_24px_rgba(139,92,246,0.45)] ring-1 ring-white/20">
              <PixelKeyIcon className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight text-white">LoginKeep</span>
          </div>

          {/* Heading & Supporting Text */}
          <div className="mb-7">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-1.5">
              {authMode === 'signup' ? 'Create your vault.' : 'Welcome back.'}
            </h1>
            <p className="text-sm text-slate-400">Your credentials are waiting.</p>
          </div>

          {/* Google Sign-In Button */}
          <button
            type="button"
            disabled={authSubmitting}
            onClick={onGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-sm transition-all duration-200 shadow-lg hover:shadow-purple-500/15 active:scale-[0.98] disabled:opacity-60 cursor-pointer"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Divider */}
          <div className="relative my-6 flex items-center">
            <div className="flex-grow border-t border-white/10" />
            <span className="mx-3 text-[11px] uppercase tracking-widest text-slate-500">
              or with email
            </span>
            <div className="flex-grow border-t border-white/10" />
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {validationError && (
              <div className="px-3.5 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {validationError}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="name@example.com"
                  value={emailInput}
                  onChange={(e) => {
                    setEmailInput(e.target.value);
                    if (validationError) setValidationError('');
                  }}
                  className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/60 focus:border-purple-500/50 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'}
                  placeholder="••••••••"
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    if (validationError) setValidationError('');
                  }}
                  className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-10 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/60 focus:border-purple-500/50 font-mono transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-200 transition cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={authSubmitting}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm transition-all duration-200 shadow-[0_0_24px_rgba(139,92,246,0.3)] hover:shadow-[0_0_32px_rgba(168,85,247,0.45)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {authSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{authMode === 'signup' ? 'Create Account' : 'Sign In'}</span>
            </button>
          </form>

          {/* Switch Auth Mode */}
          <div className="mt-6 pt-5 border-t border-white/10 text-center text-xs text-slate-400">
            {authMode === 'signup' ? (
              <span>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setValidationError('');
                  }}
                  className="text-purple-400 hover:text-purple-300 font-medium hover:underline cursor-pointer"
                >
                  Sign In
                </button>
              </span>
            ) : (
              <span>
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signup');
                    setValidationError('');
                  }}
                  className="text-purple-400 hover:text-purple-300 font-medium hover:underline cursor-pointer"
                >
                  Create an account
                </button>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

