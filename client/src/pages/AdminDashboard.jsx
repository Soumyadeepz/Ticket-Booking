import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  TrendingUp,
  Ticket,
  Calendar,
  Award,
  Plus,
  Edit3,
  Trash2,
  Film,
  Clock,
  CheckCircle2,
  XCircle,
  Upload,
  X,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { ErrorState } from '../components/ErrorState';
import { getSafePoster } from '../components/EventCard';

const INITIAL_EVENT_FORM = {
  title: '',
  category: 'Movies',
  genre: 'Action, Sci-Fi',
  language: 'English',
  durationMins: 140,
  rating: 8.8,
  ageRating: 'UA',
  posterUrl: '',
  backdropUrl: '',
  trailerUrl: 'https://www.youtube.com/embed/d9MyW72ELq0',
  description: '',
  castText: 'Lead Actor:Hero, Co-Star:Lead',
  isTrending: true,
  isFeatured: false,
};

const getTomorrowDateTimeLocal = () => {
  const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
  d.setMinutes(0, 0, 0);
  return d.toISOString().slice(0, 16);
};

const INITIAL_SHOW_FORM = {
  eventId: '',
  venueName: 'PVR Director’s Cut IMAX',
  city: 'Mumbai',
  address: 'Lower Parel, Mumbai',
  screenName: 'Audi 1 - IMAX Laser',
  startTime: getTomorrowDateTimeLocal(),
  vipPrice: 620,
  executivePrice: 380,
  normalPrice: 240,
  rowsCount: 8,
  colsCount: 12,
};

export const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('events'); // 'events' | 'shows' | 'bookings'
  const [stats, setStats] = useState(null);
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [shows, setShows] = useState([]);
  const [bookingsData, setBookingsData] = useState({
    bookings: [],
    total: 0,
    page: 1,
    totalPages: 1,
  });

  const [bookingStatusFilter, setBookingStatusFilter] = useState('ALL');
  const [bookingDateFilter, setBookingDateFilter] = useState('');
  const [bookingPage, setBookingPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Event Modal State
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [eventForm, setEventForm] = useState(INITIAL_EVENT_FORM);
  const [savingEvent, setSavingEvent] = useState(false);

  // Show Modal State
  const [showModalOpen, setShowModalOpen] = useState(false);
  const [editingShow, setEditingShow] = useState(null);
  const [showForm, setShowForm] = useState(INITIAL_SHOW_FORM);
  const [savingShow, setSavingShow] = useState(false);

  const fetchDashboardBase = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsRes, eventsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/events'),
      ]);
      setStats(statsRes.data.stats);
      const evList = eventsRes.data.events || [];
      setEvents(evList);
      if (evList.length > 0 && !selectedEventId) {
        setSelectedEventId(evList[0]._id);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load admin dashboard data');
    } finally {
      setLoading(false);
    }
  }, [selectedEventId]);

  const fetchShowsForEvent = useCallback(async (evId) => {
    if (!evId) return;
    try {
      const res = await api.get('/admin/shows', { params: { eventId: evId } });
      setShows(res.data.shows || []);
    } catch (err) {
      toast.error('Failed to load shows for selected event');
    }
  }, []);

  const fetchAdminBookings = useCallback(async () => {
    try {
      const res = await api.get('/admin/bookings', {
        params: {
          page: bookingPage,
          limit: 10,
          status: bookingStatusFilter,
          date: bookingDateFilter || undefined,
        },
      });
      setBookingsData(res.data);
    } catch (err) {
      toast.error('Failed to load admin bookings');
    }
  }, [bookingPage, bookingStatusFilter, bookingDateFilter]);

  useEffect(() => {
    fetchDashboardBase();
  }, [fetchDashboardBase]);

  useEffect(() => {
    if (selectedEventId) {
      fetchShowsForEvent(selectedEventId);
    }
  }, [selectedEventId, fetchShowsForEvent]);

  useEffect(() => {
    if (activeTab === 'bookings') {
      fetchAdminBookings();
    }
  }, [activeTab, fetchAdminBookings]);

  // Poster File Upload -> DataURL
  const handlePosterFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      toast.error('Poster image must be under 3MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setEventForm((prev) => ({
        ...prev,
        posterUrl: reader.result,
        backdropUrl: prev.backdropUrl || reader.result,
      }));
      toast.success('Poster uploaded!');
    };
    reader.readAsDataURL(file);
  };

  const openCreateEventModal = () => {
    setEditingEvent(null);
    setEventForm(INITIAL_EVENT_FORM);
    setEventModalOpen(true);
  };

  const openEditEventModal = (ev) => {
    setEditingEvent(ev);
    setEventForm({
      title: ev.title || '',
      category: ev.category || 'Movies',
      genre: Array.isArray(ev.genre) ? ev.genre.join(', ') : ev.genre || '',
      language: ev.language || 'English',
      durationMins: ev.durationMins || 140,
      rating: ev.rating || 8.5,
      ageRating: ev.ageRating || 'UA',
      posterUrl: ev.posterUrl || '',
      backdropUrl: ev.backdropUrl || '',
      trailerUrl: ev.trailerUrl || '',
      description: ev.description || '',
      castText: Array.isArray(ev.cast)
        ? ev.cast.map((c) => `${c.name}:${c.role || 'Cast'}`).join(', ')
        : '',
      isTrending: Boolean(ev.isTrending),
      isFeatured: Boolean(ev.isFeatured),
    });
    setEventModalOpen(true);
  };

  const handleSaveEvent = async (e) => {
    e.preventDefault();
    if (!eventForm.title.trim()) {
      toast.error('Event title is required');
      return;
    }

    const parsedCast = eventForm.castText
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .map((pair) => {
        const [name, role] = pair.split(':').map((s) => s.trim());
        return { name, role: role || 'Featured Artist' };
      });

    const payload = {
      title: eventForm.title.trim(),
      category: eventForm.category,
      genre: eventForm.genre
        .split(',')
        .map((g) => g.trim())
        .filter(Boolean),
      language: eventForm.language,
      durationMins: Number(eventForm.durationMins) || 120,
      rating: Number(eventForm.rating) || 8.5,
      ageRating: eventForm.ageRating || 'UA',
      posterUrl:
        eventForm.posterUrl.trim() ||
        'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80',
      backdropUrl:
        eventForm.backdropUrl.trim() ||
        eventForm.posterUrl.trim() ||
        'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80',
      trailerUrl: eventForm.trailerUrl.trim(),
      description: eventForm.description.trim(),
      cast: parsedCast,
      isTrending: eventForm.isTrending,
      isFeatured: eventForm.isFeatured,
    };

    try {
      setSavingEvent(true);
      if (editingEvent) {
        await api.put(`/admin/events/${editingEvent._id}`, payload);
        toast.success('Event updated!');
      } else {
        const res = await api.post('/admin/events', payload);
        toast.success('Event created!');
        if (res.data.event?._id) {
          setSelectedEventId(res.data.event._id);
        }
      }
      setEventModalOpen(false);
      fetchDashboardBase();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save event');
    } finally {
      setSavingEvent(false);
    }
  };

  const handleDeleteEvent = async (eventId, title) => {
    if (!window.confirm(`Delete "${title}" and all its associated shows?`)) return;
    try {
      await api.delete(`/admin/events/${eventId}`);
      toast.success('Event deleted');
      fetchDashboardBase();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete event');
    }
  };

  // Shows Modal Handlers
  const openCreateShowModal = () => {
    setEditingShow(null);
    setShowForm({
      ...INITIAL_SHOW_FORM,
      eventId: selectedEventId || events[0]?._id || '',
    });
    setShowModalOpen(true);
  };

  const openEditShowModal = (show) => {
    setEditingShow(show);
    const tierMap = {};
    (show.tiers || []).forEach((t) => {
      tierMap[t.category] = t;
    });
    const dt = show.startTime ? new Date(show.startTime) : new Date();
    const localIso = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);

    setShowForm({
      eventId: show.event?._id || show.event || selectedEventId,
      venueName: show.venue?.name || 'PVR Director’s Cut IMAX',
      city: show.venue?.city || 'Mumbai',
      address: show.venue?.address || 'Lower Parel, Mumbai',
      screenName: show.venue?.screenName || 'Audi 1',
      startTime: localIso,
      vipPrice: tierMap.VIP?.price || 620,
      executivePrice: tierMap.Executive?.price || 380,
      normalPrice: tierMap.Normal?.price || 240,
      rowsCount: (show.rows || []).length || 8,
      colsCount: show.cols || 12,
    });
    setShowModalOpen(true);
  };

  const handleSaveShow = async (e) => {
    e.preventDefault();
    const totalRows = Math.min(Math.max(Number(showForm.rowsCount) || 8, 3), 12);
    const allRowLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'].slice(
      0,
      totalRows
    );
    const vipRows = allRowLabels.slice(0, 2);
    const execRows = allRowLabels.slice(2, Math.max(4, totalRows - 2));
    const normRows = allRowLabels.slice(Math.max(4, totalRows - 2));

    const payload = {
      event: showForm.eventId || selectedEventId,
      venue: {
        name: showForm.venueName,
        city: showForm.city,
        address: showForm.address,
        screenName: showForm.screenName,
      },
      startTime: new Date(showForm.startTime).toISOString(),
      rows: allRowLabels,
      cols: Number(showForm.colsCount) || 12,
      tiers: [
        { category: 'VIP', price: Number(showForm.vipPrice) || 600, rows: vipRows },
        { category: 'Executive', price: Number(showForm.executivePrice) || 380, rows: execRows },
        { category: 'Normal', price: Number(showForm.normalPrice) || 240, rows: normRows },
      ],
    };

    try {
      setSavingShow(true);
      if (editingShow) {
        await api.put(`/admin/shows/${editingShow._id}`, payload);
        toast.success('Show updated!');
      } else {
        await api.post('/admin/shows', payload);
        toast.success('New show scheduled!');
      }
      setShowModalOpen(false);
      fetchShowsForEvent(payload.event);
      fetchDashboardBase();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save show');
    } finally {
      setSavingShow(false);
    }
  };

  const handleDeleteShow = async (showId) => {
    if (!window.confirm('Delete this show schedule?')) return;
    try {
      await api.delete(`/admin/shows/${showId}`);
      toast.success('Show deleted');
      fetchShowsForEvent(selectedEventId);
      fetchDashboardBase();
    } catch (err) {
      toast.error('Failed to delete show');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div className="h-12 w-72 rounded-2xl bg-zinc-900/60 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 rounded-3xl glass-card animate-pulse bg-zinc-900/50" />
          ))}
        </div>
        <div className="h-96 rounded-3xl glass-card animate-pulse bg-zinc-900/50" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <ErrorState
          title="Admin Dashboard Error"
          message={error}
          onRetry={fetchDashboardBase}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-rose-600 flex items-center justify-center shadow-lg shadow-purple-600/30">
            <ShieldCheck className="w-6 h-6 text-white keep-white" />
          </div>
          <div>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-white">
              TicketBook Admin Center
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400">
              Manage events, venue showtimes, seat pricing layouts, and live Razorpay bookings
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={openCreateEventModal}
            className="px-4 py-2.5 rounded-xl btn-gradient text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-lg"
          >
            <Plus className="w-4 h-4" /> New Event
          </button>
          <button
            onClick={() => {
              setActiveTab('shows');
              openCreateShowModal();
            }}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs sm:text-sm font-bold text-white flex items-center gap-1.5"
          >
            <Clock className="w-4 h-4 text-purple-400" /> Add Show
          </button>
        </div>
      </div>

      {/* Stat Cards from /api/admin/stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div className="glass-card rounded-3xl p-5 border border-purple-500/25">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Total Revenue
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="font-display font-black text-3xl text-white mt-3">
            ₹{(stats?.totalRevenue || 0).toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-emerald-400 mt-1 font-medium">
            Verified Razorpay & Confirmed Tickets
          </p>
        </div>

        <div className="glass-card rounded-3xl p-5 border border-purple-500/25">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Confirmed Bookings
            </span>
            <div className="p-2.5 rounded-xl bg-purple-500/15 text-purple-400">
              <Ticket className="w-5 h-5" />
            </div>
          </div>
          <p className="font-display font-black text-3xl text-white mt-3">
            {stats?.totalBookings || 0}
          </p>
          <p className="text-[11px] text-zinc-400 mt-1">Active issued e-tickets</p>
        </div>

        <div className="glass-card rounded-3xl p-5 border border-purple-500/25">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Upcoming Shows
            </span>
            <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-400">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <p className="font-display font-black text-3xl text-white mt-3">
            {stats?.upcomingShowsCount || 0}
          </p>
          <p className="text-[11px] text-zinc-400 mt-1">Scheduled across all venues</p>
        </div>

        <div className="glass-card rounded-3xl p-5 border border-purple-500/25">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Most Booked Event
            </span>
            <div className="p-2.5 rounded-xl bg-rose-500/15 text-rose-400">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <p className="font-display font-bold text-lg text-white mt-3 truncate">
            {stats?.mostBookedEvent?.title || 'N/A'}
          </p>
          <p className="text-[11px] text-rose-300 mt-1 font-medium">
            {stats?.mostBookedEvent?.bookingsCount || 0} bookings •{' '}
            {stats?.mostBookedEvent?.category || 'Cinema'}
          </p>
        </div>
      </div>

      {/* Section Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-3">
        {[
          { id: 'events', label: `Events Catalog (${events.length})`, icon: Film },
          { id: 'shows', label: `Shows & Seat Layouts (${shows.length})`, icon: Clock },
          { id: 'bookings', label: 'All Customer Bookings', icon: Ticket },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
                activeTab === tab.id
                  ? 'btn-gradient text-white shadow-lg'
                  : 'bg-white/5 text-zinc-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: EVENTS TABLE */}
      {activeTab === 'events' && (
        <div className="glass-card rounded-3xl border border-white/10 overflow-hidden">
          <div className="p-5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-display font-bold text-lg text-white">
                Events & Movies Management
              </h2>
              <p className="text-xs text-zinc-400">
                Create, edit, or delete movies, concerts, sports matches, and comedy specials
              </p>
            </div>
            <button
              onClick={openCreateEventModal}
              className="px-4 py-2 rounded-xl btn-gradient text-xs font-bold flex items-center gap-1.5 self-start"
            >
              <Plus className="w-4 h-4" /> Add Event
            </button>
          </div>

          {events.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Film className="w-10 h-10 text-purple-400 mx-auto" />
              <p className="text-sm text-zinc-300 font-semibold">No events in database</p>
              <button
                onClick={openCreateEventModal}
                className="px-4 py-2 rounded-xl btn-gradient text-xs font-bold"
              >
                Create First Event
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-[11px] uppercase tracking-wider text-zinc-400 bg-white/[0.02]">
                    <th className="py-3.5 px-4">Event</th>
                    <th className="py-3.5 px-4">Type / Genre</th>
                    <th className="py-3.5 px-4">Language & Rating</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {events.map((ev) => (
                    <tr key={ev._id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={getSafePoster(ev)}
                            alt={ev.title}
                            className="w-11 h-14 rounded-lg object-cover border border-white/10 shrink-0"
                          />
                          <div>
                            <p className="font-bold text-white">{ev.title}</p>
                            <p className="text-xs text-zinc-400 line-clamp-1 max-w-xs">
                              {ev.description}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                          {ev.category}
                        </span>
                        <p className="text-xs text-zinc-400 mt-1">
                          {ev.genre?.slice(0, 3).join(', ')}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-zinc-300">
                        <p className="font-semibold">{ev.language}</p>
                        <p className="text-amber-400">★ {ev.rating?.toFixed(1)} • {ev.durationMins}m</p>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedEventId(ev._id);
                              setActiveTab('shows');
                            }}
                            className="px-3 py-1.5 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 text-xs font-semibold"
                          >
                            Manage Shows
                          </button>
                          <button
                            onClick={() => openEditEventModal(ev)}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/15 text-zinc-200"
                            title="Edit Event"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteEvent(ev._id, ev.title)}
                            className="p-2 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-400"
                            title="Delete Event"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SHOWS TABLE SCOPED TO EVENT */}
      {activeTab === 'shows' && (
        <div className="glass-card rounded-3xl border border-white/10 overflow-hidden space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Scoped Event:
              </label>
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="px-4 py-2.5 rounded-xl bg-zinc-900 border border-white/15 text-sm font-semibold text-white focus:outline-none focus:border-purple-500"
              >
                {events.map((ev) => (
                  <option key={ev._id} value={ev._id}>
                    {ev.title} ({ev.category})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={openCreateShowModal}
              className="px-4 py-2.5 rounded-xl btn-gradient text-xs font-bold flex items-center gap-1.5 self-start"
            >
              <Plus className="w-4 h-4" /> Schedule Show for Event
            </button>
          </div>

          {shows.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <Clock className="w-10 h-10 text-purple-400 mx-auto" />
              <p className="text-sm text-zinc-300 font-semibold">
                No shows scheduled for this event yet.
              </p>
              <button
                onClick={openCreateShowModal}
                className="px-4 py-2 rounded-xl btn-gradient text-xs font-bold"
              >
                Add First Showtime
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-[11px] uppercase tracking-wider text-zinc-400">
                    <th className="py-3 px-4">Venue & City</th>
                    <th className="py-3 px-4">Show Date & Time</th>
                    <th className="py-3 px-4">Category Pricing</th>
                    <th className="py-3 px-4">Seat Layout</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {shows.map((show) => (
                    <tr key={show._id} className="hover:bg-white/[0.02]">
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-white">{show.venue?.name}</p>
                        <p className="text-xs text-zinc-400">
                          {show.venue?.city} • {show.venue?.screenName}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-zinc-200">
                        {new Date(show.startTime).toLocaleString('en-IN', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1.5">
                          {(show.tiers || []).map((t) => (
                            <span
                              key={t.category}
                              className="px-2 py-0.5 rounded-md text-xs bg-white/5 border border-white/10 text-purple-200"
                            >
                              {t.category}: ₹{t.price}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-zinc-400">
                        {(show.rows || []).length} rows × {show.cols || 12} seats (
                        {(show.bookedSeats || []).length} booked)
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => openEditShowModal(show)}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/15 text-zinc-200"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteShow(show._id)}
                            className="p-2 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: READ-ONLY BOOKINGS TABLE WITH STATUS & DATE FILTER */}
      {activeTab === 'bookings' && (
        <div className="glass-card rounded-3xl border border-white/10 overflow-hidden p-5 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div>
              <h2 className="font-display font-bold text-lg text-white">
                All Customer Bookings ({bookingsData.total || 0})
              </h2>
              <p className="text-xs text-zinc-400">
                Read-only ledger filterable by booking status and date
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <select
                value={bookingStatusFilter}
                onChange={(e) => {
                  setBookingStatusFilter(e.target.value);
                  setBookingPage(1);
                }}
                className="px-3.5 py-2 rounded-xl bg-zinc-900 border border-white/15 text-xs font-bold text-white"
              >
                <option value="ALL">All Statuses</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="PENDING">Pending</option>
                <option value="FAILED">Failed</option>
              </select>

              <input
                type="date"
                value={bookingDateFilter}
                onChange={(e) => {
                  setBookingDateFilter(e.target.value);
                  setBookingPage(1);
                }}
                className="px-3.5 py-2 rounded-xl bg-zinc-900 border border-white/15 text-xs font-bold text-white"
              />
              {bookingDateFilter && (
                <button
                  onClick={() => setBookingDateFilter('')}
                  className="text-xs text-rose-400 hover:underline"
                >
                  Clear Date
                </button>
              )}
            </div>
          </div>

          {bookingsData.bookings?.length === 0 ? (
            <div className="py-12 text-center text-sm text-zinc-400">
              No bookings match the selected status/date filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-[11px] uppercase tracking-wider text-zinc-400">
                    <th className="py-3 px-4">Code & Customer</th>
                    <th className="py-3 px-4">Event & Show</th>
                    <th className="py-3 px-4">Seats</th>
                    <th className="py-3 px-4">Amount & Payment</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs sm:text-sm">
                  {bookingsData.bookings.map((b) => (
                    <tr key={b._id} className="hover:bg-white/[0.02]">
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-purple-300">
                          {b.bookingCode}
                        </span>
                        <p className="text-white font-medium mt-0.5">{b.user?.name}</p>
                        <p className="text-[11px] text-zinc-400">{b.user?.email}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-white">{b.event?.title}</p>
                        <p className="text-xs text-zinc-400">
                          {b.show?.venue?.name} •{' '}
                          {b.show?.startTime
                            ? new Date(b.show.startTime).toLocaleString('en-IN', {
                                dateStyle: 'short',
                                timeStyle: 'short',
                              })
                            : ''}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-purple-200">
                        {b.seatIds?.join(', ')}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-white">₹{b.totalAmount}</p>
                        <span className="text-[10px] uppercase tracking-wider text-zinc-400">
                          {b.paymentStatus || 'PAID'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {b.status === 'CONFIRMED' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" /> CONFIRMED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                            <XCircle className="w-3 h-3" /> {b.status}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {bookingsData.totalPages > 1 && (
            <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs text-zinc-400">
              <span>
                Page {bookingsData.page} of {bookingsData.totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={bookingPage <= 1}
                  onClick={() => setBookingPage((p) => p - 1)}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={bookingPage >= bookingsData.totalPages}
                  onClick={() => setBookingPage((p) => p + 1)}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: CREATE / EDIT EVENT */}
      <AnimatePresence>
        {eventModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setEventModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-card w-full max-w-2xl rounded-3xl p-6 sm:p-8 border border-white/15 my-8 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <h3 className="font-display font-bold text-xl text-white">
                  {editingEvent ? `Edit Event: ${editingEvent.title}` : 'Create New Event'}
                </h3>
                <button
                  onClick={() => setEventModalOpen(false)}
                  className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEvent} className="space-y-4 mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={eventForm.title}
                      onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-sm text-white"
                      placeholder="e.g. Dune: Messiah IMAX"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">
                      Type / Category *
                    </label>
                    <select
                      value={eventForm.category}
                      onChange={(e) => setEventForm({ ...eventForm, category: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/15 text-sm text-white"
                    >
                      <option value="Movies">Movies</option>
                      <option value="Concerts">Concerts</option>
                      <option value="Sports">Sports</option>
                      <option value="Comedy">Comedy</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">
                      Genres (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={eventForm.genre}
                      onChange={(e) => setEventForm({ ...eventForm, genre: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/15 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">
                      Language
                    </label>
                    <input
                      type="text"
                      value={eventForm.language}
                      onChange={(e) => setEventForm({ ...eventForm, language: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/15 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">
                      Duration (Mins)
                    </label>
                    <input
                      type="number"
                      value={eventForm.durationMins}
                      onChange={(e) =>
                        setEventForm({ ...eventForm, durationMins: e.target.value })
                      }
                      className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/15 text-sm text-white"
                    />
                  </div>
                </div>

                {/* Poster URL or File Upload */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">
                      Poster URL
                    </label>
                    <input
                      type="text"
                      value={eventForm.posterUrl}
                      onChange={(e) => setEventForm({ ...eventForm, posterUrl: e.target.value })}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/15 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">
                      Or Upload Poster File
                    </label>
                    <label className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-xs font-bold text-purple-200 cursor-pointer">
                      <Upload className="w-4 h-4" /> Choose Poster Image
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePosterFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">
                    Trailer Embed URL (YouTube)
                  </label>
                  <input
                    type="text"
                    value={eventForm.trailerUrl}
                    onChange={(e) => setEventForm({ ...eventForm, trailerUrl: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/15 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">
                    Cast (Name:Role comma-separated)
                  </label>
                  <input
                    type="text"
                    value={eventForm.castText}
                    onChange={(e) => setEventForm({ ...eventForm, castText: e.target.value })}
                    placeholder="Timothée Chalamet:Paul Atreides, Zendaya:Chani"
                    className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/15 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">
                    Synopsis / Description *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={eventForm.description}
                    onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/15 text-sm text-white"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setEventModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-white/5 text-xs font-bold text-zinc-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingEvent}
                    className="px-6 py-2.5 rounded-xl btn-gradient text-xs font-bold text-white"
                  >
                    {savingEvent ? 'Saving...' : editingEvent ? 'Update Event' : 'Create Event'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL 2: CREATE / EDIT SHOW */}
      <AnimatePresence>
        {showModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setShowModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-card w-full max-w-xl rounded-3xl p-6 sm:p-8 border border-white/15 space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h3 className="font-display font-bold text-xl text-white">
                  {editingShow ? 'Edit Show Schedule' : 'Schedule New Show'}
                </h3>
                <button
                  onClick={() => setShowModalOpen(false)}
                  className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveShow} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">
                    Event
                  </label>
                  <select
                    value={showForm.eventId}
                    onChange={(e) => setShowForm({ ...showForm, eventId: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/15 text-sm text-white"
                  >
                    {events.map((ev) => (
                      <option key={ev._id} value={ev._id}>
                        {ev.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">
                      Venue Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={showForm.venueName}
                      onChange={(e) => setShowForm({ ...showForm, venueName: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/15 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      required
                      value={showForm.city}
                      onChange={(e) => setShowForm({ ...showForm, city: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/15 text-sm text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">
                      Screen / Auditorium
                    </label>
                    <input
                      type="text"
                      value={showForm.screenName}
                      onChange={(e) => setShowForm({ ...showForm, screenName: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/15 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">
                      Start Date & Time *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={showForm.startTime}
                      onChange={(e) => setShowForm({ ...showForm, startTime: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/15 text-sm text-white"
                    />
                  </div>
                </div>

                {/* Price per Category */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase text-amber-400 mb-1">
                      VIP Price (₹)
                    </label>
                    <input
                      type="number"
                      value={showForm.vipPrice}
                      onChange={(e) => setShowForm({ ...showForm, vipPrice: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-purple-400 mb-1">
                      Executive (₹)
                    </label>
                    <input
                      type="number"
                      value={showForm.executivePrice}
                      onChange={(e) =>
                        setShowForm({ ...showForm, executivePrice: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-sky-400 mb-1">
                      Normal (₹)
                    </label>
                    <input
                      type="number"
                      value={showForm.normalPrice}
                      onChange={(e) => setShowForm({ ...showForm, normalPrice: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-sm text-white"
                    />
                  </div>
                </div>

                {/* Seat Layout Dimensions */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">
                      Total Seat Rows (3-12)
                    </label>
                    <input
                      type="number"
                      min={3}
                      max={12}
                      value={showForm.rowsCount}
                      onChange={(e) => setShowForm({ ...showForm, rowsCount: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">
                      Seats Per Row (6-16)
                    </label>
                    <input
                      type="number"
                      min={6}
                      max={16}
                      value={showForm.colsCount}
                      onChange={(e) => setShowForm({ ...showForm, colsCount: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-sm text-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-white/5 text-xs font-bold text-zinc-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingShow}
                    className="px-6 py-2.5 rounded-xl btn-gradient text-xs font-bold text-white"
                  >
                    {savingShow ? 'Saving...' : editingShow ? 'Update Show' : 'Create Show'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
