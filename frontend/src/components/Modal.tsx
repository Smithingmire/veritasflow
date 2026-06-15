import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, CheckCircle, Puzzle, Mail, User, Lock, KeyRound, Eye, EyeOff } from 'lucide-react';
import { authService } from '../services/auth';

/* ─── Backdrop ─────────────────────────────────────────────── */
const Backdrop: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    onClick={onClick}
    className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md"
  />
);

/* ─── Glass Shell ──────────────────────────────────────────── */
const GlassShell: React.FC<{ children: React.ReactNode; onClose: () => void; wide?: boolean }> = ({
  children,
  onClose,
  wide = false,
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.92, y: 30 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.92, y: 30 }}
    transition={{ type: 'spring', stiffness: 260, damping: 24 }}
    className={`fixed z-[101] inset-0 flex items-center justify-center p-5 pointer-events-none`}
    onClick={(e) => e.stopPropagation()}
  >
    <div className={`relative ${wide ? 'w-[min(90vw,420px)]' : 'w-[min(88vw,360px)]'} max-h-[90vh] overflow-y-auto glass-panel rounded-2xl p-6 md:p-8 border border-white/10 shadow-2xl pointer-events-auto`}>
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-text-secondary hover:text-white hover:bg-white/10 transition-all"
      >
        <X className="w-3.5 h-3.5" />
      </button>
      {children}
    </div>
  </motion.div>
);

/* ─── Styled Input ─────────────────────────────────────────── */
const GlassInput: React.FC<{
  icon: React.ReactNode;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  id: string;
  autoComplete?: string;
}> = ({ icon, type = 'text', placeholder, value, onChange, id, autoComplete }) => {
  const [showPw, setShowPw] = useState(false);
  const isPw = type === 'password';

  return (
    <div className="relative flex items-center">
      <span className="absolute left-3 text-text-tertiary">{icon}</span>
      <input
        id={id}
        type={isPw ? (showPw ? 'text' : 'password') : type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete || 'off'}
        className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-text-tertiary focus:outline-none focus:border-brand-blue/40 focus:bg-white/[0.05] transition-all"
      />
      {isPw && (
        <button
          type="button"
          onClick={() => setShowPw(!showPw)}
          className="absolute right-3 text-text-tertiary hover:text-white transition-colors"
        >
          {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   AUTH MODAL — Login / Register with tabs
   ══════════════════════════════════════════════════════════════ */
export const AuthModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (type: 'login' | 'register') => void;
  initialTab?: 'login' | 'register';
}> = ({ isOpen, onClose, onSuccess, initialTab = 'login' }) => {
  const [tab, setTab] = useState<'login' | 'register'>(initialTab);

  useEffect(() => {
    if (isOpen) {
      setTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPw, setLoginPw] = useState('');

  // Register state
  const [regEmail, setRegEmail] = useState('');
  const [regUser, setRegUser] = useState('');
  const [regPw, setRegPw] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [consent, setConsent] = useState(false);

  // Status states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const canRegister = regEmail && regUser && regPw && regConfirm && regPw === regConfirm && consent;
  const canLogin = loginEmail && loginPw;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canLogin || isSubmitting) return;
    setIsSubmitting(true);
    setError('');
    try {
      const res = await authService.login(loginEmail, loginPw);
      if (res.success) {
        onSuccess('login');
        setLoginEmail('');
        setLoginPw('');
      } else {
        setError(res.message || 'Login failed.');
      }
    } catch (err) {
      setError('Connection failed. Is the backend running?');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canRegister || isSubmitting) return;
    setIsSubmitting(true);
    setError('');
    try {
      const res = await authService.signup(regUser, regEmail, regPw, consent);
      if (res.success) {
        onSuccess('register');
        setRegEmail('');
        setRegUser('');
        setRegPw('');
        setRegConfirm('');
        setConsent(false);
      } else {
        setError(res.message || 'Registration failed.');
      }
    } catch (err) {
      setError('Connection failed. Is the backend running?');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <Backdrop onClick={onClose} />
          <GlassShell onClose={onClose} wide>
            {/* Heading */}
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-white/15 via-sky-200/15 to-violet-200/15 p-[1px] flex items-center justify-center">
                <div className="w-full h-full rounded-full bg-[#0a0a0c] flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-brand-cyan" />
                </div>
              </div>
              <span className="font-heading text-lg font-bold text-white">VeritasFlow</span>
            </div>

            {/* Tab Switcher */}
            <div className="liquid-tabs flex mb-6">
              {(['login', 'register'] as const).map((t) => (
                <button
                  key={t}
                  disabled={isSubmitting}
                  onClick={() => {
                    setTab(t);
                    setError('');
                  }}
                  className={`flex-1 py-2 text-xs font-semibold tracking-wide rounded-full transition-all ${
                    tab === t
                      ? 'bg-white/10 text-white shadow-sm'
                      : 'text-text-tertiary hover:text-text-secondary disabled:opacity-50'
                  }`}
                >
                  {t === 'login' ? 'Login' : 'Register'}
                </button>
              ))}
            </div>

            {error && (
              <div className="text-red-500 text-xs font-semibold text-center bg-red-500/10 border border-red-500/20 py-2 mb-4 rounded-xl">
                {error}
              </div>
            )}

            {/* Login Form */}
            {tab === 'login' && (
              <form onSubmit={handleLogin} className="space-y-3.5" autoComplete="off">
                <GlassInput icon={<Mail className="w-4 h-4" />} placeholder="Email or Username" value={loginEmail} onChange={setLoginEmail} id="login-email" autoComplete="off" />
                <GlassInput icon={<Lock className="w-4 h-4" />} type="password" placeholder="Password" value={loginPw} onChange={setLoginPw} id="login-password" autoComplete="new-password" />
                <button
                  type="submit"
                  disabled={!canLogin || isSubmitting}
                  className="w-full py-2.5 rounded-xl bg-white text-[#0c0c0e] font-bold text-sm shadow-glass-glow hover:bg-[#e2e8f0] active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-[#0c0c0e] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Sign In'
                  )}
                </button>
              </form>
            )}

            {/* Register Form */}
            {tab === 'register' && (
              <form onSubmit={handleRegister} className="space-y-3" autoComplete="off">
                <GlassInput icon={<Mail className="w-4 h-4" />} type="email" placeholder="Email" value={regEmail} onChange={setRegEmail} id="reg-email" autoComplete="off" />
                <GlassInput icon={<User className="w-4 h-4" />} placeholder="Username" value={regUser} onChange={setRegUser} id="reg-username" autoComplete="off" />
                <GlassInput icon={<Lock className="w-4 h-4" />} type="password" placeholder="Password" value={regPw} onChange={setRegPw} id="reg-password" autoComplete="new-password" />
                <GlassInput icon={<KeyRound className="w-4 h-4" />} type="password" placeholder="Confirm Password" value={regConfirm} onChange={setRegConfirm} id="reg-confirm" autoComplete="new-password" />

                {regPw && regConfirm && regPw !== regConfirm && (
                  <p className="text-[11px] text-red-400">Passwords do not match</p>
                )}

                <div className="p-3 rounded-xl bg-brand-cyan/[0.04] border border-brand-cyan/15 flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    id="consent-checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-0.5 accent-brand-cyan w-4 h-4 rounded border-white/10 bg-white/5 cursor-pointer shrink-0"
                  />
                  <label htmlFor="consent-checkbox" className="text-[11px] text-text-secondary leading-snug cursor-pointer select-none">
                    I consent to VeritasFlow tracking <strong className="text-white font-semibold">only the websites I explicitly provide access to</strong> — not my entire browsing activity.
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={!canRegister || isSubmitting}
                  className="w-full py-2.5 rounded-xl bg-white text-[#0c0c0e] font-bold text-sm shadow-glass-glow hover:bg-[#e2e8f0] active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-[#0c0c0e] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Create Account'
                  )}
                </button>
              </form>
            )}
          </GlassShell>
        </>
      )}
    </AnimatePresence>
  );
};

/* ══════════════════════════════════════════════════════════════
   SUCCESS MODAL — Shown after login / register
   ══════════════════════════════════════════════════════════════ */
export const SuccessModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  type: 'login' | 'register';
}> = ({ isOpen, onClose, type }) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <Backdrop onClick={onClose} />
        <GlassShell onClose={onClose}>
          <div className="flex flex-col items-center text-center space-y-4 pt-2">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-sky-200/10 to-teal-200/10 border border-white/10 flex items-center justify-center">
              <CheckCircle className="w-7 h-7 text-brand-cyan" />
            </div>

            <h3 className="font-heading text-xl font-bold text-white">
              {type === 'register' ? 'Account Created Successfully' : 'Login Successful'}
            </h3>

            <p className="text-text-secondary text-sm leading-relaxed max-w-xs">
              {type === 'register'
                ? 'Welcome to VeritasFlow. Your account has been successfully created.'
                : 'Welcome back to VeritasFlow.'}
            </p>

            <button
              onClick={onClose}
              className="mt-2 w-full py-2.5 rounded-xl bg-white text-[#0c0c0e] font-bold text-sm shadow-glass-glow hover:bg-[#e2e8f0] active:scale-[0.98] transition-all"
            >
              Continue Exploring
            </button>
          </div>
        </GlassShell>
      </>
    )}
  </AnimatePresence>
);

/* ══════════════════════════════════════════════════════════════
   EXTENSION MODAL — Extension Coming Soon
   ══════════════════════════════════════════════════════════════ */
export const ExtensionModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <Backdrop onClick={onClose} />
        <GlassShell onClose={onClose}>
          <div className="flex flex-col items-center text-center space-y-4 pt-2">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-200/10 to-sky-200/10 border border-white/10 flex items-center justify-center">
              <Puzzle className="w-7 h-7 text-brand-purple" />
            </div>

            <h3 className="font-heading text-xl font-bold text-white">
              Extension Coming Soon
            </h3>

            <p className="text-text-secondary text-sm leading-relaxed max-w-xs">
              The VeritasFlow browser extension is currently under development and will be available soon.
            </p>

            <button
              onClick={onClose}
              className="mt-2 w-full py-2.5 rounded-xl bg-white text-[#0c0c0e] font-bold text-sm shadow-glass-glow hover:bg-[#e2e8f0] active:scale-[0.98] transition-all"
            >
              Got It
            </button>
          </div>
        </GlassShell>
      </>
    )}
  </AnimatePresence>
);

/* ══════════════════════════════════════════════════════════════
   PRIVACY MODAL
   ══════════════════════════════════════════════════════════════ */
export const PrivacyModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <Backdrop onClick={onClose} />
        <GlassShell onClose={onClose} wide={true}>
          <div className="flex flex-col space-y-4 pt-2 text-left">
            <h3 className="font-heading text-xl font-bold text-white border-b border-white/10 pb-2">
              Privacy Policy
            </h3>
            <div className="text-text-secondary text-xs space-y-3 leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
              <p>
                <strong>Last Updated:</strong> June 2026
              </p>
              <p>
                VeritasFlow is built with a privacy-first architecture. This document explains how we collect, process, and protect your information.
              </p>
              <p>
                <strong>1. Strict Whitelist Tracking</strong><br />
                Our Chrome Extension only captures active tab metadata (URL, page title, and time stayed) for domains that you explicitly add to your "Website Access" whitelist on the Dashboard. If a website is not whitelisted, the tracker completely ignores it.
              </p>
              <p>
                <strong>2. Zero Tracking of Sensitive Domains</strong><br />
                We never monitor, store, or process activities on banking, shopping, messaging, or personal utility portals.
              </p>
              <p>
                <strong>3. AI Analysis & Summarization</strong><br />
                Only whitelisted URLs are processed using secure Large Language Model APIs (like Gemini via OpenRouter) to categorize the content difficulty, sentiment, and core concepts. This data is associated with your private user account token.
              </p>
              <p>
                <strong>4. Data Security</strong><br />
                All database records are securely isolated. We do not sell your browsing profiles to advertisers or third parties.
              </p>
            </div>
            <button
              onClick={onClose}
              className="mt-4 w-full py-2 rounded-xl bg-white text-[#0c0c0e] font-bold text-sm shadow-glass-glow hover:bg-[#e2e8f0] active:scale-[0.98] transition-all"
            >
              Close
            </button>
          </div>
        </GlassShell>
      </>
    )}
  </AnimatePresence>
);

/* ══════════════════════════════════════════════════════════════
   TERMS OF SERVICE MODAL
   ══════════════════════════════════════════════════════════════ */
export const TermsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <Backdrop onClick={onClose} />
        <GlassShell onClose={onClose} wide={true}>
          <div className="flex flex-col space-y-4 pt-2 text-left">
            <h3 className="font-heading text-xl font-bold text-white border-b border-white/10 pb-2">
              Terms of Service
            </h3>
            <div className="text-text-secondary text-xs space-y-3 leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
              <p>
                <strong>Last Updated:</strong> June 2026
              </p>
              <p>
                By installing the VeritasFlow Chrome Extension and using our dashboard services, you agree to these Terms.
              </p>
              <p>
                <strong>1. Service Authorization</strong><br />
                You authorize VeritasFlow to track and store metadata from websites that you Whitelist to calculate your daily Information Diet Score and provide productivity recommendations.
              </p>
              <p>
                <strong>2. Acceptable Use</strong><br />
                You agree not to bypass security measures, submit automated spam requests to the content analysis services, or exploit the local sync bridge.
              </p>
              <p>
                <strong>3. Disclaimer of Warranties</strong><br />
                VeritasFlow is provided "as is" and "as available". We do not guarantee specific skill progression, academic improvements, or employment opportunities from following our advice.
              </p>
            </div>
            <button
              onClick={onClose}
              className="mt-4 w-full py-2 rounded-xl bg-white text-[#0c0c0e] font-bold text-sm shadow-glass-glow hover:bg-[#e2e8f0] active:scale-[0.98] transition-all"
            >
              Close
            </button>
          </div>
        </GlassShell>
      </>
    )}
  </AnimatePresence>
);
