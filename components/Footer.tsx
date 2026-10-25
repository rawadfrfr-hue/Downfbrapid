'use client';

import React from 'react';
import { Coffee, ShieldCheck, Zap } from 'lucide-react';

interface FooterProps {
  onOpenBuyCoffee: () => void;
  totalDownloadsCount: number;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenBuyCoffee,
  totalDownloadsCount,
}) => {
  return (
    <footer className="w-full border-t border-slate-200/60 dark:border-slate-800/60 py-6 px-4 mt-auto">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
        {/* Left copyright & quiet quality badge */}
        <div className="flex items-center gap-2">
          <span>© {new Date().getFullYear()} SnapFB Downloader</span>
          <span aria-hidden="true">·</span>
          <span className="flex items-center gap-1 text-slate-400 dark:text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            Ad-Free & Safe
          </span>
          {totalDownloadsCount > 0 && (
            <>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-1 text-slate-400 dark:text-slate-500">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                {totalDownloadsCount} Saved This Session
              </span>
            </>
          )}
        </div>

        {/* Right: Tiny "Buy me a coffee" link */}
        <button
          onClick={onOpenBuyCoffee}
          className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 hover:text-amber-500 dark:hover:text-amber-400 font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded-lg px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800"
          title="Support developer"
        >
          <Coffee className="w-3.5 h-3.5 text-amber-500" />
          <span>Buy me a coffee</span>
        </button>
      </div>
    </footer>
  );
};
