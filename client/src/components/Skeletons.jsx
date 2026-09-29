import React from 'react';

export const EventCardSkeleton = () => (
  <div className="glass-card rounded-2xl overflow-hidden animate-pulse">
    <div className="aspect-[2/3] bg-zinc-800/80 w-full" />
    <div className="p-4 space-y-3">
      <div className="h-5 bg-zinc-800 rounded w-3/4" />
      <div className="h-3.5 bg-zinc-800/70 rounded w-1/2" />
      <div className="flex justify-between items-center pt-2">
        <div className="h-4 bg-zinc-800 rounded w-16" />
        <div className="h-8 bg-zinc-800 rounded-lg w-24" />
      </div>
    </div>
  </div>
);

export const HeroSkeleton = () => (
  <div className="w-full h-[500px] md:h-[580px] rounded-3xl bg-zinc-900/70 border border-white/5 animate-pulse flex items-end p-8 md:p-14">
    <div className="max-w-2xl space-y-4 w-full">
      <div className="h-6 bg-zinc-800 rounded-full w-32" />
      <div className="h-12 bg-zinc-800 rounded-xl w-3/4" />
      <div className="h-4 bg-zinc-800 rounded w-full" />
      <div className="h-4 bg-zinc-800 rounded w-2/3" />
      <div className="flex gap-4 pt-3">
        <div className="h-12 bg-zinc-800 rounded-xl w-40" />
        <div className="h-12 bg-zinc-800 rounded-xl w-40" />
      </div>
    </div>
  </div>
);

export const SeatMapSkeleton = () => (
  <div className="glass-card rounded-3xl p-8 space-y-8 animate-pulse">
    <div className="h-8 bg-zinc-800/70 rounded-full w-2/3 mx-auto" />
    <div className="space-y-3 max-w-2xl mx-auto">
      {Array.from({ length: 8 }).map((_, r) => (
        <div key={r} className="flex justify-center gap-2">
          {Array.from({ length: 12 }).map((__, c) => (
            <div key={c} className="w-7 h-7 rounded-t-lg bg-zinc-800/80" />
          ))}
        </div>
      ))}
    </div>
  </div>
);
