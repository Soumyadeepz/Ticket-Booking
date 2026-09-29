import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import {
  Calendar,
  MapPin,
  Ticket,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  QrCode,
  X,
  Clock,
  Download,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { ErrorState } from '../components/ErrorState';

export const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [cancelModalBooking, setCancelModalBooking] = useState(null);
  const [cancelReason, setCancelReason] = useState('Change of plans');
  const [cancelling, setCancelling] = useState(false);
  const [qrModalBooking, setQrModalBooking] = useState(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/bookings/my');
      setBookings(res.data.bookings || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load booking history');
      toast.error('Failed to load booking history');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTicket = async (booking) => {
    try {
      setDownloadingId(booking._id);
      const response = await api.get(`/bookings/${booking._id}/ticket`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `TicketBook-${booking.bookingCode || booking._id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Ticket PDF downloaded!');
    } catch (err) {
      toast.error('Could not download ticket PDF');
    } finally {
      setDownloadingId(null);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const categorized = useMemo(() => {
    const now = Date.now();
    const upcoming = [];
    const past = [];
    const cancelled = [];

    for (const b of bookings) {
      const showTimeMs = b.show?.startTime ? new Date(b.show.startTime).getTime() : 0;
      if (b.status === 'CANCELLED') {
        cancelled.push(b);
      } else if (showTimeMs >= now) {
        upcoming.push(b);
      } else {
        past.push(b);
      }
    }
    return { upcoming, past, cancelled };
  }, [bookings]);

  const currentList = categorized[activeTab] || [];

  const handleConfirmCancel = async () => {
    if (!cancelModalBooking) return;
    try {
      setCancelling(true);
      const res = await api.patch(`/bookings/${cancelModalBooking._id}/cancel`, {
        reason: cancelReason,
      });
      toast.success(res.data.message || 'Booking cancelled and refund initiated!');
      setCancelModalBooking(null);
      setActiveTab('cancelled');
      fetchBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not cancel booking');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-black text-3xl sm:text-4xl text-white">
            My Bookings
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Manage your upcoming e-tickets, view QR codes, or cancel up to 2 hours before showtime
          </p>
        </div>

        {/* Upcoming / Past / Cancelled Tabs */}
        <div className="flex items-center p-1.5 rounded-2xl bg-zinc-900/80 border border-white/10 self-start">
          {[
            { id: 'upcoming', label: 'Upcoming', count: categorized.upcoming.length },
            { id: 'past', label: 'Past', count: categorized.past.length },
            { id: 'cancelled', label: 'Cancelled', count: categorized.cancelled.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'btn-gradient shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] ${
                  activeTab === tab.id ? 'bg-black/25 text-white' : 'bg-white/5 text-zinc-400'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass-card h-44 rounded-3xl animate-pulse bg-zinc-900/50" />
          ))}
        </div>
      ) : error ? (
        <ErrorState
          title="Could Not Load Booking History"
          message={error}
          onRetry={fetchBookings}
        />
      ) : currentList.length === 0 ? (
        <div className="glass-card rounded-3xl p-12 text-center space-y-4">
          <Ticket className="w-12 h-12 text-purple-400 mx-auto opacity-75" />
          <h3 className="font-display font-bold text-xl text-white">
            No {activeTab} bookings found
          </h3>
          <p className="text-sm text-zinc-400 max-w-md mx-auto">
            {activeTab === 'upcoming'
              ? 'Ready for your next IMAX movie or live concert? Browse our trending events and lock your seats.'
              : `You don't have any ${activeTab} tickets yet.`}
          </p>
          <Link to="/events" className="inline-block px-6 py-3 rounded-xl btn-gradient text-sm">
            Explore Movies & Events
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {currentList.map((booking) => (
            <motion.div
              key={booking._id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-3xl p-5 sm:p-6 border border-white/10 hover:border-purple-500/30 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
            >
              <div className="flex gap-4 sm:gap-5 items-start">
                <img
                  src={booking.event?.posterUrl}
                  alt={booking.event?.title}
                  className="w-20 h-28 sm:w-24 sm:h-32 rounded-2xl object-cover border border-white/10 shrink-0"
                />

                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-md bg-white/10 text-purple-300">
                      {booking.bookingCode}
                    </span>
                    {booking.status === 'CONFIRMED' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3" /> Confirmed ({booking.paymentStatus || 'PAID'})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                        <XCircle className="w-3 h-3" /> Cancelled ({booking.paymentStatus || 'REFUNDED'})
                      </span>
                    )}
                  </div>

                  <Link
                    to={`/events/${booking.event?.slug || booking.event?._id}`}
                    className="font-display font-bold text-xl text-white hover:text-purple-300 transition-colors block"
                  >
                    {booking.event?.title}
                  </Link>

                  <p className="text-xs text-zinc-400 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    {booking.show?.venue?.name} • {booking.show?.venue?.screenName}
                  </p>

                  <p className="text-xs text-zinc-200 font-medium flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    {new Date(booking.show?.startTime).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}{' '}
                    at{' '}
                    {new Date(booking.show?.startTime).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {booking.seats?.map((s) => (
                      <span
                        key={s.seatId}
                        className="px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-purple-500/15 text-purple-200 border border-purple-500/30"
                      >
                        {s.seatId} ({s.category})
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column Actions & Price / Refund */}
              <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-3 border-t md:border-t-0 pt-4 md:pt-0 border-white/10">
                <div className="text-left md:text-right">
                  <p className="text-xs text-zinc-400">Total Paid</p>
                  <p className="font-display font-black text-2xl text-white">
                    ₹{booking.totalAmount}
                  </p>
                  {booking.status === 'CANCELLED' && (
                    <p className="text-xs text-emerald-400 font-semibold mt-0.5">
                      Refunded: ₹{booking.refundAmount} ({booking.refundPercentage}%)
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {booking.status === 'CONFIRMED' && (
                    <>
                      <button
                        type="button"
                        disabled={downloadingId === booking._id}
                        onClick={() => handleDownloadTicket(booking)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl btn-gradient text-xs font-bold text-white shadow-md transition-all disabled:opacity-50"
                      >
                        <Download className="w-3.5 h-3.5" />
                        {downloadingId === booking._id ? 'Generating...' : 'Download Ticket'}
                      </button>

                      <button
                        onClick={() => setQrModalBooking(booking)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-bold text-white transition-all"
                      >
                        <QrCode className="w-3.5 h-3.5 text-purple-400" /> QR Ticket
                      </button>

                      <Link
                        to={`/booking-success/${booking._id}`}
                        className="px-3.5 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-xs font-bold text-purple-200 transition-all"
                      >
                        Full Ticket
                      </Link>

                      {booking.canCancel ? (
                        <button
                          onClick={() => {
                            setCancelReason('Change of plans');
                            setCancelModalBooking(booking);
                          }}
                          className="px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-xs font-bold text-rose-300 transition-all"
                        >
                          Cancel Booking
                        </button>
                      ) : (
                        <span
                          title="Cancellations are only permitted up to 2 hours before showtime"
                          className="px-3 py-1.5 rounded-xl bg-white/5 text-[11px] text-zinc-500 flex items-center gap-1"
                        >
                          <Clock className="w-3 h-3" /> &lt; 2h Cutoff
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* CANCEL BOOKING MODAL */}
      <AnimatePresence>
        {cancelModalBooking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setCancelModalBooking(null)}
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-card w-full max-w-lg rounded-3xl p-6 sm:p-8 border border-white/15 space-y-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-xl text-white">
                      Cancel Ticket Booking?
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Ref: {cancelModalBooking.bookingCode} • {cancelModalBooking.event?.title}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setCancelModalBooking(null)}
                  className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Refund Calculation Box */}
              <div className="p-4 rounded-2xl bg-zinc-950/80 border border-white/10 space-y-2.5 text-sm">
                <div className="flex justify-between text-zinc-400">
                  <span>Seats to Release</span>
                  <span className="font-semibold text-white">
                    {cancelModalBooking.seatIds?.join(', ')}
                  </span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Original Amount Paid</span>
                  <span>₹{cancelModalBooking.totalAmount}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Refund Tier ({cancelModalBooking.hoursUntilShow}h before show)</span>
                  <span className="text-purple-300 font-semibold">
                    {cancelModalBooking.estimatedRefundPct}% Refundable
                  </span>
                </div>
                <div className="flex justify-between text-base font-display font-bold text-emerald-400 pt-2 border-t border-white/10">
                  <span>Estimated Refund Amount</span>
                  <span>₹{cancelModalBooking.estimatedRefundAmount}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                  Reason for Cancellation
                </label>
                <input
                  type="text"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-sm text-white focus:outline-none focus:border-purple-500"
                  placeholder="Optional reason..."
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCancelModalBooking(null)}
                  className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-sm font-semibold text-zinc-300"
                >
                  Keep Tickets
                </button>
                <button
                  type="button"
                  disabled={cancelling}
                  onClick={handleConfirmCancel}
                  className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-sm font-bold text-white shadow-lg shadow-rose-600/30 disabled:opacity-50"
                >
                  {cancelling
                    ? 'Cancelling...'
                    : `Confirm & Refund ₹${cancelModalBooking.estimatedRefundAmount}`}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QR PREVIEW MODAL */}
      <AnimatePresence>
        {qrModalBooking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setQrModalBooking(null)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-card max-w-sm w-full rounded-3xl p-6 text-center space-y-4 border border-white/15"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-purple-400">
                  {qrModalBooking.bookingCode}
                </span>
                <button
                  onClick={() => setQrModalBooking(null)}
                  className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <h3 className="font-display font-bold text-lg text-white">
                {qrModalBooking.event?.title}
              </h3>
              <div className="p-4 rounded-2xl bg-white inline-block mx-auto shadow-xl">
                <QRCodeSVG
                  value={JSON.stringify({
                    code: qrModalBooking.bookingCode,
                    seats: qrModalBooking.seatIds,
                  })}
                  size={170}
                />
              </div>
              <p className="text-xs text-zinc-300 font-semibold">
                Seats: {qrModalBooking.seatIds?.join(', ')}
              </p>
              <p className="text-[11px] text-zinc-400">{qrModalBooking.show?.venue?.name}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
