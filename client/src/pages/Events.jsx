import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, SlidersHorizontal, RotateCcw, Sparkles, X, Ticket, ShieldCheck, Plus } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { EventCard, getSafePoster } from '../components/EventCard';
import { EventCardSkeleton } from '../components/Skeletons';
import { ErrorState } from '../components/ErrorState';

const CATEGORIES = ['All', 'Movie', 'Concert', 'Theater', 'Comedy', 'Sports'];
const LANGUAGES = ['All', 'English', 'Hindi', 'Japanese', 'Kannada'];
const GENRES = [
  'All',
  'Sci-Fi',
  'Action',
  'Thriller',
  'Live Music',
  'Live Sports',
  'Cricket',
  'Football',
  'Boxing',
  'Drama',
  'Comedy',
  'Musical',
];

export const Events = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [allCatalogEvents, setAllCatalogEvents] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [category, setCategory] = useState(searchParams.get('category') || 'All');
  const [language, setLanguage] = useState(searchParams.get('language') || 'All');
  const [genre, setGenre] = useState(searchParams.get('genre') || 'All');
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [sort, setSort] = useState('popularity');

  // Load full catalog once for instant prefix suggestions ("bo" -> Bombay Velvet, Borderlands, Box Office...)
  useEffect(() => {
    api
      .get('/events')
      .then((res) => setAllCatalogEvents(res.data.events || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const urlCat = searchParams.get('category');
    const urlSearch = searchParams.get('search');
    if (urlCat) setCategory(urlCat);
    if (urlSearch !== null) setSearch(urlSearch);
  }, [searchParams]);

  const fetchEvents = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (category !== 'All') params.category = category;
      if (language !== 'All') params.language = language;
      if (genre !== 'All') params.genre = genre;
      if (search.trim()) params.search = search.trim();
      params.sort = sort;

      const res = await api.get('/events', { params });
      setEvents(res.data.events || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load events catalog');
    } finally {
      setLoading(false);
    }
  }, [category, language, genre, search, sort]);

  useEffect(() => {
    const debounce = setTimeout(fetchEvents, 120);
    return () => clearTimeout(debounce);
  }, [fetchEvents]);

  // Compute relatable prefix options when user types (e.g., "bo")
  const relatablePrefixOptions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return { startsWithTitles: [], relatedGenres: [] };

    const startsWithTitles = allCatalogEvents.filter((ev) => {
      const t = ev.title.toLowerCase();
      return t.startsWith(q) || t.split(/\s+/).some((word) => word.startsWith(q));
    });

    const relatedGenres = GENRES.filter(
      (g) => g !== 'All' && g.toLowerCase().startsWith(q)
    );

    return { startsWithTitles, relatedGenres };
  }, [search, allCatalogEvents]);

  const handleReset = () => {
    setCategory('All');
    setLanguage('All');
    setGenre('All');
    setSearch('');
    setSort('popularity');
    setSearchParams({});
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
      {/* Header & Filter Panel */}
      <div className="glass-card rounded-3xl p-5 sm:p-8 border border-white/10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-purple-400">
                <Sparkles className="w-3.5 h-3.5" /> Discover & Book
              </span>
              {user?.role === 'admin' && (
                <Link
                  to="/admin"
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-xs font-bold text-amber-200 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Movie / Admin Panel
                </Link>
              )}
            </div>
            <h1 className="font-display font-black text-2xl sm:text-4xl text-white mt-1">
              Explore Movies, Concerts & Sports
            </h1>
          </div>

          {/* Live Prefix Search Input */}
          <div className="relative w-full lg:w-96">
            <Search className="w-4 h-4 text-purple-400 absolute left-3.5 top-3.5 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Type 'bo' (Bombay Velvet, Borderlands, Boxing)..."
              className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-zinc-950/80 border border-white/15 text-sm text-white placeholder-zinc-400 focus:outline-none focus:border-purple-500"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-3 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* RELATABLE OPTIONS PANEL (Appears dynamically as user types e.g. "bo") */}
        {search.trim() && (
          <div className="mt-4 p-4 rounded-2xl bg-purple-600/10 border border-purple-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-purple-400">
                Relatable Movies & Events Starting With “{search.trim()}”
              </p>
              <button
                type="button"
                onClick={() => setSearch('')}
                className="text-[11px] font-semibold text-rose-400 hover:underline"
              >
                Clear Search
              </button>
            </div>

            {relatablePrefixOptions.startsWithTitles.length > 0 ? (
              <div className="flex flex-wrap gap-2.5">
                {relatablePrefixOptions.startsWithTitles.map((ev) => (
                  <Link
                    key={ev._id}
                    to={`/events/${ev.slug || ev._id}`}
                    className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl glass-card hover:border-purple-500 transition-all"
                  >
                    <img
                      src={getSafePoster(ev)}
                      alt={ev.title}
                      className="w-6 h-8 rounded object-cover"
                    />
                    <div>
                      <p className="text-xs font-bold text-white">{ev.title}</p>
                      <p className="text-[10px] text-zinc-400">
                        {ev.category} • {ev.language}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-xs text-zinc-400">
                Showing relatable matches across titles, genres, and languages for “{search.trim()}”.
              </p>
            )}

            {relatablePrefixOptions.relatedGenres.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[11px] text-zinc-400">Related Genre Filters:</span>
                {relatablePrefixOptions.relatedGenres.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGenre(g)}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-600 text-white keep-white"
                  >
                    {g}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 mt-5 pt-5 border-t border-white/10">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 ${
                category === cat
                  ? 'btn-gradient keep-white shadow-md'
                  : 'bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10'
              }`}
            >
              {cat === 'All' ? 'All Experiences' : cat === 'Sports' ? 'Sports & Stadium' : `${cat}s`}
            </button>
          ))}
        </div>

        {/* Secondary Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          <div className="flex items-center gap-2 bg-zinc-950/60 border border-white/10 rounded-xl px-3 py-2">
            <SlidersHorizontal className="w-4 h-4 text-purple-400 shrink-0" />
            <span className="text-xs text-zinc-400">Language:</span>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-transparent text-xs font-semibold text-white focus:outline-none flex-1"
            >
              {LANGUAGES.map((l) => (
                <option key={l} value={l} className="bg-zinc-900 text-white">
                  {l}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-zinc-950/60 border border-white/10 rounded-xl px-3 py-2">
            <span className="text-xs text-zinc-400">Genre:</span>
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="bg-transparent text-xs font-semibold text-white focus:outline-none flex-1"
            >
              {GENRES.map((g) => (
                <option key={g} value={g} className="bg-zinc-900 text-white">
                  {g}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-zinc-950/60 border border-white/10 rounded-xl px-3 py-2">
            <span className="text-xs text-zinc-400">Sort By:</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="bg-transparent text-xs font-semibold text-white focus:outline-none flex-1"
            >
              <option value="popularity" className="bg-zinc-900 text-white">
                Featured & Prefix Match
              </option>
              <option value="rating" className="bg-zinc-900 text-white">
                Highest Rated
              </option>
              <option value="releaseDate" className="bg-zinc-900 text-white">
                Newest Releases
              </option>
              <option value="title" className="bg-zinc-900 text-white">
                Alphabetical (A-Z)
              </option>
            </select>
          </div>

          <button
            onClick={handleReset}
            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-zinc-300 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset All Filters
          </button>
        </div>
      </div>

      {/* Results Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <EventCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <ErrorState
          title="Could Not Load Events Catalog"
          message={error}
          onRetry={fetchEvents}
        />
      ) : events.length === 0 ? (
        <div className="glass-card rounded-3xl p-10 sm:p-12 text-center space-y-4">
          <p className="font-display font-bold text-xl text-white">
            No matching events or movies found
          </p>
          <p className="text-sm text-zinc-400 max-w-md mx-auto">
            Try clearing your search filter or choosing one of the relatable suggestions below.
          </p>
          <button onClick={handleReset} className="px-5 py-2.5 rounded-xl btn-gradient keep-white text-sm">
            Show All Events
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {events.map((event, idx) => (
            <EventCard key={event._id} event={event} index={idx} />
          ))}
        </div>
      )}
    </div>
  );
};
