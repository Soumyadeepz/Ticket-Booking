import React, { useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider, GoogleAuthProvider } from '../utils/firebase';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  Mail,
  Lock,
  ShieldCheck,
  ArrowRight,
  Eye,
  EyeOff,
  Ticket,
  Shield,
  UserCheck,
  Sparkles,
  Zap,
  QrCode,
  Film,
  CheckCircle2,
} from 'lucide-react';

export const Login = () => {
  const { loginUser, googleLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  // Login Tab Mode: 'user' or 'admin'
  const [loginMode, setLoginMode] = useState('user');
  const [formData, setFormData] = useState({ identifier: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

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

  const handleModeSwitch = (mode) => {
    setLoginMode(mode);
    setFormData({ identifier: '', password: '' });
  };

  // Opens the real Google Account Chooser popup window (like takeUforward)
  const handleContinueWithGoogle = async () => {
    setGoogleLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const oauthCred = GoogleAuthProvider.credentialFromResult(result);
      const idToken = oauthCred?.idToken || (await result.user.getIdToken());

      const data = await googleLogin(idToken, loginMode);
      toast.success(
        loginMode === 'admin'
          ? `Signed in as Admin (${data?.user?.name || result.user.displayName})!`
          : `Signed in with Google as ${data?.user?.name || result.user.displayName}!`
      );
      navigate(loginMode === 'admin' ? '/admin' : from, { replace: true });
    } catch (err) {
      if (err?.code !== 'auth/popup-closed-by-user' && err?.code !== 'auth/cancelled-popup-request') {
        toast.error(err.response?.data?.message || err.message || 'Google login failed');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.identifier || !formData.password) {
      return toast.error('Please enter your email/username and password');
    }

    setLoading(true);
    try {
      const data = await loginUser({
        identifier: formData.identifier.trim(),
        password: formData.password,
      });

      toast.success(data.message || 'OTP sent to your email!');
      navigate('/verify-otp', {
        state: {
          email: data.email,
          purpose: 'LOGIN',
        },
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const isAdminMode = loginMode === 'admin';

  return (
    <div className="min-h-[calc(100vh-4rem)] relative flex items-center justify-center px-4 sm:px-6 py-10 overflow-hidden select-none">
      {/* === STUDIO TOP LIGHT BEAM & AURORA BACKDROP === */}
      <div
        className={`pointer-events-none absolute inset-0 transition-opacity duration-700 ${
          isAdminMode
            ? 'bg-[radial-gradient(ellipse_80%_55%_at_50%_-15%,rgba(245,158,11,0.32),rgba(234,88,12,0.08)_55%,transparent_80%)]'
            : 'bg-[radial-gradient(ellipse_80%_55%_at_50%_-15%,rgba(168,85,247,0.36),rgba(236,72,153,0.10)_55%,transparent_80%)]'
        }`}
      />

      {/* Volumetric Floating Light Orbs */}
      <div
        className={`pointer-events-none absolute -top-32 left-1/4 w-[28rem] h-[28rem] rounded-full blur-[140px] transition-all duration-700 animate-pulse ${
          isAdminMode ? 'bg-amber-500/25' : 'bg-purple-600/30'
        }`}
      />
      <div
        className={`pointer-events-none absolute -bottom-36 right-1/4 w-[30rem] h-[30rem] rounded-full blur-[150px] transition-all duration-700 ${
          isAdminMode ? 'bg-orange-600/20' : 'bg-pink-500/20'
        }`}
      />
      <div
        className={`pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[42rem] h-[20rem] rounded-full blur-[160px] opacity-30 transition-all duration-700 ${
          isAdminMode ? 'bg-yellow-500/20' : 'bg-indigo-500/25'
        }`}
      />

      {/* Subtle architectural grid light overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* === MAIN CONTAINER (2-Column Modern Showcase + Interactive Glass Card) === */}
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
        {/* LEFT COLUMN: Cinema & Experience Light Showcase */}
        <div className="hidden lg:flex lg:col-span-6 flex-col justify-between p-8 rounded-3xl relative overflow-hidden border border-white/10 bg-white/[0.02] backdrop-blur-xl shadow-2xl">
          {/* Top edge light streak */}
          <div
            className={`absolute top-0 left-10 right-10 h-[1px] bg-gradient-to-r from-transparent ${
              isAdminMode ? 'via-amber-400/80' : 'via-purple-400/80'
            } to-transparent`}
          />

          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-slate-200 shadow-sm">
              <span
                className={`w-2 h-2 rounded-full animate-ping ${
                  isAdminMode ? 'bg-amber-400' : 'bg-emerald-400'
                }`}
              />
              <span
                className={`w-2 h-2 rounded-full -ml-4 ${
                  isAdminMode ? 'bg-amber-400' : 'bg-emerald-400'
                }`}
              />
              <span>
                {isAdminMode
                  ? 'TicketBook Command & Control Center'
                  : 'Next-Gen Cinema & Live Event Booking'}
              </span>
            </div>

            <h2 className="text-4xl font-black tracking-tight text-white leading-[1.15]">
              {isAdminMode ? (
                <>
                  Manage Every{' '}
                  <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-orange-500 bg-clip-text text-transparent">
                    Screen, Show & Seat
                  </span>{' '}
                  in Real Time.
                </>
              ) : (
                <>
                  Experience Blockbusters with{' '}
                  <span className="bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
                    One-Click Booking.
                  </span>
                </>
              )}
            </h2>

            <p className="text-slate-400 text-sm leading-relaxed">
              {isAdminMode
                ? 'Authenticate with your Google Account to launch movies, configure interactive seat maps, monitor live box-office revenue, and verify bookings.'
                : 'Sign in instantly with your Google account or verified Email OTP to lock seats in real time, pay securely via Razorpay, and download QR e-tickets.'}
            </p>

            {/* Illuminated Feature Cards */}
            <div className="grid grid-cols-2 gap-3.5 pt-2">
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all group">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2.5 ${
                    isAdminMode
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      : 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                  }`}
                >
                  <Zap className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-white">Instant Google OAuth</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  One-click popup account chooser with zero friction
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all group">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2.5 ${
                    isAdminMode
                      ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30'
                      : 'bg-pink-500/15 text-pink-400 border border-pink-500/30'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-white">
                  {isAdminMode ? 'Live Analytics & CRUD' : 'QR PDF E-Tickets'}
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {isAdminMode
                    ? 'Add movies, shows & track revenue live'
                    : 'Instant downloadable PDF passes with QR check-in'}
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Trust Strip */}
          <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle2
                className={`w-4 h-4 ${isAdminMode ? 'text-amber-400' : 'text-emerald-400'}`}
              />
              <span>256-bit JWT + OAuth 2.0 Verified</span>
            </div>
            <div className="flex items-center gap-1.5 font-semibold text-slate-300">
              <Film className="w-4 h-4 text-purple-400" />
              <span>IMAX • Dolby Atmos</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Illuminated Login Card */}
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
                background: `radial-gradient(380px circle at ${spotlight.x}px ${spotlight.y}px, ${
                  isAdminMode ? 'rgba(245, 158, 11, 0.16)' : 'rgba(168, 85, 247, 0.18)'
                }, transparent 70%)`,
              }}
            />

            {/* Top Neon Rim Light */}
            <div
              className={`pointer-events-none absolute top-0 left-8 right-8 h-[2px] bg-gradient-to-r from-transparent ${
                isAdminMode
                  ? 'via-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.9)]'
                  : 'via-purple-400 shadow-[0_0_25px_rgba(168,85,247,0.9)]'
              } to-transparent transition-all duration-500`}
            />

            {/* Ambient Corner Glow Inside Card */}
            <div
              className={`pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-32 rounded-full blur-3xl transition-colors duration-500 ${
                isAdminMode ? 'bg-amber-500/20' : 'bg-purple-500/25'
              }`}
            />

            <div className="relative z-10">
              {/* Header */}
              <div className="text-center mb-6">
                <div className="relative inline-flex mb-3">
                  <div
                    className={`absolute -inset-2 rounded-2xl blur-lg opacity-60 transition-colors duration-500 ${
                      isAdminMode
                        ? 'bg-gradient-to-tr from-amber-500 to-orange-500'
                        : 'bg-gradient-to-tr from-purple-600 to-pink-500'
                    }`}
                  />
                  <div
                    className={`relative inline-flex items-center justify-center w-14 h-14 rounded-2xl border shadow-inner transition-all duration-300 ${
                      isAdminMode
                        ? 'bg-[#17130a] border-amber-400/40 text-amber-400'
                        : 'bg-[#130f24] border-purple-400/40 text-purple-400'
                    }`}
                  >
                    {isAdminMode ? (
                      <Shield className="w-7 h-7 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
                    ) : (
                      <Ticket className="w-7 h-7 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                    )}
                  </div>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/[0.06] border border-white/10 text-[10px] font-bold tracking-widest uppercase text-slate-300 mb-2">
                  <Sparkles
                    className={`w-3 h-3 ${isAdminMode ? 'text-amber-400' : 'text-purple-400'}`}
                  />
                  {isAdminMode ? 'Admin Access Mode' : 'Member Access Portal'}
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {isAdminMode ? 'Admin Portal Sign In' : 'Welcome Back'}
                </h1>
                <p className="text-slate-400 text-xs sm:text-sm mt-1">
                  {isAdminMode
                    ? 'Authenticate with your Google Account to manage movies & shows'
                    : 'Choose your Google account or login with Email & OTP'}
                </p>
              </div>

              {/* User Login / Admin Login Illuminated Segmented Switcher */}
              <div className="grid grid-cols-2 gap-2 p-1.5 bg-[#07070d] border border-white/10 rounded-2xl mb-6 shadow-inner">
                <button
                  type="button"
                  onClick={() => handleModeSwitch('user')}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-300 ${
                    !isAdminMode
                      ? 'bg-gradient-to-r from-purple-600 via-purple-500 to-fuchsia-600 text-white shadow-[0_0_20px_rgba(168,85,247,0.45)] border border-white/20'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                  <span>User Login</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleModeSwitch('admin')}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-300 ${
                    isAdminMode
                      ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.45)] border border-amber-200/40'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  <span>Admin Login</span>
                </button>
              </div>

              {/* takeUforward-Style "Continue with Google" Button with Light Sweep */}
              <div className="mb-6">
                <button
                  type="button"
                  onClick={handleContinueWithGoogle}
                  disabled={googleLoading}
                  className={`group relative w-full py-3.5 px-4 font-bold rounded-2xl overflow-hidden transition-all duration-300 flex items-center justify-center gap-3 active:scale-[0.99] disabled:opacity-60 border ${
                    isAdminMode
                      ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-orange-400 hover:from-amber-300 hover:to-orange-300 text-slate-950 border-amber-200/50 shadow-[0_10px_30px_-5px_rgba(245,158,11,0.4)]'
                      : 'bg-gradient-to-b from-[#1f1f33] to-[#151525] hover:from-[#282842] hover:to-[#1b1b30] text-white border-white/15 hover:border-purple-400/50 shadow-[0_10px_30px_-5px_rgba(168,85,247,0.25)]'
                  }`}
                >
                  {/* Animated Shimmer Light Sweep */}
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
                    {googleLoading
                      ? 'Opening Google Account Chooser...'
                      : isAdminMode
                        ? 'Continue with Google as Admin'
                        : 'Continue with Google'}
                  </span>

                  <ArrowRight className="w-4 h-4 opacity-75 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              {!isAdminMode ? (
                <>
                  <div className="relative flex py-1.5 items-center mb-5">
                    <div className="flex-grow border-t border-white/10"></div>
                    <span className="flex-shrink mx-3 text-slate-500 text-[11px] uppercase tracking-widest font-semibold">
                      Or Login with Email & OTP
                    </span>
                    <div className="flex-grow border-t border-white/10"></div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                        Email Address or Username
                      </label>
                      <div className="relative group">
                        <Mail className="w-4 h-4 text-slate-500 group-focus-within:text-purple-400 transition-colors absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="you@gmail.com"
                          value={formData.identifier}
                          onChange={(e) =>
                            setFormData({ ...formData, identifier: e.target.value })
                          }
                          className="w-full pl-10 pr-4 py-3 bg-[#07070d]/90 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/25 transition-all text-sm"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                        Password
                      </label>
                      <div className="relative group">
                        <Lock className="w-4 h-4 text-slate-500 group-focus-within:text-purple-400 transition-colors absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={formData.password}
                          onChange={(e) =>
                            setFormData({ ...formData, password: e.target.value })
                          }
                          className="w-full pl-10 pr-11 py-3 bg-[#07070d]/90 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/25 transition-all text-sm"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 px-4 bg-gradient-to-r from-purple-600 via-purple-500 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white font-bold rounded-xl shadow-[0_10px_25px_-5px_rgba(168,85,247,0.5)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.99]"
                    >
                      {loading ? (
                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <ShieldCheck className="w-5 h-5" />
                          <span>Send OTP to Email & Login</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>

                  <p className="text-center text-slate-400 text-xs sm:text-sm mt-6">
                    New to TicketBook?{' '}
                    <Link
                      to="/register"
                      className="text-purple-400 hover:text-purple-300 font-bold transition-colors underline decoration-purple-500/40 underline-offset-4"
                    >
                      Create an account
                    </Link>
                  </p>
                </>
              ) : (
                <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/25 text-center space-y-2.5 shadow-inner">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-bold uppercase tracking-wider">
                    <Shield className="w-3.5 h-3.5" />
                    Google OAuth Admin Verification
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Click <strong>Continue with Google as Admin</strong> above to select your Google account from the browser popup and enter the{' '}
                    <span className="text-amber-300 font-semibold">Admin Dashboard</span> directly.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
