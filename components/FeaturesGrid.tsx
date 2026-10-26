'use client';

import React from 'react';
import { Video, Zap, ShieldCheck } from 'lucide-react';

const FEATURES = [
  {
    icon: Video,
    title: 'High Quality',
    description: 'Download crisp 1080p, 4K HD videos and high-bitrate MP3 audio without compression loss.',
    color: 'text-[#1877F2]',
    bgColor: 'bg-[#1877F2]/10 dark:bg-[#1877F2]/20',
  },
  {
    icon: Zap,
    title: 'Ultra Fast',
    description: 'Blazing fast processing speed with direct high-speed CDN delivery for instant downloads.',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10 dark:bg-amber-500/20',
  },
  {
    icon: ShieldCheck,
    title: 'Secure Connection',
    description: '100% Malware-Free, encrypted connections with total user privacy and zero data tracking.',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10 dark:bg-emerald-500/20',
  },
];

export const FeaturesGrid: React.FC = () => {
  return (
    <section className="w-full max-w-5xl mx-auto px-4 py-12 border-t border-slate-200/60 dark:border-slate-800/60 my-6">
      <div className="text-center mb-8 space-y-1.5">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
          Why Choose Our Downloader
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Built with high-performance infrastructure for seamless media downloads
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {FEATURES.map((feature, idx) => {
          const IconComponent = feature.icon;
          return (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200/70 dark:border-slate-800/80 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col items-center text-center space-y-3"
            >
              <div className={`p-3 rounded-xl ${feature.bgColor} ${feature.color}`}>
                <IconComponent className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {feature.title}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
};
