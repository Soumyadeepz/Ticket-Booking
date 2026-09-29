import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute';
import { Home } from './pages/Home';
import { Events } from './pages/Events';
import { EventDetails } from './pages/EventDetails';
import { SeatSelection } from './pages/SeatSelection';
import { Checkout } from './pages/Checkout';
import { BookingSuccess } from './pages/BookingSuccess';
import { MyBookings } from './pages/MyBookings';
import { AdminDashboard } from './pages/AdminDashboard';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { VerifyOtp } from './pages/VerifyOtp';
import { Profile } from './pages/Profile';
import { NotFound } from './pages/NotFound';

export default function App() {
  return (
    <div className="app-shell relative min-h-screen flex flex-col bg-[#06060b] text-zinc-100 transition-colors duration-300 overflow-x-hidden">
      {/* === GLOBAL MODERN AMBIENT LIGHT & AURORA BACKDROP (All Pages) === */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {/* Overhead Studio Radial Light Beam */}
        <div className="ambient-beam absolute inset-0 bg-[radial-gradient(ellipse_90%_55%_at_50%_-12%,rgba(168,85,247,0.26),rgba(244,63,94,0.09)_52%,transparent_80%)]" />

        {/* Volumetric Floating Aurora Light Orbs */}
        <div className="ambient-orb-1 absolute -top-40 -left-28 w-[34rem] h-[34rem] bg-purple-600/20 rounded-full blur-[145px] animate-pulse" />
        <div className="ambient-orb-2 absolute top-[28%] -right-36 w-[32rem] h-[32rem] bg-rose-500/15 rounded-full blur-[150px]" />
        <div className="ambient-orb-3 absolute -bottom-44 left-[20%] w-[38rem] h-[28rem] bg-indigo-600/15 rounded-full blur-[160px]" />

        {/* Subtle Architectural Perspective Grid with Radial Fade */}
        <div
          className="ambient-grid absolute inset-0 opacity-[0.045] [mask-image:radial-gradient(ellipse_85%_65%_at_50%_25%,#000_35%,transparent_100%)]"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(255,255,255,0.85) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.85) 1px, transparent 1px)',
            backgroundSize: '52px 52px',
          }}
        />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1">
        <Routes>
          {/* User cannot see Home, Events, EventDetails, or SeatSelection until logged in */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/events"
            element={
              <ProtectedRoute>
                <Events />
              </ProtectedRoute>
            }
          />
          <Route
            path="/events/:id"
            element={
              <ProtectedRoute>
                <EventDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/shows/:id/seats"
            element={
              <ProtectedRoute>
                <SeatSelection />
              </ProtectedRoute>
            }
          />
          <Route
            path="/checkout/:showId"
            element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>
            }
          />
          <Route
            path="/booking-success/:id"
            element={
              <ProtectedRoute>
                <BookingSuccess />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-bookings"
            element={
              <ProtectedRoute>
                <MyBookings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        </main>
        <Footer />
      </div>
    </div>
  );
}
