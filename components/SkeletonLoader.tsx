'use client';

import React from 'react';
import { motion } from 'motion/react';

export const SkeletonLoader: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-2xl mx-auto mt-8 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl shadow-xl shadow-slate-900/5 overflow-hidden relative transform-gpu"
    >
      {/* Top status indicator */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800/60">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#1877F2] animate-ping" />
          <span className="text-xs font-semibold text-[#1877F2] tracking-wide uppercase">
            Fetching Video Streams...
          </span>
        </div>
        <div className="h-4 w-20 rounded-md bg-slate-200 dark:bg-slate-800 relative overflow-hidden">
          <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent transform-gpu" />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-6 items-start">
        {/* Shimmering Video Thumbnail Box Placeholder */}
        <div className="w-full sm:w-48 aspect-video sm:aspect-square rounded-2xl bg-slate-200 dark:bg-slate-800 relative overflow-hidden shrink-0 shadow-inner">
          <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent transform-gpu" />
          {/* Play Icon Outline inside skeleton */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full border-2 border-slate-300 dark:border-slate-700/60 flex items-center justify-center">
              <div className="w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[10px] border-l-slate-300 dark:border-l-slate-700 ml-0.5" />
            </div>
          </div>
        </div>

        {/* Shimmering Content & Button Placeholders */}
        <div className="flex-1 w-full space-y-4">
          {/* Title Placeholder Line 1 */}
          <div className="h-5 w-5/6 rounded-lg bg-slate-200 dark:bg-slate-800 relative overflow-hidden">
            <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent transform-gpu" />
          </div>

          {/* Title Placeholder Line 2 */}
          <div className="h-4 w-3/5 rounded-lg bg-slate-200 dark:bg-slate-800 relative overflow-hidden">
            <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent transform-gpu" />
          </div>

          {/* Meta chips placeholder */}
          <div className="flex items-center gap-3 pt-1">
            <div className="h-3.5 w-16 rounded bg-slate-200 dark:bg-slate-800 relative overflow-hidden">
              <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent transform-gpu" />
            </div>
            <div className="h-3.5 w-20 rounded bg-slate-200 dark:bg-slate-800 relative overflow-hidden">
              <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent transform-gpu" />
            </div>
          </div>

          {/* Two Action Button Placeholders */}
          <div className="space-y-2.5 pt-3">
            {/* Button Placeholder 1 (HD) */}
            <div className="h-11 w-full rounded-xl bg-slate-200 dark:bg-slate-800 relative overflow-hidden shadow-sm">
              <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent transform-gpu" />
            </div>

            {/* Button Placeholder 2 (Normal) */}
            <div className="h-11 w-full rounded-xl bg-slate-200 dark:bg-slate-800 relative overflow-hidden shadow-sm">
              <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent transform-gpu" />
            </div>

            {/* Button Placeholder 3 (MP3) */}
            <div className="h-10 w-full rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 relative overflow-hidden">
              <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent transform-gpu" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
