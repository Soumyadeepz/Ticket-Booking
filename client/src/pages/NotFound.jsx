import React from 'react';
import { Link } from 'react-router-dom';
import { Film, Home, Compass } from 'lucide-react';

export const NotFound = () => {
  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4">
      <div className="glass-card max-w-lg w-full rounded-3xl p-10 text-center space-y-6 border border-white/15 shadow-glow">
        <div className="w-16 h-16 rounded-2xl bg-purple-600/20 border border-purple-500/40 text-purple-400 flex items-center justify-center mx-auto">
          <Film className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <p className="font-display font-black text-6xl text-gradient">404</p>
          <h1 className="font-display font-extrabold text-2xl text-white">
            Scene Missing From The Reel
          </h1>
          <p className="text-sm text-zinc-400">
            The page or auditorium you are looking for doesn’t exist or may have moved.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl btn-gradient text-sm font-bold"
          >
            <Home className="w-4 h-4" /> Back to Home
          </Link>
          <Link
            to="/events"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-sm font-semibold text-white"
          >
            <Compass className="w-4 h-4" /> Browse Events
          </Link>
        </div>
      </div>
    </div>
  );
};
