import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Ticket,
  Search,
  User,
  LogOut,
  Calendar,
  Compass,
  Menu,
  X,
  Sparkles,
  Sun,
  Moon,
  Star,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../api/axios';
import { getSafePoster } from './EventCard';
import toast from 'react-hot-toast';

export const Navbar = () => {
  const { user, isAuthenticated, logoutUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [allEvents, setAllEvents] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const searchContainerRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    api
      .get('/events')
      .then((res) => setAllEvents(res.data.events || []))
      .catch(() => {});
  }, [isAuthenticated]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute live relatable suggestions prioritizing titles starting with the query (e.g., "bo")
  const suggestions = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];

    return allEvents
      .map((ev) => {
        const title = ev.title.toLowerCase();
        let score = 0;
        if (title.startsWith(q)) score = 100;
        else if (title.split(/\s+/).some((w) => w.startsWith(q))) score = 75;
        else if (title.includes(q)) score = 50;
        else if (ev.category.toLowerCase().startsWith(q)) score = 40;
        else if (ev.genre?.some((g) => g.toLowerCase().startsWith(q))) score = 35;
        return { ev, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map((item) => item.ev);
  }, [searchQuery, allEvents]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      setMobileMenuOpen(false);
      navigate(`/events?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    setMobileMenuOpen(false);
    toast.success('Signed out of TicketBook');
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-white/10">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 md:h-20 flex items-center justify-between gap-3">
        {/* Brand Logo */}
        <Link
          to={isAuthenticated ? '/' : '/login'}
          className="flex items-center gap-2.5 group shrink-0"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-purple-600 via-fuchsia-600 to-rose-600 flex items-center justify-center shadow-lg shadow-purple-600/30 group-hover:scale-105 transition-transform">
            <Ticket className="keep-white w-5 h-5 text-white -rotate-12" />
          </div>
          <div className="flex flex-col">
            <span className="font-display font-extrabold text-lg sm:text-xl tracking-tight text-white">
              Ticket<span className="text-gradient">Book</span>
            </span>
            <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-zinc-400 -mt-1">
              Cinema & Live
            </span>
          </div>
        </Link>

        {/* Live Search Bar with Autocomplete Dropdown (Shown when authenticated) */}
        {isAuthenticated && (
          <div
            ref={searchContainerRef}
            className="hidden md:block flex-1 max-w-md mx-4 relative"
          >
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setShowSuggestions(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                placeholder="Search here"
                className="w-full pl-10 pr-8 py-2 rounded-full bg-white/5 border border-white/15 text-sm text-white placeholder-zinc-400 focus:outline-none focus:border-purple-500 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setShowSuggestions(false);
                  }}
                  className="absolute right-3 top-2.5 text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </form>

            {/* Live Relatable Suggestions Dropdown */}
            {showSuggestions && searchQuery.trim() && (
              <div className="absolute left-0 right-0 mt-2 glass-card rounded-2xl border border-purple-500/30 shadow-2xl overflow-hidden z-50">
                <div className="px-3.5 py-2 border-b border-white/10 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-purple-400">
                  <span>Matches starting with “{searchQuery.trim()}”</span>
                  <button
                    type="button"
                    onClick={handleSearchSubmit}
                    className="hover:underline text-rose-400"
                  >
                    Filter All →
                  </button>
                </div>

                {suggestions.length === 0 ? (
                  <div className="p-4 text-xs text-zinc-400 text-center">
                    No direct match for “{searchQuery}”. Press Enter to filter all events.
                  </div>
                ) : (
                  <div className="divide-y divide-white/5 max-h-80 overflow-y-auto">
                    {suggestions.map((ev) => (
                      <button
                        key={ev._id}
                        type="button"
                        onClick={() => {
                          setShowSuggestions(false);
                          navigate(`/events?search=${encodeURIComponent(ev.title)}`);
                        }}
                        className="w-full px-3.5 py-2.5 flex items-center gap-3 hover:bg-purple-500/15 transition-colors text-left"
                      >
                        <img
                          src={getSafePoster(ev)}
                          alt={ev.title}
                          className="w-9 h-12 rounded-lg object-cover shrink-0 border border-white/10"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-bold text-white truncate">
                            {ev.title}
                          </p>
                          <p className="text-[11px] text-zinc-400 truncate">
                            {ev.category} • {ev.language} • {ev.genre?.slice(0, 2).join(', ')}
                          </p>
                        </div>
                        <span className="flex items-center gap-0.5 text-xs font-bold text-amber-400 shrink-0">
                          <Star className="w-3 h-3 fill-amber-400" /> {ev.rating?.toFixed(1)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Desktop Nav Links */}
        {isAuthenticated && (
          <nav className="hidden lg:flex items-center gap-5">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  isActive ? 'text-purple-400 font-semibold' : 'text-zinc-300 hover:text-white'
                }`
              }
            >
              <Sparkles className="w-4 h-4" /> Home
            </NavLink>

            <NavLink
              to="/events"
              className={({ isActive }) =>
                `text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  isActive ? 'text-purple-400 font-semibold' : 'text-zinc-300 hover:text-white'
                }`
              }
            >
              <Compass className="w-4 h-4" /> Explore
            </NavLink>

            <NavLink
              to="/my-bookings"
              className={({ isActive }) =>
                `text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  isActive ? 'text-purple-400 font-semibold' : 'text-zinc-300 hover:text-white'
                }`
              }
            >
              <Calendar className="w-4 h-4" /> My Bookings
            </NavLink>

            {user?.role === 'admin' && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `text-sm font-bold transition-colors flex items-center gap-1.5 px-3 py-1 rounded-full border ${
                    isActive
                      ? 'bg-purple-500/25 border-purple-400 text-purple-200'
                      : 'bg-purple-500/10 border-purple-500/30 text-purple-300 hover:text-white'
                  }`
                }
              >
                Admin
              </NavLink>
            )}
          </nav>
        )}

        {/* Right Controls: Theme Toggle + Auth */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Dark Mode / White (Light) Mode Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to White (Light) Mode' : 'Switch to Dark Mode'}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/5 hover:bg-purple-500/20 border border-white/15 text-xs font-bold text-zinc-200 transition-all"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-purple-600" />
                <span className="hidden sm:inline">Dark Mode</span>
              </>
            )}
          </button>

          {/* Desktop User Profile / Login */}
          <div className="hidden md:flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 transition-all"
                >
                  <img
                    src={
                      user?.avatar ||
                      `https://api.dicebear.com/7.x/shapes/svg?seed=${user?.username || 'user'}`
                    }
                    alt={user?.name}
                    className="w-7 h-7 rounded-full object-cover border border-purple-400/40"
                  />
                  <span className="text-xs sm:text-sm font-semibold text-zinc-200 max-w-[100px] truncate">
                    {user?.name?.split(' ')[0]}
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  title="Sign out"
                  className="p-2 rounded-full bg-white/5 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 border border-white/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold btn-gradient"
                >
                  Sign In with Gmail
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-white/5 border border-white/10 text-zinc-200"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 glass-panel px-4 py-5 space-y-4">
          {isAuthenticated && (
            <div className="space-y-2">
              <form onSubmit={handleSearchSubmit} className="relative">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search here"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-sm text-white"
                />
              </form>

              {suggestions.length > 0 && (
                <div className="glass-card rounded-xl p-2 space-y-1 max-h-52 overflow-y-auto">
                  {suggestions.map((ev) => (
                    <button
                      key={ev._id}
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        navigate(`/events?search=${encodeURIComponent(ev.title)}`);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg flex items-center gap-2.5 hover:bg-purple-500/15 text-left"
                    >
                      <img
                        src={getSafePoster(ev)}
                        alt={ev.title}
                        className="w-7 h-9 rounded object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-white truncate">{ev.title}</p>
                        <p className="text-[10px] text-zinc-400">{ev.category}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col space-y-1.5">
            {isAuthenticated ? (
              <>
                <Link
                  to="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2.5 rounded-xl text-sm font-semibold text-zinc-200 hover:bg-white/5"
                >
                  Home
                </Link>
                <Link
                  to="/events"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2.5 rounded-xl text-sm font-semibold text-zinc-200 hover:bg-white/5"
                >
                  Explore Events
                </Link>
                <Link
                  to="/my-bookings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2.5 rounded-xl text-sm font-semibold text-zinc-200 hover:bg-white/5"
                >
                  My Bookings
                </Link>
                {user?.role === 'admin' && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-3 py-2.5 rounded-xl text-sm font-bold text-purple-300 bg-purple-500/15 hover:bg-purple-500/25"
                  >
                    Admin Panel
                  </Link>
                )}
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2.5 rounded-xl text-sm font-semibold text-zinc-200 hover:bg-white/5 flex items-center gap-2"
                >
                  <User className="w-4 h-4 text-purple-400" /> Profile ({user?.name})
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-3 py-2.5 rounded-xl text-left text-sm font-semibold text-rose-400 hover:bg-rose-500/10"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 text-center rounded-xl btn-gradient text-sm font-bold"
                >
                  Sign In (Gmail)
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 text-center rounded-xl bg-white/5 border border-white/15 text-sm font-semibold"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
