import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Clock, Sparkles, Ticket } from 'lucide-react';

const FALLBACK_BY_CATEGORY = {
  Sports:
    'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=800&q=80',
  Concert:
    'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=800&q=80',
  Theater:
    'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=800&q=80',
  Comedy:
    'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?auto=format&fit=crop&w=800&q=80',
  Movie:
    'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80',
};

export const getSafePoster = (event) => {
  if (!event) return FALLBACK_BY_CATEGORY.Movie;
  return event.posterUrl || FALLBACK_BY_CATEGORY[event.category] || FALLBACK_BY_CATEGORY.Movie;
};

export const EventCard = ({ event, index = 0 }) => {
  const handleImgError = (e) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src =
      FALLBACK_BY_CATEGORY[event?.category] || FALLBACK_BY_CATEGORY.Movie;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.25) }}
      className="group glass-card rounded-2xl overflow-hidden flex flex-col hover:border-purple-500/40 hover:shadow-glow transition-all duration-300"
    >
      <Link
        to={`/events/${event.slug || event._id}`}
        className="relative aspect-[2/3] overflow-hidden bg-zinc-900"
      >
        <img
          src={getSafePoster(event)}
          alt={event.title}
          onError={handleImgError}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#07070c] via-[#07070c]/20 to-transparent opacity-90" />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1.5">
          <span className="keep-white px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider bg-purple-600/90 backdrop-blur-md text-white border border-purple-400/30">
            {event.category}
          </span>
          <span className="keep-white flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-bold bg-zinc-950/85 backdrop-blur-md text-amber-400 border border-amber-400/20">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            {event.rating?.toFixed(1)}
          </span>
        </div>

        {event.isTrending && (
          <div className="keep-white absolute bottom-2.5 left-2.5 flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-600/80 text-white border border-rose-400/30 backdrop-blur-md">
            <Sparkles className="w-3 h-3" /> Trending
          </div>
        )}
      </Link>

      <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between space-y-2.5">
        <div>
          <Link to={`/events/${event.slug || event._id}`}>
            <h3 className="font-display font-bold text-sm sm:text-base md:text-lg text-white group-hover:text-purple-400 transition-colors line-clamp-1">
              {event.title}
            </h3>
          </Link>
          <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5 line-clamp-1">
            {event.genre?.join(' • ')}
          </p>
        </div>

        <div className="pt-2.5 border-t border-white/10 flex items-center justify-between gap-2 text-xs text-zinc-400">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="px-2 py-0.5 rounded bg-white/5 text-zinc-300 font-medium text-[11px] truncate">
              {event.language}
            </span>
            <span className="hidden xs:flex items-center gap-1 text-[11px] shrink-0">
              <Clock className="w-3 h-3 text-zinc-500" />
              {event.durationMins}m
            </span>
          </div>

          <Link
            to={`/events/${event.slug || event._id}`}
            className="keep-white inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-rose-600 hover:from-purple-500 hover:to-rose-500 text-white font-semibold text-xs shadow-sm transition-all shrink-0"
          >
            <Ticket className="w-3.5 h-3.5" />
            Book
          </Link>
        </div>
      </div>
    </motion.div>
  );
};
