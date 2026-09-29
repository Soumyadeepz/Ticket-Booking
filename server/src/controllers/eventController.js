import mongoose from 'mongoose';
import { Event } from '../models/Event.js';
import { Show } from '../models/Show.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// GET /api/events
export const getEvents = asyncHandler(async (req, res) => {
  const { category, genre, language, search, trending, featured, sort = 'popularity' } = req.query;

  const filter = {};
  if (category && category !== 'All') {
    filter.category = category;
  }
  if (genre && genre !== 'All') {
    filter.genre = { $in: [genre] };
  }
  if (language && language !== 'All') {
    filter.language = language;
  }
  if (trending === 'true') {
    filter.isTrending = true;
  }
  if (featured === 'true') {
    filter.isFeatured = true;
  }

  const cleanSearch = search ? search.trim() : '';
  if (cleanSearch) {
    const safe = escapeRegex(cleanSearch);
    const regex = new RegExp(safe, 'i');
    filter.$or = [
      { title: regex },
      { genre: regex },
      { category: regex },
      { language: regex },
      { description: regex },
    ];
  }

  let sortOption = { isFeatured: -1, isTrending: -1, rating: -1 };
  if (sort === 'rating') sortOption = { rating: -1 };
  if (sort === 'releaseDate') sortOption = { releaseDate: -1 };
  if (sort === 'title') sortOption = { title: 1 };

  let events = await Event.find(filter).sort(sortOption);

  // If user typed a search query (e.g., "bo"), rank events starting with "bo" first,
  // followed by word-prefix matches, then substring/genre matches!
  if (cleanSearch) {
    const lowerQ = cleanSearch.toLowerCase();
    events = events.sort((a, b) => {
      const aTitle = a.title.toLowerCase();
      const bTitle = b.title.toLowerCase();

      const aStarts = aTitle.startsWith(lowerQ) ? 3 : aTitle.split(/\s+/).some((w) => w.startsWith(lowerQ)) ? 2 : aTitle.includes(lowerQ) ? 1 : 0;
      const bStarts = bTitle.startsWith(lowerQ) ? 3 : bTitle.split(/\s+/).some((w) => w.startsWith(lowerQ)) ? 2 : bTitle.includes(lowerQ) ? 1 : 0;

      if (bStarts !== aStarts) return bStarts - aStarts;
      return (b.rating || 0) - (a.rating || 0);
    });
  }

  res.status(200).json({
    success: true,
    count: events.length,
    events,
  });
});

// GET /api/events/:id
export const getEventById = asyncHandler(async (req, res) => {
  const { id } = useParamsId(req.params.id);

  let event = null;
  if (mongoose.Types.ObjectId.isValid(id)) {
    event = await Event.findById(id);
  }
  if (!event) {
    event = await Event.findOne({ slug: id.toLowerCase() });
  }

  if (!event) {
    throw new AppError('Event not found.', 404);
  }

  // Fetch all upcoming shows for this event
  const shows = await Show.find({
    event: event._id,
    startTime: { $gte: new Date(Date.now() - 2 * 60 * 60 * 1000) },
  }).sort({ startTime: 1 });

  res.status(200).json({
    success: true,
    event,
    shows,
  });
});

function useParamsId(rawId) {
  return { id: String(rawId || '').trim() };
}
