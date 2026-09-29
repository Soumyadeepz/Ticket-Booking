import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Ticket,
  Star,
  ChevronLeft,
  ChevronRight,
  Flame,
  Film,
  Music,
  Trophy,
  ArrowRight,
  X,
} from 'lucide-react';
import api from '../api/axios';
import { EventCard, getSafePoster } from '../components/EventCard';
import { EventCardSkeleton, HeroSkeleton } from '../components/Skeletons';

export const Home = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [heroIndex, setHeroIndex] = useState(0);
  const [activeTrailer, setActiveTrailer] = useState(null);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setLoading(true);
        const res = await api.get('/events');
        setEvents(res.data.events || []);
      } catch (err) {
        console.error('Failed to load events:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHomeData();
  }, []);

  const featuredEvents = events.filter((e) => e.isFeatured).slice(0, 5);
  const heroSlides = featuredEvents.length > 0 ? featuredEvents : events.slice(0, 4);
  const trendingEvents = events.filter((e) => e.isTrending).slice(0, 8);
  const movieEvents = events.filter((e) => e.category === 'Movie').slice(0, 8);
  const sportsEvents = events.filter((e) => e.category === 'Sports');
  const liveEvents = events
    .filter((e) => e.category === 'Concert' || e.category === 'Theater' || e.category === 'Comedy')
    .slice(0, 4);

  useEffect(() => {
    if (heroSlides.length <= 1 || activeTrailer) return;
    const timer = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [heroSlides.length, activeTrailer]);

  const currentHero = heroSlides[heroIndex];

  return (
    <div className="space-y-12 sm:space-y-16 pb-10">
      {/* HERO CAROUSEL WITH DYNAMIC AMBIENT BACKLIGHT HALO */}
      <section className="relative max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        {loading || !currentHero ? (
          <HeroSkeleton />
        ) : (
          <div className="relative group">
            {/* Ambient Cinema Backlight Halo Projected from Current Hero Slide */}
            <div
              className="pointer-events-none absolute -inset-3 sm:-inset-5 rounded-[36px] opacity-45 blur-3xl transition-all duration-1000"
              style={{
                backgroundImage: `url(${currentHero.backdropUrl || getSafePoster(currentHero)})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />

            <div className="relative min-h-[440px] sm:h-[520px] md:h-[600px] rounded-3xl overflow-hidden border border-white/15 shadow-[0_25px_70px_-15px_rgba(0,0,0,0.85)] bg-zinc-950">
              {/* Top Luminous Neon Rim Highlight */}
              <div className="pointer-events-none absolute top-0 left-12 right-12 h-[1.5px] z-20 bg-gradient-to-r from-transparent via-purple-400/90 to-transparent shadow-[0_0_20px_rgba(168,85,247,0.8)]" />

              <AnimatePresence mode="wait">
                <motion.div
                  key={currentHero._id}
                  initial={{ opacity: 0, scale: 1.04 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6 }}
                  className="absolute inset-0"
                >
                  <img
                    src={currentHero.backdropUrl || getSafePoster(currentHero)}
                    alt={currentHero.title}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = getSafePoster(currentHero);
                    }}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#07070c] via-[#07070c]/80 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#07070c] via-transparent to-black/30" />
                </motion.div>
              </AnimatePresence>

            {/* Hero Content */}
            <div className="relative z-10 h-full flex flex-col justify-end p-5 sm:p-10 md:p-14 pb-16 sm:pb-14 max-w-3xl">
              <motion.div
                key={`content-${currentHero._id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="space-y-3 sm:space-y-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="keep-white px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-purple-600 to-rose-600 text-white shadow-lg">
                    Featured {currentHero.category}
                  </span>
                  <span className="keep-white flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-black/50 backdrop-blur-md text-amber-400 border border-white/10">
                    <Star className="w-3.5 h-3.5 fill-amber-400" /> {currentHero.rating?.toFixed(1)}
                  </span>
                  <span className="keep-white px-3 py-1 rounded-full text-xs font-medium bg-black/50 backdrop-blur-md text-zinc-200">
                    {currentHero.language} • {currentHero.durationMins} mins
                  </span>
                </div>

                <h1 className="keep-white font-display font-black text-2xl sm:text-5xl md:text-6xl text-white tracking-tight leading-[1.1]">
                  {currentHero.title}
                </h1>

                <p className="keep-white text-xs sm:text-base text-zinc-300 line-clamp-2 max-w-2xl leading-relaxed">
                  {currentHero.tagline || currentHero.description}
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <Link
                    to={`/events/${currentHero.slug || currentHero._id}`}
                    className="keep-white inline-flex items-center gap-2 px-5 sm:px-6 py-3 sm:py-3.5 rounded-2xl btn-gradient text-xs sm:text-base"
                  >
                    <Ticket className="w-4 h-4 sm:w-5 sm:h-5" />
                    Book Tickets Now
                  </Link>

                  <button
                    onClick={() => setActiveTrailer(currentHero)}
                    className="keep-white inline-flex items-center gap-2 px-4 sm:px-5 py-3 sm:py-3.5 rounded-2xl bg-black/50 hover:bg-black/70 backdrop-blur-md border border-white/20 text-white font-semibold text-xs sm:text-base transition-all"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    Watch Trailer
                  </button>
                </div>
              </motion.div>
            </div>

            {/* Carousel Controls */}
            <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 z-20 flex items-center gap-2 sm:gap-3">
              <button
                onClick={() =>
                  setHeroIndex((prev) => (prev - 1 + heroSlides.length) % heroSlides.length)
                }
                className="keep-white p-2 rounded-full bg-zinc-900/80 hover:bg-purple-600 text-white border border-white/15 transition-colors"
                aria-label="Previous slide"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <div className="flex items-center gap-1.5">
                {heroSlides.map((slide, idx) => (
                  <button
                    key={slide._id}
                    onClick={() => setHeroIndex(idx)}
                    className={`h-2 rounded-full transition-all ${
                      idx === heroIndex
                        ? 'w-7 sm:w-8 bg-gradient-to-r from-purple-500 to-rose-500'
                        : 'w-2 bg-white/40 hover:bg-white/60'
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={() => setHeroIndex((prev) => (prev + 1) % heroSlides.length)}
                className="keep-white p-2 rounded-full bg-zinc-900/80 hover:bg-purple-600 text-white border border-white/15 transition-colors"
                aria-label="Next slide"
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
          </div>
        )}
      </section>

      {/* QUICK CATEGORY STRIP */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { label: 'IMAX Movies', cat: 'Movie', desc: 'Dolby Atmos & 4K' },
            { label: 'Live Concerts', cat: 'Concert', desc: 'World Tours & Indie' },
            { label: 'Championship Sports', cat: 'Sports', desc: 'Cricket, Football & Boxing' },
            { label: 'Theatre & Plays', cat: 'Theater', desc: 'Broadway & Drama' },
            { label: 'Stand-Up Comedy', cat: 'Comedy', desc: 'Live Laughs' },
          ].map((item) => (
            <Link
              key={item.cat}
              to={`/events?category=${item.cat}`}
              className="glass-card p-3.5 sm:p-4 rounded-2xl hover:border-purple-500/40 hover:-translate-y-0.5 transition-all group"
            >
              <p className="font-display font-bold text-sm sm:text-base text-white group-hover:text-purple-400 transition-colors">
                {item.label}
              </p>
              <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5">{item.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* TRENDING NOW ROW */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-extrabold text-xl sm:text-2xl text-white">
                Trending Now
              </h2>
              <p className="text-xs text-zinc-400">Fastest-selling shows across premier venues</p>
            </div>
          </div>
          <Link
            to="/events"
            className="text-xs sm:text-sm font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1"
          >
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <EventCardSkeleton key={i} />)
            : trendingEvents.map((event, idx) => (
                <EventCard key={event._id} event={event} index={idx} />
              ))}
        </div>
      </section>

      {/* SPORTS & STADIUM CHAMPIONSHIPS SECTION */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-extrabold text-xl sm:text-2xl text-white">
                Championship Sports & Live Stadium Action
              </h2>
              <p className="text-xs text-zinc-400">
                Cricket Finals, Football Night Derby & World Title Boxing
              </p>
            </div>
          </div>
          <Link
            to="/events?category=Sports"
            className="text-xs sm:text-sm font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1"
          >
            All Sports <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4 sm:gap-6">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => <EventCardSkeleton key={i} />)
            : sportsEvents.map((event, idx) => (
                <EventCard key={event._id} event={event} index={idx} />
              ))}
        </div>
      </section>

      {/* MOVIES IN CINEMAS */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-extrabold text-xl sm:text-2xl text-white">
                Now Showing in Cinemas
              </h2>
              <p className="text-xs text-zinc-400">Book IMAX Laser, Dolby Atmos & VIP Recliners</p>
            </div>
          </div>
          <Link
            to="/events?category=Movie"
            className="text-xs sm:text-sm font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1"
          >
            All Movies <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <EventCardSkeleton key={i} />)
            : movieEvents.map((event, idx) => (
                <EventCard key={event._id} event={event} index={idx} />
              ))}
        </div>
      </section>

      {/* LIVE CONCERTS & THEATRE */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <Music className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-extrabold text-xl sm:text-2xl text-white">
                Concerts, Theatre & Stand-Up
              </h2>
              <p className="text-xs text-zinc-400">
                Unforgettable live performances & touring shows
              </p>
            </div>
          </div>
          <Link
            to="/events?category=Concert"
            className="text-xs sm:text-sm font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1"
          >
            Explore Live <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <EventCardSkeleton key={i} />)
            : liveEvents.map((event, idx) => (
                <EventCard key={event._id} event={event} index={idx} />
              ))}
        </div>
      </section>

      {/* TRAILER MODAL */}
      <AnimatePresence>
        {activeTrailer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setActiveTrailer(null)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-card w-full max-w-4xl rounded-3xl overflow-hidden border border-white/15"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                <h3 className="font-display font-bold text-base sm:text-lg text-white">
                  {activeTrailer.title} — Official Trailer
                </h3>
                <button
                  onClick={() => setActiveTrailer(null)}
                  className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="aspect-video bg-black">
                <iframe
                  src={`${activeTrailer.trailerUrl}?autoplay=1`}
                  title={activeTrailer.title}
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
