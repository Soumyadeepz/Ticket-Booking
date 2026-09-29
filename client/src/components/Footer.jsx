import React from 'react';
import { Link } from 'react-router-dom';
import { Ticket, ShieldCheck, Clock, Sparkles } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="mt-20 border-t border-white/10 bg-zinc-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3 md:col-span-2">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-rose-600 flex items-center justify-center">
                <Ticket className="w-4 h-4 text-white -rotate-12" />
              </div>
              <span className="font-display font-extrabold text-xl text-white">
                Ticket<span className="text-gradient">Book</span>
              </span>
            </Link>
            <p className="text-sm text-zinc-400 max-w-md leading-relaxed">
              Next-generation cinema, concert, and live event booking platform. Real-time 5-minute
              seat holds, instant QR e-tickets, and hassle-free refunds up to 2 hours before showtime.
            </p>
            <div className="flex flex-wrap gap-4 pt-2 text-xs text-zinc-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-purple-400" /> OTP & JWT Verified Security
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-rose-400" /> 5-Min Real-Time Seat Lock
              </span>
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" /> Instant QR Code E-Tickets
              </span>
            </div>
          </div>

          <div>
            <h4 className="font-display font-bold text-sm uppercase tracking-wider text-zinc-200 mb-3">
              Explore
            </h4>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li>
                <Link to="/events?category=Movie" className="hover:text-purple-400 transition-colors">
                  Movies in IMAX
                </Link>
              </li>
              <li>
                <Link to="/events?category=Concert" className="hover:text-purple-400 transition-colors">
                  Live Concerts
                </Link>
              </li>
              <li>
                <Link to="/events?category=Theater" className="hover:text-purple-400 transition-colors">
                  Theatre & Plays
                </Link>
              </li>
              <li>
                <Link to="/events?category=Comedy" className="hover:text-purple-400 transition-colors">
                  Stand-up Comedy
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-bold text-sm uppercase tracking-wider text-zinc-200 mb-3">
              Account
            </h4>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li>
                <Link to="/my-bookings" className="hover:text-purple-400 transition-colors">
                  My Bookings & Refunds
                </Link>
              </li>
              <li>
                <Link to="/profile" className="hover:text-purple-400 transition-colors">
                  Profile Settings
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-purple-400 transition-colors">
                  Sign In / Verify OTP
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500">
          <p>© {new Date().getFullYear()} TicketBook Cinema & Live Entertainment. All rights reserved.</p>
          <p className="mt-2 sm:mt-0">Crafted with React, Tailwind CSS, Express & MongoDB</p>
        </div>
      </div>
    </footer>
  );
};
