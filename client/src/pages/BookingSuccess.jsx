import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { QRCodeSVG } from 'qrcode.react';
import {
  CheckCircle2,
  Calendar,
  MapPin,
  Ticket,
  Download,
  Printer,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { ErrorState } from '../components/ErrorState';
import { downloadBookingTicketPdf } from '../utils/ticketPdfGenerator';

export const BookingSuccess = () => {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);

  const fetchBooking = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/bookings/${id}`);
      setBooking(res.data.booking);

      confetti({
        particleCount: 100,
        spread: 75,
        origin: { y: 0.6 },
        colors: ['#9333ea', '#f43f5e', '#c084fc', '#fbbf24'],
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load confirmed booking.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  const handleDownloadTicketPdf = async () => {
    if (!booking) return;
    try {
      setDownloading(true);
      const filename = await downloadBookingTicketPdf(booking);
      toast.success(`Downloaded ${filename}!`);
    } catch (err) {
      toast.error('Failed to download PDF ticket.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[65vh] flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-purple-500/30 border-t-purple-500 animate-spin" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12">
        <ErrorState
          title="Booking Not Found"
          message={error || 'Could not retrieve this booking.'}
          onRetry={fetchBooking}
        />
      </div>
    );
  }

  const qrPayload = booking.bookingCode;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Celebration Header */}
      <div className="text-center space-y-2">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg">
          <CheckCircle2 className="w-9 h-9" />
        </div>
        <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-purple-400 pt-2">
          <Sparkles className="w-3.5 h-3.5" /> Payment Verified & Confirmed
        </span>
        <h1 className="font-display font-black text-3xl sm:text-4xl text-white">
          Your E-Ticket is Ready!
        </h1>
        <p className="text-sm text-zinc-400">
          Booking Reference:{' '}
          <strong className="text-white font-mono">{booking.bookingCode}</strong> • Payment Status:{' '}
          <strong className="text-emerald-400">{booking.paymentStatus || 'PAID'}</strong>
        </p>
      </div>

      {/* Perforated Digital Cinema Ticket Card */}
      <div className="glass-card rounded-3xl overflow-hidden border border-white/15 shadow-glow">
        <div className="grid grid-cols-1 md:grid-cols-3">
          {/* Left 2 Columns: Show & Seat Info */}
          <div className="md:col-span-2 p-6 sm:p-8 space-y-6 border-b md:border-b-0 md:border-r border-dashed border-white/15 relative">
            <div className="flex gap-4 items-start">
              <img
                src={booking.event?.posterUrl}
                alt={booking.event?.title}
                className="w-20 h-28 rounded-2xl object-cover border border-white/15 shrink-0"
              />
              <div className="space-y-1">
                <span className="keep-white px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-600 text-white">
                  {booking.event?.category} • {booking.event?.language}
                </span>
                <h2 className="font-display font-extrabold text-2xl text-white">
                  {booking.event?.title}
                </h2>
                <p className="text-xs text-zinc-400 flex items-center gap-1.5 pt-1">
                  <MapPin className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  {booking.show?.venue?.name} ({booking.show?.venue?.screenName})
                </p>
                <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 shrink-0" />
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
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-zinc-400 font-bold">
                  Confirmed Seats ({booking.seats?.length})
                </p>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {booking.seats?.map((s) => (
                    <span
                      key={s.seatId}
                      className="keep-white px-2.5 py-1 rounded-lg text-xs font-bold bg-gradient-to-r from-purple-600 to-rose-600 text-white border border-purple-400/40"
                    >
                      {s.seatId} • {s.category}
                    </span>
                  ))}
                </div>
              </div>

              <div className="text-right">
                <p className="text-[11px] uppercase tracking-wider text-zinc-400 font-bold">
                  Amount Paid ({booking.paymentMethod})
                </p>
                <p className="font-display font-black text-2xl text-white mt-1">
                  ₹{booking.totalAmount}
                </p>
                <p className="text-[11px] text-emerald-400 font-semibold">
                  STATUS: {booking.status} ({booking.paymentStatus || 'PAID'})
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: QR Code Stub */}
          <div className="p-6 sm:p-8 bg-zinc-950/60 flex flex-col items-center justify-center text-center space-y-3">
            <div className="p-3.5 rounded-2xl bg-white shadow-xl">
              <QRCodeSVG value={qrPayload} size={148} level="M" />
            </div>
            <p className="font-mono font-bold text-sm tracking-widest text-white pt-1">
              {booking.bookingCode}
            </p>
            <p className="text-[11px] text-zinc-400">
              Scan this QR code at the venue entrance for check-in
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons including Download PDF Ticket */}
      <div className="flex flex-wrap items-center justify-center gap-3.5">
        <button
          onClick={handleDownloadTicketPdf}
          disabled={downloading}
          className="keep-white inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl btn-gradient text-sm font-bold shadow-glow disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          {downloading ? 'Generating PDF...' : 'Download Ticket (PDF)'}
        </button>

        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-sm font-semibold text-white transition-all"
        >
          <Printer className="w-4 h-4" /> Print View
        </button>

        <Link
          to="/my-bookings"
          className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-sm font-bold text-purple-300 transition-all"
        >
          <Ticket className="w-4 h-4" /> My Bookings <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};
