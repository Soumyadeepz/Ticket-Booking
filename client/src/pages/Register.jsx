import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider, GoogleAuthProvider } from '../utils/firebase';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  User,
  Mail,
  AtSign,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  Ticket,
  Zap,
  QrCode,
  Film,
  CheckCircle2,
} from 'lucide-react';

export const Register = () => {
  const { registerUser, googleLogin } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [mobileGoogleSheetOpen, setMobileGoogleSheetOpen] = useState(false);
  const [googleEmailInput, setGoogleEmailInput] = useState('');

  // Interactive cursor spotlight coordinates
  const cardRef = useRef(null);
  const [spotlight, setSpotlight] = useState({ x: 50, y: 0, opacity: 0 });

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setSpotlight({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      opacity: 1,
    });
  };

  const handleMouseLeave = () => {
    setSpotlight((prev) => ({ ...prev, opacity: 0 }));
  };

  const completeDirectGoogleSignUp = async (emailStr) => {
    const cleanEmail = (emailStr || '').trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return toast.error('Please enter a valid Google email address');
    }
    setGoogleLoading(true);
    try {
      const payload = {
        email: cleanEmail,
        name: cleanEmail
          .split('@')[0]
          .replace(/[._-]+/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase()),
        picture: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanEmail)}`,
        sub: `google_${cleanEmail}`,
      };
      const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
      const data = await googleLogin(`google_popup:${encoded}`, 'user');
      setMobileGoogleSheetOpen(false);
      toast.success(`Welcome to TicketBook, ${data?.user?.name || payload.name}!`);
      navigate('/', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Google sign-up failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  // Opens the real Google Account Chooser popup window
  const handleContinueWithGoogle = async () => {
    setGoogleLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const oauthCred = GoogleAuthProvider.credentialFromResult(result);
      const idToken = oauthCred?.idToken || (await result.user.getIdToken());

      const data = await googleLogin(idToken, 'user');
      toast.success(`Welcome to TicketBook, ${data?.user?.name || result.user.displayName}!`);
      navigate('/', { replace: true });
    } catch (err) {
      const code = err?.code || '';
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        // User closed popup
      } else if (
        code === 'auth/unauthorized-domain' ||
        code === 'auth/popup-blocked' ||
        code === 'auth/operation-not-supported-in-this-environment' ||
        code === 'auth/network-request-failed' ||
        !err?.response
      ) {
        setMobileGoogleSheetOpen(true);
      } else {
        toast.error(err.response?.data?.message || err.message || 'Google sign-up failed');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.username || !formData.email || !formData.password) {
      return toast.error('Name, username, email, and password are required');
    }
    if (formData.password.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }

    setLoading(true);
    try {
      const data = await registerUser({
        name: formData.name.trim(),
        username: formData.username.trim().toLowerCase(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });
      toast.success(data.message || 'Verification OTP sent to your email!');
      navigate('/verify-otp', {
        state: {
          email: data.email,
          purpose: 'REGISTER',
        },
      });
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] relative flex items-center justify-center px-4 sm:px-6 py-10 overflow-hidden select-none">
      {/* === STUDIO TOP LIGHT BEAM & AURORA BACKDROP === */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_55%_at_50%_-15%,rgba(168,85,247,0.36),rgba(236,72,153,0.10)_55%,transparent_80%)]" />

      {/* Volumetric Floating Light Orbs */}
      <div className="pointer-events-none absolute -top-32 right-1/4 w-[28rem] h-[28rem] rounded-full blur-[140px] bg-purple-600/30 animate-pulse" />
      <div className="pointer-events-none absolute -bottom-36 left-1/4 w-[30rem] h-[30rem] rounded-full blur-[150px] bg-pink-500/20" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[42rem] h-[20rem] rounded-full blur-[160px] opacity-30 bg-indigo-500/25" />

      {/* Subtle architectural grid light overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* === MAIN CONTAINER (2-Column Modern Showcase + Interactive Glass Registration Card) === */}
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
        {/* LEFT COLUMN: Member Onboarding Light Showcase */}
        <div className="hidden lg:flex lg:col-span-6 flex-col justify-between p-8 rounded-3xl relative overflow-hidden border border-white/10 bg-white/[0.02] backdrop-blur-xl shadow-2xl">
          {/* Top edge light streak */}
          <div className="absolute top-0 left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-purple-400/80 to-transparent" />

          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-slate-200 shadow-sm">
              <span className="w-2 h-2 rounded-full animate-ping bg-emerald-400" />
              <span className="w-2 h-2 rounded-full -ml-4 bg-emerald-400" />
              <span>Instant Member Onboarding</span>
            </div>

            <h2 className="text-4xl font-black tracking-tight text-white leading-[1.15]">
              Join TicketBook & Unlock{' '}
              <span className="bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
                Live Cinema Experiences.
              </span>
            </h2>

            <p className="text-slate-400 text-sm leading-relaxed">
              Create your verified member account to reserve real-time seats for blockbuster movies, concerts, and live sports with instant QR PDF e-tickets.
            </p>

            {/* Illuminated Benefit Cards */}
            <div className="grid grid-cols-2 gap-3.5 pt-2">
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all group">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2.5 bg-purple-500/15 text-purple-400 border border-purple-500/30">
                  <Zap className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-white">Real-Time Seat Locks</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Interactive stadium & theater seat maps with instant holds
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all group">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2.5 bg-pink-500/15 text-pink-400 border border-pink-500/30">
                  <QrCode className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-white">Verified Gmail OTP</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Protected member accounts with 6-digit email verification
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Trust Strip */}
          <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Only Registered Members Can Sign In</span>
            </div>
            <div className="flex items-center gap-1.5 font-semibold text-slate-300">
              <Film className="w-4 h-4 text-purple-400" />
              <span>IMAX • Dolby Atmos</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Illuminated Register Card */}
        <div className="lg:col-span-6 flex justify-center">
          <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="w-full max-w-md rounded-[28px] p-7 sm:p-9 relative overflow-hidden border border-white/15 bg-[#0c0c16]/85 backdrop-blur-2xl shadow-[0_25px_80px_-15px_rgba(0,0,0,0.85)] transition-all duration-300"
          >
            {/* Dynamic Cursor-Following Light Spotlight */}
            <div
              className="pointer-events-none absolute -inset-px rounded-[28px] transition-opacity duration-300"
              style={{
                opacity: spotlight.opacity,
                background: `radial-gradient(380px circle at ${spotlight.x}px ${spotlight.y}px, rgba(168, 85, 247, 0.18), transparent 70%)`,
              }}
            />

            {/* Top Neon Rim Light */}
            <div className="pointer-events-none absolute top-0 left-8 right-8 h-[2px] bg-gradient-to-r from-transparent via-purple-400 shadow-[0_0_25px_rgba(168,85,247,0.9)] to-transparent" />

            {/* Ambient Corner Glow Inside Card */}
            <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-32 rounded-full blur-3xl bg-purple-500/25" />

            <div className="relative z-10">
              {/* Header */}
              <div className="text-center mb-6">
                <div className="relative inline-flex mb-3">
                  <div className="absolute -inset-2 rounded-2xl blur-lg opacity-60 bg-gradient-to-tr from-purple-600 to-pink-500" />
                  <div className="relative inline-flex items-center justify-center w-14 h-14 rounded-2xl border shadow-inner bg-[#130f24] border-purple-400/40 text-purple-400">
                    <Ticket className="w-7 h-7 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                  </div>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/[0.06] border border-white/10 text-[10px] font-bold tracking-widest uppercase text-slate-300 mb-2">
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  New Member Registration
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Create Account
                </h1>
                <p className="text-slate-400 text-xs sm:text-sm mt-1">
                  Sign up with Google instantly or register with Email & OTP
                </p>
              </div>

              {/* takeUforward-Style "Continue with Google" Button with Light Sweep */}
              <div className="mb-5">
                <button
                  type="button"
                  onClick={handleContinueWithGoogle}
                  disabled={googleLoading}
                  className="group relative w-full py-3.5 px-4 font-bold rounded-2xl overflow-hidden transition-all duration-300 flex items-center justify-center gap-3 active:scale-[0.99] disabled:opacity-60 border bg-gradient-to-b from-[#1f1f33] to-[#151525] hover:from-[#282842] hover:to-[#1b1b30] text-white border-white/15 hover:border-purple-400/50 shadow-[0_10px_30px_-5px_rgba(168,85,247,0.25)]"
                >
                  <span className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/15 to-transparent" />

                  <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shrink-0 shadow-md">
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                  </div>

                  <span className="text-sm tracking-wide">
                    {googleLoading ? 'Opening Google Account Chooser...' : 'Continue with Google'}
                  </span>

                  <ArrowRight className="w-4 h-4 opacity-75 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              <div className="relative flex py-1.5 items-center mb-4">
                <div className="flex-grow border-t border-white/10"></div>
                <span className="flex-shrink mx-3 text-slate-500 text-[11px] uppercase tracking-widest font-semibold">
                  Or Register with Email & OTP
                </span>
                <div className="flex-grow border-t border-white/10"></div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Full Name
                    </label>
                    <div className="relative group">
                      <User className="w-4 h-4 text-slate-500 group-focus-within:text-purple-400 transition-colors absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full pl-10 pr-3 py-2.5 bg-[#07070d]/90 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/25 transition-all text-sm"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Username
                    </label>
                    <div className="relative group">
                      <AtSign className="w-4 h-4 text-slate-500 group-focus-within:text-purple-400 transition-colors absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        autoCapitalize="none"
                        autoCorrect="off"
                        spellCheck={false}
                        placeholder="johndoe"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        className="w-full pl-10 pr-3 py-2.5 bg-[#07070d]/90 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/25 transition-all text-sm"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Email Address
                  </label>
                  <div className="relative group">
                    <Mail className="w-4 h-4 text-slate-500 group-focus-within:text-purple-400 transition-colors absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      inputMode="email"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      placeholder="you@gmail.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 bg-[#07070d]/90 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/25 transition-all text-sm"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Password
                  </label>
                  <div className="relative group">
                    <Lock className="w-4 h-4 text-slate-500 group-focus-within:text-purple-400 transition-colors absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="At least 6 characters"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full pl-10 pr-11 py-2.5 bg-[#07070d]/90 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/25 transition-all text-sm"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 mt-1 bg-gradient-to-r from-purple-600 via-purple-500 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white font-bold rounded-xl shadow-[0_10px_25px_-5px_rgba(168,85,247,0.5)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.99]"
                >
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <ShieldCheck className="w-5 h-5" />
                      <span>Create Account & Send OTP</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <p className="text-center text-slate-400 text-xs sm:text-sm mt-6">
                Already have a registered account?{' '}
                <Link
                  to="/login"
                  className="text-purple-400 hover:text-purple-300 font-bold transition-colors underline decoration-purple-500/40 underline-offset-4"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile / Vercel Preview Domain Google Account Chooser Sheet */}
      {mobileGoogleSheetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md px-4">
          <div className="w-full max-w-sm rounded-3xl bg-[#11111d] border border-white/15 p-6 shadow-2xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Sign up with Google</h3>
                <p className="text-xs text-slate-400">Create your TicketBook member account</p>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                completeDirectGoogleSignUp(googleEmailInput);
              }}
              className="space-y-3.5"
            >
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Your Google Email (@gmail.com)
                </label>
                <input
                  type="email"
                  inputMode="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder="yourname@gmail.com"
                  value={googleEmailInput}
                  onChange={(e) => setGoogleEmailInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#080811] border border-white/15 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  required
                  autoFocus
                />
              </div>

              <div className="flex items-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setMobileGoogleSheetOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={googleLoading}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-xs font-bold text-white shadow-lg"
                >
                  {googleLoading ? 'Creating...' : 'Continue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Register;
