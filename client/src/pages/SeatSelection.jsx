import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Clock,
  MapPin,
  ShieldAlert,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  Lock,
  Ticket,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { SeatMapSkeleton } from '../components/Skeletons';
import { ErrorState } from '../components/ErrorState';

export const SeatSelection = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [show, setShow] = useState(null);
  const [seatLayout, setSeatLayout] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [holdExpiresAt, setHoldExpiresAt] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [holding, setHolding] = useState(false);

  const fetchShowSeats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/shows/${id}`);
      setShow(res.data.show);
      setSeatLayout(res.data.seatLayout || []);

      // If user already had active 5-min held seats on this show, restore them
      if (res.data.myHeldSeats?.length > 0) {
        const restored = [];
        for (const rowObj of res.data.seatLayout || []) {
          for (const seat of rowObj.seats) {
            if (res.data.myHeldSeats.includes(seat.seatId)) {
              restored.push(seat);
            }
          }
        }
        setSelectedSeats(restored);
        if (res.data.myHoldExpiresAt) {
          setHoldExpiresAt(new Date(res.data.myHoldExpiresAt));
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load show seat map');
      toast.error(err.response?.data?.message || 'Could not load show seat map');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchShowSeats();
  }, [fetchShowSeats]);

  // 5-Minute Hold Countdown Timer
  useEffect(() => {
    if (!holdExpiresAt) {
      setSecondsLeft(0);
      return;
    }

    const updateTimer = () => {
      const diff = Math.max(0, Math.floor((new Date(holdExpiresAt).getTime() - Date.now()) / 1000));
      setSecondsLeft(diff);
      if (diff === 0) {
        setHoldExpiresAt(null);
        toast.error('Your 5-minute seat hold expired. Please re-select your seats.');
        fetchShowSeats();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [holdExpiresAt, fetchShowSeats]);

  const toggleSeat = (seat) => {
    if (seat.status === 'BOOKED' || seat.status === 'HELD') return;

    const exists = selectedSeats.some((s) => s.seatId === seat.seatId);
    if (exists) {
      setSelectedSeats((prev) => prev.filter((s) => s.seatId !== seat.seatId));
    } else {
      if (selectedSeats.length >= 6) {
        toast.error('Maximum 6 seats can be selected per booking!');
        return;
      }
      setSelectedSeats((prev) => [...prev, seat]);
    }
  };

  const handleHoldAndProceed = async () => {
    if (selectedSeats.length === 0) {
      toast.error('Please select at least 1 seat.');
      return;
    }

    if (!isAuthenticated) {
      toast.error('Please sign in to hold seats and book tickets.');
      navigate('/login', { state: { from: { pathname: `/shows/${id}/seats` } } });
      return;
    }

    try {
      setHolding(true);
      const seatIds = selectedSeats.map((s) => s.seatId);
      const res = await api.post(`/shows/${id}/hold`, { seatIds });

      const expiry = new Date(res.data.expiresAt);
      setHoldExpiresAt(expiry);
      toast.success('Seats locked for 5 minutes! Proceeding to checkout...');

      // Store held seat details in sessionStorage for smooth Checkout transition
      sessionStorage.setItem(
        `tb_checkout_${id}`,
        JSON.stringify({
          showId: id,
          seats: selectedSeats,
          expiresAt: res.data.expiresAt,
        })
      );

      navigate(`/checkout/${id}`);
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.message || 'Failed to hold seats';
      toast.error(msg);
      if (status === 409) {
        // Refresh seat map immediately on 409 conflict
        fetchShowSeats();
        setSelectedSeats([]);
      }
    } finally {
      setHolding(false);
    }
  };

  const formatTimer = (sec) => {
    const mins = Math.floor(sec / 60);
    const rem = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  };

  const subTotal = selectedSeats.reduce((acc, s) => acc + s.price, 0);

  const getCategoryColorStyles = (category, isSelected, status) => {
    if (status === 'BOOKED') {
      return 'bg-zinc-800/90 border-zinc-700/60 text-zinc-600 cursor-not-allowed';
    }
    if (status === 'HELD') {
      return 'bg-amber-500/20 border-amber-500/50 text-amber-300 cursor-not-allowed';
    }
    if (isSelected) {
      return 'bg-gradient-to-br from-purple-500 to-rose-500 border-white text-white shadow-glow scale-105';
    }

    switch (category) {
      case 'VIP':
        return 'bg-rose-500/10 hover:bg-rose-500/30 border-rose-500/40 text-rose-200';
      case 'Premium':
        return 'bg-purple-500/10 hover:bg-purple-500/30 border-purple-500/40 text-purple-200';
      case 'Executive':
        return 'bg-indigo-500/10 hover:bg-indigo-500/30 border-indigo-500/40 text-indigo-200';
      default:
        return 'bg-zinc-800/40 hover:bg-zinc-700/60 border-zinc-600/50 text-zinc-300';
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10">
        <SeatMapSkeleton />
      </div>
    );
  }

  if (error || !show) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <ErrorState
          title="Could Not Load Seat Map"
          message={error || 'Show not found'}
          onRetry={fetchShowSeats}
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32 space-y-8">
      {/* Top Show Header */}
      <div className="glass-card rounded-3xl p-6 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link
            to={`/events/${show.event?.slug || show.event?._id}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-400 hover:text-purple-300"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to {show.event?.title}
          </Link>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-white">
            {show.event?.title}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1 text-zinc-200 font-medium">
              <MapPin className="w-3.5 h-3.5 text-purple-400" /> {show.venue.name}
            </span>
            <span>•</span>
            <span>{show.venue.screenName}</span>
            <span>•</span>
            <span className="text-emerald-400 font-semibold">
              {new Date(show.startTime).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}{' '}
              at{' '}
              {new Date(show.startTime).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </p>
        </div>

        {/* Active 5-Minute Hold Countdown Banner */}
        {secondsLeft > 0 && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-200">
            <Clock className="w-5 h-5 text-rose-400 animate-pulse" />
            <div>
              <p className="text-[11px] uppercase tracking-wider font-bold text-rose-300">
                Seats Held For You
              </p>
              <p className="font-display font-black text-xl text-white">
                {formatTimer(secondsLeft)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* CURVED SCREEN & SEAT LAYOUT */}
      <div className="glass-card rounded-3xl p-6 sm:p-10 border border-white/10 overflow-x-auto">
        {/* Curved Theatre Screen SVG */}
        <div className="max-w-2xl mx-auto mb-12 text-center">
          <div className="relative">
            <svg viewBox="0 0 600 60" className="w-full h-14 overflow-visible">
              <defs>
                <linearGradient id="screenGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#9333ea" stopOpacity="0.2" />
                  <stop offset="50%" stopColor="#f43f5e" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#9333ea" stopOpacity="0.2" />
                </linearGradient>
              </defs>
              <path
                d="M 20 50 Q 300 5 580 50"
                fill="none"
                stroke="url(#screenGrad)"
                strokeWidth="6"
                strokeLinecap="round"
              />
            </svg>
            <div className="w-3/4 h-8 mx-auto -mt-6 bg-gradient-to-b from-purple-500/25 to-transparent blur-xl rounded-full pointer-events-none" />
          </div>
          <p className="text-[11px] uppercase tracking-[0.35em] text-zinc-400 font-semibold mt-1">
            All Eyes This Way — Curved IMAX Laser Screen
          </p>
        </div>

        {/* Category Pricing Legend */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-8 pb-6 border-b border-white/10">
          {show.categories.map((tier) => (
            <div
              key={tier.name}
              className="px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs flex items-center gap-2"
            >
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  tier.name === 'VIP'
                    ? 'bg-rose-500'
                    : tier.name === 'Premium'
                    ? 'bg-purple-500'
                    : tier.name === 'Executive'
                    ? 'bg-indigo-500'
                    : 'bg-zinc-400'
                }`}
              />
              <span className="font-bold text-white">{tier.name}</span>
              <span className="text-zinc-400">₹{tier.price}</span>
            </div>
          ))}
        </div>

        {/* Seat Rows */}
        <div className="space-y-3 min-w-[600px] max-w-3xl mx-auto">
          {seatLayout.map((rowObj, idx) => {
            const prevCategory = idx > 0 ? seatLayout[idx - 1].category : null;
            const showCategoryHeader = rowObj.category !== prevCategory;

            return (
              <React.Fragment key={rowObj.row}>
                {showCategoryHeader && (
                  <div className="pt-4 pb-1 text-center">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">
                      {rowObj.category} — ₹{rowObj.price}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-center gap-2">
                  <span className="w-7 text-xs font-bold text-zinc-400 text-right pr-2">
                    {rowObj.row}
                  </span>

                  <div className="flex items-center gap-1.5 sm:gap-2">
                    {rowObj.seats.map((seat, sIdx) => {
                      const isSelected = selectedSeats.some((s) => s.seatId === seat.seatId);
                      // Add center aisle gap after seat 3 and seat 9
                      const addAisle = sIdx === 2 || sIdx === 8;

                      return (
                        <React.Fragment key={seat.seatId}>
                          <button
                            type="button"
                            disabled={seat.status === 'BOOKED' || seat.status === 'HELD'}
                            onClick={() => toggleSeat(seat)}
                            title={`${seat.seatId} • ${seat.category} (₹${seat.price}) • ${seat.status}`}
                            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-t-xl border text-[11px] font-bold transition-all flex items-center justify-center ${getCategoryColorStyles(
                              seat.category,
                              isSelected,
                              seat.status
                            )}`}
                          >
                            {seat.status === 'BOOKED' ? (
                              '✕'
                            ) : seat.status === 'HELD' ? (
                              <Lock className="w-3 h-3" />
                            ) : (
                              seat.col
                            )}
                          </button>
                          {addAisle && <div className="w-4 sm:w-6" />}
                        </React.Fragment>
                      );
                    })}
                  </div>

                  <span className="w-7 text-xs font-bold text-zinc-400 pl-2">{rowObj.row}</span>
                </div>
              </React.Fragment>
            );
          })}
        </div>

        {/* Status Legend */}
        <div className="flex flex-wrap items-center justify-center gap-6 mt-10 pt-6 border-t border-white/10 text-xs text-zinc-300">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-t-lg border border-purple-500/40 bg-purple-500/10 inline-block" />
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-t-lg bg-gradient-to-br from-purple-500 to-rose-500 border border-white inline-block" />
            <span>Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-t-lg bg-amber-500/20 border border-amber-500/50 inline-flex items-center justify-center text-amber-300">
              <Lock className="w-2.5 h-2.5" />
            </span>
            <span>Held (5m Lock)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-t-lg bg-zinc-800 border border-zinc-700 text-zinc-500 inline-flex items-center justify-center text-[10px]">
              ✕
            </span>
            <span>Booked</span>
          </div>
        </div>
      </div>

      {/* STICKY BOTTOM SUMMARY BAR */}
      <div className="fixed bottom-0 left-0 right-0 z-40 glass-panel border-t border-white/15 px-4 py-4 shadow-2xl">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-xs text-zinc-400">
                Selected Seats ({selectedSeats.length}/6 max):
              </p>
              {selectedSeats.length === 0 ? (
                <p className="text-sm font-semibold text-zinc-300">
                  Click up to 6 seats on the map above
                </p>
              ) : (
                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                  {selectedSeats.map((s) => (
                    <span
                      key={s.seatId}
                      className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-purple-500/20 text-purple-200 border border-purple-500/40"
                    >
                      {s.seatId} ({s.category})
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-5 w-full sm:w-auto justify-between sm:justify-end">
            {secondsLeft > 0 && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold">
                <Clock className="w-4 h-4" /> Hold: {formatTimer(secondsLeft)}
              </div>
            )}

            <div className="text-right">
              <p className="text-xs text-zinc-400">Subtotal</p>
              <p className="font-display font-black text-2xl text-white">₹{subTotal}</p>
            </div>

            <button
              onClick={handleHoldAndProceed}
              disabled={selectedSeats.length === 0 || holding}
              className="px-6 py-3.5 rounded-2xl btn-gradient text-sm sm:text-base font-bold disabled:opacity-40 disabled:pointer-events-none flex items-center gap-2"
            >
              <Ticket className="w-4 h-4" />
              {holding ? 'Locking Seats...' : 'Hold Seats & Checkout'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
