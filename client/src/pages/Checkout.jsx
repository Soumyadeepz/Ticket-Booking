import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Clock,
  CreditCard,
  Smartphone,
  Wallet,
  Building2,
  ShieldCheck,
  MapPin,
  ArrowLeft,
  CheckCircle2,
  Lock,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { ErrorState } from '../components/ErrorState';

export const Checkout = () => {
  const { showId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [show, setShow] = useState(null);
  const [seats, setSeats] = useState([]);
  const [expiresAt, setExpiresAt] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(300);
  const [paymentMethod, setPaymentMethod] = useState('RAZORPAY');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Interactive Razorpay Test Modal state when using test/sandbox keys
  const [rzpTestModal, setRzpTestModal] = useState(null);

  const loadCheckoutState = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/shows/${showId}`);
      setShow(res.data.show);

      const savedRaw = sessionStorage.getItem(`tb_checkout_${showId}`);
      const saved = savedRaw ? JSON.parse(savedRaw) : null;

      const activeIds =
        res.data.myHeldSeats?.length > 0
          ? res.data.myHeldSeats
          : saved?.seats?.map((s) => s.seatId) || [];

      if (activeIds.length === 0) {
        toast.error('No active held seats found. Please select your seats.');
        navigate(`/shows/${showId}/seats`);
        return;
      }

      const matchedSeats = [];
      for (const rowObj of res.data.seatLayout || []) {
        for (const seat of rowObj.seats) {
          if (activeIds.includes(seat.seatId)) {
            matchedSeats.push(seat);
          }
        }
      }
      setSeats(matchedSeats);

      const expiryTime = res.data.myHoldExpiresAt || saved?.expiresAt;
      if (expiryTime) {
        setExpiresAt(new Date(expiryTime));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load checkout session.');
    } finally {
      setLoading(false);
    }
  }, [showId, navigate]);

  useEffect(() => {
    loadCheckoutState();
  }, [loadCheckoutState]);

  // Live 5-min hold countdown timer
  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => {
      const diff = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
      setSecondsLeft(diff);
      if (diff === 0) {
        toast.error('Seat hold expired! Returning to seat selection.');
        navigate(`/shows/${showId}/seats`);
      }
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [expiresAt, navigate, showId]);

  const subTotal = seats.reduce((sum, s) => sum + s.price, 0);
  const convenienceFee = Math.round(subTotal * 0.08);
  const totalAmount = subTotal + convenienceFee;

  const verifyPaymentOnServer = async (verifyPayload) => {
    try {
      setSubmitting(true);
      const res = await api.post('/payments/verify', verifyPayload);
      sessionStorage.removeItem(`tb_checkout_${showId}`);
      setRzpTestModal(null);
      toast.success('Payment verified! Booking confirmed & email dispatched.');
      navigate(`/booking-success/${res.data.booking._id}`);
    } catch (err) {
      setRzpTestModal(null);
      toast.error(
        err.response?.data?.message ||
          'Payment verification failed. Held seats have been released.'
      );
      navigate(`/shows/${showId}/seats`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleInitiateRazorpay = async () => {
    try {
      setSubmitting(true);
      const seatIds = seats.map((s) => s.seatId);

      // 1. Create PENDING booking before Razorpay checkout
      const bookingRes = await api.post('/bookings', {
        showId,
        seatIds,
        paymentMethod,
        initiatePayment: true,
      });
      const pendingBooking = bookingRes.data.booking;

      // 2. Create Razorpay Order via POST /api/payments/create-order
      const orderRes = await api.post('/payments/create-order', {
        bookingId: pendingBooking._id,
      });

      const {
        orderId,
        amount,
        currency,
        keyId,
        isSimulatedTestOrder,
        testPaymentId,
        testSignature,
      } = orderRes.data;

      // 3. Open live Razorpay Checkout if live test key is used and SDK is loaded
      if (!isSimulatedTestOrder && window.Razorpay) {
        const rzpOptions = {
          key: keyId,
          amount,
          currency,
          name: 'TicketBook Cinema',
          description: `${show.event?.title} (${seatIds.join(', ')})`,
          order_id: orderId,
          prefill: {
            name: user?.name || '',
            email: user?.email || '',
            contact: user?.phone || '9999999999',
          },
          theme: {
            color: '#9333ea',
          },
          handler: async (response) => {
            await verifyPaymentOnServer({
              bookingId: pendingBooking._id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
          },
          modal: {
            ondismiss: async () => {
              // Mark booking failed & release seats if user cancels payment modal
              await verifyPaymentOnServer({
                bookingId: pendingBooking._id,
                razorpay_order_id: orderId,
                razorpay_payment_id: 'pay_cancelled',
                razorpay_signature: 'invalid_signature',
              });
            },
          },
        };

        const rzpInstance = new window.Razorpay(rzpOptions);
        rzpInstance.open();
        setSubmitting(false);
        return;
      }

      // Otherwise open our interactive Razorpay Test Mode Checkout Modal
      setRzpTestModal({
        bookingId: pendingBooking._id,
        bookingCode: pendingBooking.bookingCode,
        orderId,
        amount: totalAmount,
        keyId,
        testPaymentId,
        testSignature,
      });
      setSubmitting(false);
    } catch (err) {
      setSubmitting(false);
      toast.error(err.response?.data?.message || 'Could not initialize Razorpay order.');
      if (err.response?.status === 409) {
        navigate(`/shows/${showId}/seats`);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-[65vh] flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-purple-500/30 border-t-purple-500 animate-spin" />
      </div>
    );
  }

  if (error || !show) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <ErrorState
          title="Checkout Unavailable"
          message={error || 'Could not load show details for checkout.'}
          onRetry={loadCheckoutState}
        />
      </div>
    );
  }

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const secs = String(secondsLeft % 60).padStart(2, '0');

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            to={`/shows/${showId}/seats`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-400 hover:text-purple-300"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Modify Seats
          </Link>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-white mt-1">
            Razorpay Secure Checkout
          </h1>
        </div>

        <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-rose-500/15 border border-rose-500/40">
          <Clock className="w-5 h-5 text-rose-400 animate-pulse" />
          <div>
            <p className="text-[11px] uppercase font-bold tracking-wider text-rose-300">
              Seat Hold Expires In
            </p>
            <p className="font-display font-black text-xl text-white">
              {mins}:{secs}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Payment Options */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/10 space-y-6">
            <h2 className="font-display font-bold text-xl text-white">
              Select Payment Method (Razorpay Gateway)
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  id: 'RAZORPAY',
                  label: 'Razorpay All-in-One',
                  desc: 'UPI, Cards, NetBanking & Wallets',
                  icon: ShieldCheck,
                },
                {
                  id: 'UPI',
                  label: 'Razorpay Instant UPI',
                  desc: 'GPay, PhonePe, Paytm, BHIM',
                  icon: Smartphone,
                },
                {
                  id: 'CARD',
                  label: 'Credit / Debit Cards',
                  desc: 'Visa, Mastercard, RuPay, Amex',
                  icon: CreditCard,
                },
                {
                  id: 'NETBANKING',
                  label: 'NetBanking & Wallets',
                  desc: 'All Indian & International Banks',
                  icon: Building2,
                },
              ].map((method) => {
                const Icon = method.icon;
                const active = paymentMethod === method.id;
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setPaymentMethod(method.id)}
                    className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3.5 ${
                      active
                        ? 'bg-purple-600/20 border-purple-400 shadow-glow'
                        : 'bg-white/5 border-white/10 hover:border-white/25'
                    }`}
                  >
                    <div
                      className={`p-2.5 rounded-xl ${
                        active ? 'keep-white bg-purple-600 text-white' : 'bg-white/10 text-zinc-400'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-sm text-white">{method.label}</p>
                        {active && <CheckCircle2 className="w-4 h-4 text-purple-400" />}
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5">{method.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="p-5 rounded-2xl bg-zinc-950/80 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                  Razorpay Server-Verified Flow
                </span>
                <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
                  <Lock className="w-3.5 h-3.5" /> HMAC-SHA256 Signature Check
                </span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                1. Creates a <strong className="text-white">PENDING</strong> booking & Razorpay Order{' '}
                (<code className="text-purple-300">/api/payments/create-order</code>).
                <br />
                2. Verifies the cryptographic Razorpay signature server-side (
                <code className="text-purple-300">/api/payments/verify</code>) before marking your
                booking <strong className="text-emerald-400">CONFIRMED</strong> and emailing your
                e-ticket.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary */}
        <div className="space-y-6">
          <div className="glass-card rounded-3xl p-6 border border-white/10 space-y-5">
            <div className="flex gap-4 items-center pb-4 border-b border-white/10">
              <img
                src={show.event?.posterUrl}
                alt={show.event?.title}
                className="w-16 h-24 rounded-xl object-cover border border-white/10"
              />
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400">
                  {show.event?.category}
                </span>
                <h3 className="font-display font-bold text-lg text-white leading-snug">
                  {show.event?.title}
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  {show.event?.language} • {show.venue.screenName}
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs text-zinc-300">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <span>
                  {show.venue.name}, {show.venue.city}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-rose-400 shrink-0" />
                <span>
                  {new Date(show.startTime).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}{' '}
                  •{' '}
                  {new Date(show.startTime).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>

            {/* Seat Breakdown */}
            <div className="pt-4 border-t border-white/10 space-y-2.5">
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Selected Seats ({seats.length})
              </p>
              {seats.map((seat) => (
                <div key={seat.seatId} className="flex items-center justify-between text-sm">
                  <span className="text-zinc-200 font-medium">
                    Seat <strong className="text-white">{seat.seatId}</strong> ({seat.category})
                  </span>
                  <span className="font-semibold text-white">₹{seat.price}</span>
                </div>
              ))}
            </div>

            {/* Price Breakdown */}
            <div className="pt-4 border-t border-white/10 space-y-2 text-sm">
              <div className="flex justify-between text-zinc-400">
                <span>Ticket Subtotal</span>
                <span>₹{subTotal}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Convenience Fee (8%)</span>
                <span>₹{convenienceFee}</span>
              </div>
              <div className="flex justify-between text-lg font-display font-black text-white pt-2 border-t border-white/10">
                <span>Total Payable</span>
                <span className="text-gradient">₹{totalAmount}</span>
              </div>
            </div>

            <button
              onClick={handleInitiateRazorpay}
              disabled={submitting}
              className="keep-white w-full py-4 rounded-2xl btn-gradient font-display font-bold text-base shadow-glow disabled:opacity-50"
            >
              {submitting ? 'Opening Razorpay...' : `Pay ₹${totalAmount} with Razorpay`}
            </button>
          </div>
        </div>
      </div>

      {/* RAZORPAY TEST MODE INTERACTIVE CHECKOUT MODAL */}
      {rzpTestModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full rounded-3xl overflow-hidden border border-purple-500/40 shadow-2xl">
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-rose-600 p-5 text-white flex items-center justify-between">
              <div>
                <span className="keep-white text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded bg-black/30">
                  Razorpay Test Mode Gateway
                </span>
                <h3 className="keep-white font-display font-black text-xl mt-1">
                  TicketBook Cinema
                </h3>
                <p className="keep-white text-xs opacity-90">Order ID: {rzpTestModal.orderId}</p>
              </div>
              <div className="text-right">
                <p className="keep-white text-xs opacity-80">Payable</p>
                <p className="keep-white font-display font-black text-2xl">
                  ₹{rzpTestModal.amount}
                </p>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-white/10 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Booking Ref:</span>
                  <span className="font-mono font-bold text-white">
                    {rzpTestModal.bookingCode}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Seats Locked:</span>
                  <span className="font-bold text-purple-300">
                    {seats.map((s) => s.seatId).join(', ')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Customer:</span>
                  <span className="text-white">{user?.email}</span>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() =>
                    verifyPaymentOnServer({
                      bookingId: rzpTestModal.bookingId,
                      razorpay_order_id: rzpTestModal.orderId,
                      razorpay_payment_id: rzpTestModal.testPaymentId,
                      razorpay_signature: rzpTestModal.testSignature,
                    })
                  }
                  className="keep-white w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {submitting
                    ? 'Verifying Signature...'
                    : `Authorize Test Payment (₹${rzpTestModal.amount})`}
                </button>

                <button
                  type="button"
                  disabled={submitting}
                  onClick={() =>
                    verifyPaymentOnServer({
                      bookingId: rzpTestModal.bookingId,
                      razorpay_order_id: rzpTestModal.orderId,
                      razorpay_payment_id: 'pay_failed_test',
                      razorpay_signature: 'invalid_signature_test',
                    })
                  }
                  className="w-full py-3 rounded-2xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-bold text-xs flex items-center justify-center gap-2 transition-all"
                >
                  <XCircle className="w-4 h-4" />
                  Simulate Failed Payment (Releases Seat Holds)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
