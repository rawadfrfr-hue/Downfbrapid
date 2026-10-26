'use client';

import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="w-full border-b border-slate-200/80 backdrop-blur-md bg-white/80 sticky top-0 z-40 transition-colors duration-250">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <img
            src="/assets/aistudio/logoosavevibe_afe0d13c.svg"
            alt="SaveVibe Logo"
            className="w-9 h-9 object-contain shrink-0"
          />
          <div className="flex flex-col">
            <span className="font-bold text-xl tracking-tight text-slate-900 leading-none">
              SaveVibe
            </span>
            <span className="text-[10px] font-medium text-slate-500 leading-none mt-1">
              Fast & Secure Video Downloader
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
