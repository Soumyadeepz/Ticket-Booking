# TicketBook — Full-Stack Cinema & Live Event Booking Platform (Phase 1 & Phase 2)

A modern, production-grade full-stack ticket booking web application built in a monorepo (`/client` + `/server`) with **React + Vite + Tailwind CSS + Framer Motion** on the frontend and **Node.js + Express + MongoDB/Mongoose + Razorpay + PDFKit** on the backend.

---

## 1. Architecture Overview

```text
Ticket-Booking/
├── client/                     # React 18 + Vite + Tailwind CSS + Framer Motion
│   ├── src/
│   │   ├── api/axios.js        # Axios instance with memory token & silent 401 refresh interceptor
│   │   ├── components/         # Navbar, EventCard, ProtectedRoute, AdminRoute, ErrorBoundary, ErrorState
│   │   ├── context/            # AuthContext (in-memory JWT) + ThemeContext (Dark / White Mode)
│   │   └── pages/              # Home, Events, EventDetails, SeatSelection, Checkout,
│   │                           # BookingSuccess, MyBookings, AdminDashboard, Login, Register, VerifyOtp, Profile
│   └── .env.example
└── server/                     # Node.js + Express + Mongoose + Zod + Nodemailer + Razorpay + PDFKit
    ├── src/
    │   ├── controllers/        # auth, event, show, booking, payment, admin controllers
    │   ├── middleware/         # requireAuth, isAdmin, validate (Zod), rateLimiters, errorHandler
    │   ├── models/             # User, Otp, Event, Show, SeatHold (5-min TTL), Booking
    │   ├── routes/             # authRoutes, eventRoutes, showRoutes, bookingRoutes, paymentRoutes, adminRoutes
    │   ├── seed/               # seed.js (12+ events/shows) & makeAdmin.js (promote user to admin)
    │   └── utils/              # tokens.js, mailer.js (OTP + confirmation + cancellation emails)
    └── .env.example
```

---

## 2. Authentication Flow & Security Rationale (Why In-Memory JWT + `httpOnly` Cookie over `localStorage`)

1. **Two-Step OTP + Google OAuth 2.0**:
   - **Standard Registration & Login**: Passwords are hashed with `bcrypt` (12 salt rounds). After submitting valid credentials, the server generates a **6-digit OTP** (hashed with SHA-256 in the `Otp` collection with a 10-minute TTL, max 5 attempts, and 30-second resend cooldown) and sends it via **Nodemailer**. Tokens are only issued after OTP verification.
   - **Google Sign-In**: Uses `@react-oauth/google` on the client and `google-auth-library` (`verifyIdToken`) on the server to verify the Google ID token, find-or-create the user, and mark them verified.
2. **Why Access Token in Memory + Refresh Token in `httpOnly` Cookie instead of `localStorage`?**:
   - Storing JWTs in `localStorage` or `sessionStorage` exposes tokens to **Cross-Site Scripting (XSS)** attacks — any malicious script injected on the page can read `localStorage.getItem('token')` and exfiltrate long-lived credentials.
   - Instead, **TicketBook** keeps the short-lived **Access Token (`15m`)** strictly in JavaScript memory (`AuthContext` / `setAccessToken` in `axios.js`) and stores the **Refresh Token (`7d`)** inside an **`httpOnly` cookie** (`secure: true, sameSite: 'none'` in production).
   - JavaScript cannot read `httpOnly` cookies, neutralizing XSS token theft. When the 15-minute access token expires or the user refreshes the browser tab, an Axios response interceptor transparently calls `POST /api/auth/refresh` to obtain a fresh access token without interrupting the user.

---

## 3. How Concurrent Seat Booking & Race Conditions Are Prevented

TicketBook uses a **three-layer concurrency defense** in MongoDB to guarantee two users can never lock or purchase the same seat for the same show:

1. **Layer 1 — Ephemeral 5-Minute Seat Holds (`SeatHold` Collection)**:
   - When a user selects up to 6 seats and clicks **Proceed to Checkout**, `POST /api/shows/:id/hold` creates documents in `SeatHold` with:
     - A **compound unique index** `{ show: 1, seatId: 1 }` (`unique: true`). If two users click the same seat within milliseconds, MongoDB atomically rejects the second insert with `E11000 duplicate key`, and the API returns **`409 Conflict`**.
     - A **MongoDB TTL index** `{ expiresAt: 1 }` (`expireAfterSeconds: 0`) set to `now + 5 minutes`, plus active query filtering (`expiresAt > new Date()`), automatically freeing abandoned seats if payment is not completed within 5 minutes.
2. **Layer 2 — Pending Booking + Server-Side Razorpay HMAC Verification**:
   - `POST /api/bookings/initiate-payment` verifies the user holds a valid, un-expired `SeatHold` for every requested seat and creates a `Booking` with `status: 'PENDING'` and `paymentStatus: 'PENDING'`.
   - `POST /api/payments/create-order` creates a Razorpay Order for the exact server-computed amount.
   - `POST /api/payments/verify` verifies the `razorpay_signature` using `HMAC-SHA256(orderId + "|" + paymentId, RAZORPAY_KEY_SECRET)` inside a **MongoDB Transaction** (with automatic standalone fallback). Only upon valid cryptographic verification does the server mark `status: 'CONFIRMED'`, `paymentStatus: 'PAID'`, push the seats to `Show.bookedSeats`, and delete the temporary `SeatHold` records. If verification fails, the holds are immediately deleted and the booking is marked `FAILED`.
3. **Layer 3 — Partial Unique Index on Confirmed Seats (`Booking` Collection)**:
   - The `Booking` schema enforces a **partial unique index** on `{ show: 1, seatIds: 1 }` with `partialFilterExpression: { status: 'CONFIRMED' }`. Even under extreme concurrency, MongoDB refuses to persist two `CONFIRMED` bookings containing the same seat for a show while still allowing historical `CANCELLED` or `FAILED` bookings for those seats.

---

## 4. Phase 2 Features Summary

- **Razorpay Payment Gateway (`test` mode)**:
  - `POST /api/payments/create-order`: Creates Razorpay order for a `PENDING` booking.
  - `POST /api/payments/verify`: Server-side HMAC signature verification; confirms booking & clears seat holds, or releases holds & marks booking `FAILED`.
  - `POST /api/payments/webhook`: Fallback webhook handler for `payment.captured` and `payment.failed` events.
  - **Automated Refunds on Cancellation**: `PATCH /api/bookings/:id/cancel` (allowed until 2 hours before showtime) calculates the refund tier, calls `razorpay.payments.refund()`, frees the seats on `Show`, and sets `paymentStatus: 'REFUNDED'`.
- **Admin Panel (`/admin` & `/api/admin/*`)**:
  - Protected by `requireAuth` + `isAdmin` middleware on the server and `<AdminRoute>` on the client.
  - Dashboard stat cards (`GET /api/admin/stats`): Total Revenue, Confirmed Bookings, Upcoming Shows, and Most Booked Event.
  - Events CRUD (`POST/PUT/DELETE /api/admin/events`) with modal form supporting poster image upload or URL, cast, trailer URL, and genres.
  - Shows CRUD (`GET/POST/PUT/DELETE /api/admin/shows`) scoped to an event with venue, city, startTime, tier pricing, and seat layout dimensions.
  - Read-only Customer Bookings ledger (`GET /api/admin/bookings`) with status filter, date filter, and pagination.
- **Downloadable PDF Ticket (`GET /api/bookings/:id/ticket`)**:
  - Owner-protected endpoint generating a styled PDF ticket via `pdfkit` and `qrcode` containing event title, poster, venue, date/time, seat numbers, total paid, booking reference code, and scannable QR code.
  - Available via the **"Download Ticket"** button on both `BookingSuccess` and `MyBookings`.
- **Transactional Email Notifications (`server/src/utils/mailer.js`)**:
  - Sends HTML emails via Nodemailer for **6-Digit OTPs**, **Booking Confirmations** (after payment verification), and **Booking Cancellations** (with refund breakdown).

---

## 5. Promoting a User to Admin (`make-admin`)

To access the Admin Panel at `http://localhost:5173/admin`, promote an account to `role: 'admin'` using the built-in script:

```bash
cd server
# Promote a specific user by email or username:
npm run make-admin -- your_email@gmail.com

# Or promote all existing users in your development database to admin:
npm run make-admin
```

Alternatively, update the user document manually in MongoDB Compass / Atlas:
```js
db.users.updateOne({ email: "your_email@gmail.com" }, { $set: { role: "admin" } })
```

---

## 6. Local Setup & Running Instructions

### Prerequisites
- **Node.js** v18+
- **MongoDB** (Local `mongodb://127.0.0.1:27017/ticketbook` or MongoDB Atlas URI)

### Step 1: Configure Environment Variables

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

### Step 2: Install Dependencies & Seed Database

```bash
# Install and seed backend (12+ movies, concerts, sports, comedy shows)
cd server
npm install
npm run seed

# Promote your user to admin
npm run make-admin

# Start backend server on http://localhost:5000
npm run dev
```

```bash
# In a second terminal, install and start frontend on http://localhost:5173
cd client
npm install
npm run dev
```

### Step 3: Production Build & Health Check
- Client production build: `cd client && npm run build`
- Server health check endpoint: `GET http://localhost:5000/api/health` (`200 OK`)
