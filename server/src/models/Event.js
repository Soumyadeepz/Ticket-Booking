import mongoose from 'mongoose';

const castMemberSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    role: { type: String, required: true },
    avatar: { type: String, default: '' },
  },
  { _id: false }
);

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    tagline: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ['Movie', 'Concert', 'Theater', 'Comedy', 'Sports'],
      default: 'Movie',
      index: true,
    },
    genre: {
      type: [String],
      required: true,
      index: true,
    },
    language: {
      type: String,
      required: true,
      index: true,
    },
    durationMins: {
      type: Number,
      required: true,
    },
    rating: {
      type: Number,
      default: 8.5,
      min: 0,
      max: 10,
    },
    ageRating: {
      type: String,
      default: 'UA 13+',
    },
    releaseDate: {
      type: Date,
      required: true,
    },
    posterUrl: {
      type: String,
      required: true,
    },
    backdropUrl: {
      type: String,
      required: true,
    },
    trailerUrl: {
      type: String,
      required: true,
    },
    director: {
      type: String,
      default: '',
    },
    cast: {
      type: [castMemberSchema],
      default: [],
    },
    isTrending: {
      type: Boolean,
      default: false,
      index: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

export const Event = mongoose.model('Event', eventSchema);
