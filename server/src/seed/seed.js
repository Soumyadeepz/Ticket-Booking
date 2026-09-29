import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { connectDB } from '../config/db.js';
import { Event } from '../models/Event.js';
import { Show } from '../models/Show.js';
import { SeatHold } from '../models/SeatHold.js';
import { Booking } from '../models/Booking.js';
import { SEED_EVENTS, VENUES } from './seedData.js';

dotenv.config();

export const seedDatabase = async ({ force = false } = {}) => {
  const existingCount = await Event.countDocuments();
  if (existingCount >= 10 && !force) {
    console.log(`ℹ️ Database already seeded with ${existingCount} events.`);
    return;
  }

  console.log('🌱 Seeding TicketBook database with 12 events, venues, and shows...');
  await Promise.all([
    Event.deleteMany({}),
    Show.deleteMany({}),
    SeatHold.deleteMany({}),
    Booking.deleteMany({}),
  ]);

  const insertedEvents = await Event.insertMany(SEED_EVENTS);

  const showsToInsert = [];
  const now = new Date();
  // Generate shows for today + next 4 days (5 days total)
  const timeSlots = [
    { hour: 11, minute: 30 },
    { hour: 15, minute: 15 },
    { hour: 18, minute: 45 },
    { hour: 21, minute: 45 },
  ];

  const preBookedSamples = [
    ['C5', 'C6', 'D7', 'D8'],
    ['B4', 'B5', 'E5', 'E6', 'F6'],
    ['A6', 'A7', 'D4', 'D5'],
    ['C7', 'C8', 'G5', 'G6'],
  ];

  insertedEvents.forEach((event, eventIdx) => {
    // Pick 3 venues for each event
    const eventVenues = [
      VENUES[eventIdx % VENUES.length],
      VENUES[(eventIdx + 1) % VENUES.length],
      VENUES[(eventIdx + 2) % VENUES.length],
    ];

    for (let dayOffset = 0; dayOffset < 5; dayOffset++) {
      eventVenues.forEach((venue, vIdx) => {
        // Pick 2 time slots per venue per day
        const selectedSlots = [
          timeSlots[(eventIdx + vIdx) % timeSlots.length],
          timeSlots[(eventIdx + vIdx + 2) % timeSlots.length],
        ];

        selectedSlots.forEach((slot, sIdx) => {
          const start = new Date(now);
          start.setDate(now.getDate() + dayOffset);
          start.setHours(slot.hour, slot.minute, 0, 0);

          // Ensure dayOffset 0 slots are always in the future (> 3 hours from now so cancellation works too)
          if (start.getTime() <= Date.now() + 3 * 60 * 60 * 1000) {
            start.setDate(start.getDate() + 1);
          }

          const end = new Date(start.getTime() + (event.durationMins + 20) * 60 * 1000);
          const isConcertOrTheater =
            event.category === 'Concert' || event.category === 'Theater';

          const categories = isConcertOrTheater
            ? [
                { name: 'VIP', price: 1490, rows: ['A', 'B'], color: 'rose' },
                { name: 'Premium', price: 990, rows: ['C', 'D', 'E'], color: 'purple' },
                { name: 'Executive', price: 690, rows: ['F', 'G', 'H'], color: 'indigo' },
                { name: 'Classic', price: 450, rows: ['I', 'J'], color: 'slate' },
              ]
            : [
                { name: 'VIP', price: 580, rows: ['A', 'B'], color: 'rose' },
                { name: 'Premium', price: 420, rows: ['C', 'D', 'E'], color: 'purple' },
                { name: 'Executive', price: 310, rows: ['F', 'G', 'H'], color: 'indigo' },
                { name: 'Classic', price: 220, rows: ['I', 'J'], color: 'slate' },
              ];

          showsToInsert.push({
            event: event._id,
            venue,
            startTime: start,
            endTime: end,
            categories,
            seatsPerRow: 12,
            bookedSeats: preBookedSamples[(eventIdx + vIdx + sIdx) % preBookedSamples.length],
          });
        });
      });
    }
  });

  await Show.insertMany(showsToInsert);
  console.log(
    `✅ Seeded ${insertedEvents.length} events and ${showsToInsert.length} shows across ${VENUES.length} venues!`
  );
};

// Run directly if executed via npm run seed
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  (async () => {
    try {
      await connectDB();
      await seedDatabase({ force: true });
      process.exit(0);
    } catch (err) {
      console.error('❌ Seed failed:', err);
      process.exit(1);
    }
  })();
}
