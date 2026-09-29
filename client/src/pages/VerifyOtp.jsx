import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, RefreshCw, Mail, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export const VerifyOtp = () => {
  const { pendingOtp, verifyOtpCode, resendOtpCode } = useAuth();
  const navigate = useNavigate();

  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [cooldown, setCooldown] = useState(pendingOtp?.cooldownSeconds || 30);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef([]);

  const email = pendingOtp?.email || '';
  const purpose = pendingOtp?.purpose || 'LOGIN';

  useEffect(() => {
    if (!email) {
      navigate('/login');
    } else {
      inputRefs.current[0]?.focus();
    }
  }, [email, navigate]);

  // 30-Second Resend Cooldown Timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleDigitChange = (idx, value) => {
    const cleaned = value.replace(/\D/g, '');
    if (!cleaned) {
      const updated = [...digits];
      updated[idx] = '';
      setDigits(updated);
      return;
    }

    const char = cleaned.slice(-1);
    const updated = [...digits];
    updated[idx] = char;
    setDigits(updated);

    if (idx < 5) {
      inputRefs.current[idx + 1]?.focus();
    }
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  };

  // Full 6-digit clipboard paste handler
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pastedData) return;

    const updated = ['', '', '', '', '', ''];
    for (let i = 0; i < 6; i++) {
      updated[i] = pastedData[i] || '';
    }
    setDigits(updated);

    const focusIdx = Math.min(pastedData.length, 5);
    inputRefs.current[focusIdx]?.focus();
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    const otpString = digits.join('');
    if (otpString.length !== 6) {
      toast.error('Please enter the 6-digit OTP sent to your email.');
      return;
    }

    try {
      setVerifying(true);
      const data = await verifyOtpCode({ email, otp: otpString, purpose });
      toast.success(data.message || 'OTP Verified! Welcome to TicketBook.');
      navigate(data.user?.role === 'admin' ? '/admin' : '/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP code. Please check your email.');
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    try {
      setResending(true);
      const data = await resendOtpCode({ email, purpose });
      setCooldown(data.cooldownSeconds || 30);
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      toast.success(data.message || `New 6-digit OTP sent to ${email}`);
    } catch (err) {
      const retry = err.response?.data?.details?.retryAfter;
      if (retry) setCooldown(retry);
      toast.error(err.response?.data?.message || 'Could not resend OTP');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-[82vh] flex items-center justify-center px-4 py-12">
      <div className="glass-card w-full max-w-md rounded-3xl p-8 border border-white/15 space-y-6 shadow-glow">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
        </Link>

        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-purple-600/20 border border-purple-500/40 text-purple-400 flex items-center justify-center mx-auto">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="font-display font-black text-3xl text-white">Verify 6-Digit OTP</h1>
          <p className="text-xs sm:text-sm text-zinc-400">
            We sent a 6-digit verification code to{' '}
            <strong className="text-white">{email}</strong>. Enter the valid code from your email to complete login.
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/25 flex items-center gap-2.5 text-xs text-zinc-300">
          <Mail className="w-4 h-4 text-purple-400 shrink-0" />
          <span>
            Check your inbox for <strong className="text-white">{email}</strong> and enter the 6-digit code below.
          </span>
        </div>

        <form onSubmit={handleVerifySubmit} className="space-y-6">
          {/* 6-Box OTP Input (Strict manual entry / paste only — never auto-filled) */}
          <div className="flex items-center justify-between gap-2 sm:gap-3" onPaste={handlePaste}>
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => (inputRefs.current[idx] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className="w-12 h-14 sm:w-13 sm:h-16 rounded-2xl bg-zinc-950/90 border-2 border-white/15 focus:border-purple-500 focus:shadow-glow text-center font-display font-black text-2xl text-white focus:outline-none transition-all"
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={verifying || digits.join('').length !== 6}
            className="w-full py-3.5 rounded-xl btn-gradient font-bold text-sm disabled:opacity-50"
          >
            {verifying ? 'Verifying OTP...' : 'Verify OTP & Login'}
          </button>
        </form>

        {/* Resend OTP with 30s Cooldown Timer */}
        <div className="text-center pt-2 border-t border-white/10">
          <button
            type="button"
            disabled={cooldown > 0 || resending}
            onClick={handleResend}
            className="inline-flex items-center gap-2 text-xs font-bold text-purple-400 hover:text-purple-300 disabled:text-zinc-500 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
            {cooldown > 0
              ? `Resend OTP available in ${cooldown}s`
              : resending
              ? 'Sending new OTP...'
              : 'Resend 6-Digit OTP'}
          </button>
        </div>
      </div>
    </div>
  );
};
