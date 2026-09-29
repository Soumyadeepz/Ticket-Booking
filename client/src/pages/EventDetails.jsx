import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star,
  Clock,
  Calendar as CalendarIcon,
  Play,
  MapPin,
  Volume2,
  Sparkles,
  X,
  Ticket,
  ChevronRight,
} from 'lucide-react';
import api from '../api/axios';
import { HeroSkeleton } from '../components/Skeletons';
import { ErrorState } from '../components/ErrorState';

export const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDateKey, setSelectedDateKey] = useState('');
  const [trailerOpen, setTrailerOpen] = useState(false);

  const fetchDetails = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/events/${id}`);
      setEvent(res.data.event);
      const fetchedShows = res.data.shows || [];
      setShows(fetchedShows);

      if (fetchedShows.length > 0) {
        const firstDate = new Date(fetchedShows[0].startTime).toISOString().split('T')[0];
        setSelectedDateKey(firstDate);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load event details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  // Extract unique dates for the Date Strip
  const dateStrip = useMemo(() => {
    const map = new Map();
    shows.forEach((s) => {
      const d = new Date(s.startTime);
      const key = d.toISOString().split('T')[0];
      if (!map.has(key)) {
        map.set(key, {
          key,
          dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
          dayNum: d.getDate(),
          monthName: d.toLocaleDateString('en-US', { month: 'short' }),
        });
      }
    });
    return Array.from(map.values());
  }, [shows]);

  // Group shows on selectedDateKey by Venue
  const venuesForDate = useMemo(() => {
    const filtered = shows.filter(
      (s) => new Date(s.startTime).toISOString().split('T')[0] === selectedDateKey
    );
    const groups = new Map();
    filtered.forEach((show) => {
      const vName = show.venue.name;
      if (!groups.has(vName)) {
        groups.set(vName, {
          venue: show.venue,
          shows: [],
        });
      }
      groups.get(vName).shows.push(show);
    });
    return Array.from(groups.values());
  }, [shows, selectedDateKey]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <HeroSkeleton />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <ErrorState
          title="Could Not Load Event Details"
          message={error || 'Event not found'}
          onRetry={fetchDetails}
        />
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-12">
      {/* Cinematic Backdrop Hero */}
      <div className="relative min-h-[460px] md:min-h-[520px] flex items-end border-b border-white/10 overflow-hidden">
        <img
          src={event.backdropUrl || event.posterUrl}
          alt={event.title}
          className="absolute inset-0 w-full h-full object-cover scale-105 blur-[2px] opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#07070c] via-[#07070c]/85 to-[#07070c]/40" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-end">
            {/* Poster */}
            <div className="w-48 sm:w-60 rounded-2xl overflow-hidden border-2 border-white/15 shadow-glow shrink-0">
              <img
                src={event.posterUrl}
                alt={event.title}
                className="w-full aspect-[2/3] object-cover"
              />
            </div>

            {/* Event Metadata */}
            <div className="flex-1 space-y-4">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-600 text-white">
                  {event.category}
                </span>
                <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-400/15 text-amber-300 border border-amber-400/30">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  {event.rating?.toFixed(1)} / 10
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-zinc-200">
                  {event.ageRating || 'UA 13+'}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-zinc-200 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> {event.durationMins} mins
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-zinc-200">
                  {event.language}
                </span>
              </div>

              <h1 className="font-display font-black text-3xl sm:text-5xl text-white tracking-tight">
                {event.title}
              </h1>

              {event.tagline && (
                <p className="text-purple-300 font-medium text-sm sm:text-base italic">
                  “{event.tagline}”
                </p>
              )}

              <p className="text-zinc-300 text-sm sm:text-base max-w-3xl leading-relaxed">
                {event.description}
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <a
                  href="#showtimes"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl btn-gradient text-sm font-bold"
                >
                  <Ticket className="w-4 h-4" /> Select Showtime
                </a>
                <button
                  onClick={() => setTrailerOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-sm font-semibold transition-all"
                >
                  <Play className="w-4 h-4 fill-white" /> Watch Trailer
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cast & Crew Row */}
      {event.cast && event.cast.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <h3 className="font-display font-bold text-lg text-zinc-200">
            Featured Cast & Artists {event.director ? `• Directed by ${event.director}` : ''}
          </h3>
          <div className="flex flex-wrap gap-4">
            {event.cast.map((member, i) => (
              <div
                key={i}
                className="glass-card px-4 py-3 rounded-2xl flex items-center gap-3 border border-white/10"
              >
                <img
                  src={
                    member.avatar ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
                      member.name
                    )}`
                  }
                  alt={member.name}
                  className="w-11 h-11 rounded-full bg-zinc-800 border border-purple-400/30"
                />
                <div>
                  <p className="text-sm font-bold text-white">{member.name}</p>
                  <p className="text-xs text-zinc-400">{member.role}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* SHOWTIMES & DATE STRIP */}
      <section id="showtimes" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-white flex items-center gap-2">
              <CalendarIcon className="w-6 h-6 text-purple-400" /> Choose Date & Showtime
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Click any showtime below to view the curved theatre seat layout and lock your seats for 5 minutes
            </p>
          </div>
        </div>

        {/* Interactive Horizontal Date Strip */}
        <div className="flex items-center gap-3 overflow-x-auto pb-2">
          {dateStrip.map((d) => {
            const active = d.key === selectedDateKey;
            return (
              <button
                key={d.key}
                onClick={() => setSelectedDateKey(d.key)}
                className={`min-w-[88px] px-4 py-3 rounded-2xl border text-center transition-all flex flex-col items-center ${
                  active
                    ? 'btn-gradient border-transparent shadow-glow scale-105'
                    : 'glass-card border-white/10 hover:border-purple-500/40 text-zinc-300'
                }`}
              >
                <span className="text-[11px] uppercase font-bold tracking-wider opacity-80">
                  {d.dayName}
                </span>
                <span className="font-display font-black text-2xl leading-tight my-0.5">
                  {d.dayNum}
                </span>
                <span className="text-[11px] font-semibold opacity-80">{d.monthName}</span>
              </button>
            );
          })}
        </div>

        {/* Venues & Showtime Pills */}
        <div className="space-y-4">
          {venuesForDate.map(({ venue, shows: venueShows }) => (
            <div
              key={venue.name}
              className="glass-card rounded-3xl p-6 border border-white/10 hover:border-purple-500/30 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6"
            >
              <div className="space-y-1.5 max-w-md">
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-bold text-lg text-white">{venue.name}</h3>
                </div>
                <p className="text-xs text-zinc-400 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  {venue.address}, {venue.city}
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                    {venue.screenName}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                    <Volume2 className="w-3 h-3" /> {venue.audioFormat}
                  </span>
                </div>
              </div>

              {/* Showtime Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                {venueShows.map((show) => {
                  const timeStr = new Date(show.startTime).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  const minPrice = Math.min(...show.categories.map((c) => c.price));
                  const maxPrice = Math.max(...show.categories.map((c) => c.price));

                  return (
                    <button
                      key={show._id}
                      onClick={() => navigate(`/shows/${show._id}/seats`)}
                      className="group relative px-5 py-3 rounded-2xl bg-zinc-950/80 hover:bg-purple-600/20 border border-emerald-500/40 hover:border-purple-400 transition-all text-left"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-display font-bold text-base text-emerald-400 group-hover:text-white">
                          {timeStr}
                        </span>
                        <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-purple-300 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        ₹{minPrice} – ₹{maxPrice}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* TRAILER MODAL */}
      <AnimatePresence>
        {trailerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setTrailerOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-card w-full max-w-4xl rounded-3xl overflow-hidden border border-white/15"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                <h3 className="font-display font-bold text-lg text-white">
                  {event.title} — Official Trailer
                </h3>
                <button
                  onClick={() => setTrailerOpen(false)}
                  className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="aspect-video bg-black">
                <iframe
                  src={`${event.trailerUrl}?autoplay=1`}
                  title={event.title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
