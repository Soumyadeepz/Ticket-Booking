import { Event } from '../models/Event.js';
import { Show } from '../models/Show.js';
import { Booking } from '../models/Booking.js';
import { User } from '../models/User.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';

const slugify = (text) =>
  String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') +
  '-' +
  Math.floor(100 + Math.random() * 900);

// GET /api/admin/stats
export const getAdminStats = asyncHandler(async (_req, res) => {
  const now = new Date();

  const [totalBookings, confirmedBookings, upcomingShowsCount, totalEvents, totalUsers] =
    await Promise.all([
      Booking.countDocuments({ status: 'CONFIRMED' }),
      Booking.find({ status: 'CONFIRMED' }).populate('event', 'title category posterUrl'),
      Show.countDocuments({ startTime: { $gte: now } }),
      Event.countDocuments(),
      User.countDocuments(),
    ]);

  let totalRevenue = 0;
  const eventCountMap = new Map();

  for (const b of confirmedBookings) {
    totalRevenue += b.totalAmount || 0;
    if (b.event) {
      const evId = b.event._id.toString();
      const prev = eventCountMap.get(evId) || {
        _id: evId,
        title: b.event.title,
        category: b.event.category,
        posterUrl: b.event.posterUrl,
        bookingsCount: 0,
        seatsSold: 0,
        revenue: 0,
      };
      prev.bookingsCount += 1;
      prev.seatsSold += (b.seatIds || []).length;
      prev.revenue += b.totalAmount || 0;
      eventCountMap.set(evId, prev);
    }
  }

  let mostBookedEvent = null;
  for (const val of eventCountMap.values()) {
    if (!mostBookedEvent || val.bookingsCount > mostBookedEvent.bookingsCount) {
      mostBookedEvent = val;
    }
  }

  // Fallback to top featured event if no bookings yet
  if (!mostBookedEvent) {
    const fallbackEvent = await Event.findOne().sort({ isFeatured: -1, rating: -1 });
    if (fallbackEvent) {
      mostBookedEvent = {
        _id: fallbackEvent._id,
        title: fallbackEvent.title,
        category: fallbackEvent.category,
        posterUrl: fallbackEvent.posterUrl,
        bookingsCount: 0,
        seatsSold: 0,
        revenue: 0,
      };
    }
  }

  res.status(200).json({
    success: true,
    stats: {
      totalBookings,
      totalRevenue,
      upcomingShowsCount,
      totalEvents,
      totalUsers,
      mostBookedEvent,
    },
  });
});

// POST /api/admin/events
export const createAdminEvent = asyncHandler(async (req, res) => {
  const {
    title,
    category,
    type,
    genre,
    language = 'English',
    durationMins = 140,
    rating = 8.8,
    ageRating = 'UA 13+',
    releaseDate,
    posterUrl,
    backdropUrl,
    description,
    tagline = '',
    director = '',
    cast = [],
    trailerUrl = 'https://www.youtube.com/embed/YoHD9XEInc0',
    isTrending = false,
    isFeatured = false,
  } = req.body;

  if (!title || !description || !posterUrl) {
    throw new AppError('Title, description, and posterUrl are required.', 400);
  }

  const parsedGenres = Array.isArray(genre)
    ? genre
    : String(genre || 'Action, Drama')
        .split(',')
        .map((g) => g.trim())
        .filter(Boolean);

  const parsedCast = Array.isArray(cast)
    ? cast
    : String(cast || '')
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean)
        .map((name) => ({
          name,
          role: 'Lead Cast',
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
        }));

  const event = await Event.create({
    title,
    slug: slugify(title),
    tagline,
    description,
    category: category || type || 'Movie',
    genre: parsedGenres.length > 0 ? parsedGenres : ['Drama'],
    language,
    durationMins: Number(durationMins) || 140,
    rating: Number(rating) || 8.5,
    ageRating,
    releaseDate: releaseDate ? new Date(releaseDate) : new Date(),
    posterUrl,
    backdropUrl: backdropUrl || posterUrl,
    trailerUrl,
    director,
    cast: parsedCast,
    isTrending: Boolean(isTrending),
    isFeatured: Boolean(isFeatured),
  });

  res.status(201).json({
    success: true,
    message: 'Event created successfully.',
    event,
  });
});

// PUT /api/admin/events/:id
export const updateAdminEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) {
    throw new AppError('Event not found.', 404);
  }

  const updates = { ...req.body };
  if (updates.type && !updates.category) {
    updates.category = updates.type;
  }
  if (updates.genre && typeof updates.genre === 'string') {
    updates.genre = updates.genre
      .split(',')
      .map((g) => g.trim())
      .filter(Boolean);
  }
  if (updates.cast && typeof updates.cast === 'string') {
    updates.cast = updates.cast
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean)
      .map((name) => ({
        name,
        role: 'Cast',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
      }));
  }

  Object.assign(event, updates);
  await event.save();

  res.status(200).json({
    success: true,
    message: 'Event updated successfully.',
    event,
  });
});

// DELETE /api/admin/events/:id
export const deleteAdminEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) {
    throw new AppError('Event not found.', 404);
  }

  await Show.deleteMany({ event: event._id });
  await Event.deleteOne({ _id: event._id });

  res.status(200).json({
    success: true,
    message: 'Event and associated shows deleted.',
  });
});

// GET /api/admin/shows
export const getAdminShows = asyncHandler(async (req, res) => {
  const { eventId } = req.query;
  const filter = {};
  if (eventId) filter.event = eventId;

  const shows = await Show.find(filter)
    .populate('event', 'title category durationMins')
    .sort({ startTime: 1 })
    .limit(200);

  res.status(200).json({
    success: true,
    count: shows.length,
    shows,
  });
});

// POST /api/admin/shows
export const createAdminShow = asyncHandler(async (req, res) => {
  const {
    event: eventId,
    venueName,
    city = 'Mumbai',
    address = 'Lower Parel, Mumbai',
    screenName = 'IMAX Laser Screen 1',
    audioFormat = 'Dolby Atmos 4K',
    venue,
    startTime,
    endTime,
    vipPrice = 580,
    premiumPrice = 420,
    executivePrice = 310,
    classicPrice = 220,
    categories,
    seatsPerRow = 12,
  } = req.body;

  const eventDoc = await Event.findById(eventId);
  if (!eventDoc) {
    throw new AppError('Target Event not found.', 404);
  }

  const start = new Date(startTime);
  const end = endTime
    ? new Date(endTime)
    : new Date(start.getTime() + (eventDoc.durationMins + 20) * 60 * 1000);

  const finalVenue = venue || {
    name: venueName || 'PVR IMAX Laser: Phoenix Palladium',
    city,
    address,
    screenName,
    audioFormat,
  };

  const finalCategories = categories || [
    { name: 'VIP', price: Number(vipPrice) || 580, rows: ['A', 'B'], color: 'rose' },
    {
      name: 'Premium',
      price: Number(premiumPrice) || 420,
      rows: ['C', 'D', 'E'],
      color: 'purple',
    },
    {
      name: 'Executive',
      price: Number(executivePrice) || 310,
      rows: ['F', 'G', 'H'],
      color: 'indigo',
    },
    { name: 'Classic', price: Number(classicPrice) || 220, rows: ['I', 'J'], color: 'slate' },
  ];

  const show = await Show.create({
    event: eventDoc._id,
    venue: finalVenue,
    startTime: start,
    endTime: end,
    categories: finalCategories,
    seatsPerRow: Number(seatsPerRow) || 12,
    bookedSeats: [],
  });

  const populated = await Show.findById(show._id).populate('event', 'title category');

  res.status(201).json({
    success: true,
    message: 'Show created successfully.',
    show: populated,
  });
});

// PUT /api/admin/shows/:id
export const updateAdminShow = asyncHandler(async (req, res) => {
  const show = await Show.findById(req.params.id);
  if (!show) {
    throw new AppError('Show not found.', 404);
  }

  const {
    venueName,
    city,
    address,
    screenName,
    audioFormat,
    startTime,
    vipPrice,
    premiumPrice,
    executivePrice,
    classicPrice,
    seatsPerRow,
  } = req.body;

  if (venueName !== undefined) show.venue.name = venueName;
  if (city !== undefined) show.venue.city = city;
  if (address !== undefined) show.venue.address = address;
  if (screenName !== undefined) show.venue.screenName = screenName;
  if (audioFormat !== undefined) show.venue.audioFormat = audioFormat;
  if (startTime) {
    show.startTime = new Date(startTime);
    show.endTime = new Date(show.startTime.getTime() + 160 * 60 * 1000);
  }
  if (seatsPerRow) show.seatsPerRow = Number(seatsPerRow);

  if (
    vipPrice !== undefined ||
    premiumPrice !== undefined ||
    executivePrice !== undefined ||
    classicPrice !== undefined
  ) {
    show.categories = [
      {
        name: 'VIP',
        price: Number(vipPrice ?? show.categories[0]?.price ?? 580),
        rows: ['A', 'B'],
        color: 'rose',
      },
      {
        name: 'Premium',
        price: Number(premiumPrice ?? show.categories[1]?.price ?? 420),
        rows: ['C', 'D', 'E'],
        color: 'purple',
      },
      {
        name: 'Executive',
        price: Number(executivePrice ?? show.categories[2]?.price ?? 310),
        rows: ['F', 'G', 'H'],
        color: 'indigo',
      },
      {
        name: 'Classic',
        price: Number(classicPrice ?? show.categories[3]?.price ?? 220),
        rows: ['I', 'J'],
        color: 'slate',
      },
    ];
  }

  await show.save();
  const populated = await Show.findById(show._id).populate('event', 'title category');

  res.status(200).json({
    success: true,
    message: 'Show updated successfully.',
    show: populated,
  });
});

// DELETE /api/admin/shows/:id
export const deleteAdminShow = asyncHandler(async (req, res) => {
  const show = await Show.findById(req.params.id);
  if (!show) {
    throw new AppError('Show not found.', 404);
  }
  await Show.deleteOne({ _id: show._id });
  res.status(200).json({
    success: true,
    message: 'Show deleted successfully.',
  });
});

// GET /api/admin/bookings (Paginated, filterable by status and date)
export const getAdminBookings = asyncHandler(async (req, res) => {
  const { status, date, page = 1, limit = 15 } = req.query;
  const filter = {};

  if (status && status !== 'ALL') {
    filter.status = status;
  }

  if (date) {
    const startOfDay = new Date(`${date}T00:00:00.000Z`);
    const endOfDay = new Date(`${date}T23:59:59.999Z`);
    filter.createdAt = { $gte: startOfDay, $lte: endOfDay };
  }

  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(100, Math.max(1, Number(limit) || 15));
  const skip = (pageNum - 1) * limitNum;

  const [total, bookings] = await Promise.all([
    Booking.countDocuments(filter),
    Booking.find(filter)
      .populate('user', 'name email username')
      .populate('event', 'title category')
      .populate('show', 'venue startTime')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
  ]);

  res.status(200).json({
    success: true,
    total,
    page: pageNum,
    totalPages: Math.max(1, Math.ceil(total / limitNum)),
    bookings,
  });
});
