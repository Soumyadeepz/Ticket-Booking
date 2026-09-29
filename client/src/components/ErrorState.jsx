import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export const ErrorState = ({
  title = 'Unable to Load Data',
  message = 'Something went wrong while fetching data from the server.',
  onRetry,
}) => (
  <div className="glass-card rounded-3xl p-8 sm:p-12 text-center space-y-4 max-w-xl mx-auto my-6 border border-rose-500/30">
    <div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto">
      <AlertCircle className="w-7 h-7" />
    </div>
    <h3 className="font-display font-bold text-xl text-white">{title}</h3>
    <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto">{message}</p>
    {onRetry && (
      <div className="pt-2">
        <button
          type="button"
          onClick={onRetry}
          className="keep-white inline-flex items-center gap-2 px-5 py-2.5 rounded-xl btn-gradient text-xs sm:text-sm font-bold"
        >
          <RefreshCw className="w-4 h-4" /> Retry Now
        </button>
      </div>
    )}
  </div>
);
