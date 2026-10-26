'use client';

import React from 'react';
import { Sun, Moon, Sparkles, History } from 'lucide-react';

interface HeaderProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  historyCount: number;
  onOpenHistory: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isDarkMode,
  onToggleDarkMode,
  historyCount,
  onOpenHistory,
}) => {
  return (
    <header className="w-full border-b border-slate-200/60 dark:border-slate-800/60 backdrop-blur-md bg-white/70 dark:bg-[#0B0F19]/70 sticky top-0 z-40 transition-colors duration-250">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#1877F2] flex items-center justify-center text-white shadow-md shadow-[#1877F2]/25 font-black text-xl tracking-tighter transform-gpu hover:scale-105 transition-transform duration-200">
            f
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white leading-none">
              SnapFB
            </span>
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 leading-none mt-1">
              Fast & Secure Video Downloader
            </span>
          </div>
        </div>

        {/* Right Actions: History + Theme Toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          {historyCount > 0 && (
            <button
              onClick={onOpenHistory}
              className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all duration-200 text-xs font-medium flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1877F2]"
              title="Recent Downloads History"
              aria-label="Open download history"
            >
              <History className="w-4 h-4 text-[#1877F2]" />
              <span className="hidden sm:inline">History</span>
              <span className="bg-[#1877F2] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                {historyCount}
              </span>
            </button>
          )}

          {/* Dark / Light Mode Switch */}
          <button
            onClick={onToggleDarkMode}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-[#1877F2]/40 dark:hover:border-[#1877F2]/40 hover:bg-white dark:hover:bg-slate-800 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1877F2] transform-gpu active:scale-95"
            aria-label={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 text-amber-400 transition-transform duration-300 rotate-0 hover:rotate-90" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700 transition-transform duration-300 rotate-0 hover:-rotate-12" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
