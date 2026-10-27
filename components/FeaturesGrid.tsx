'use client';

import React from 'react';
import Link from 'next/link';
import { Video, Zap, ShieldCheck, Facebook, Youtube, Instagram } from 'lucide-react';
import { PLATFORMS, PlatformType } from '@/lib/platforms';

const TikTokIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 3 15.68 6.34 6.34 0 0 0 9.35 22a6.33 6.33 0 0 0 6.33-6.32V9.05a8.16 8.16 0 0 0 4.91 1.62V7.22a4.85 4.85 0 0 1-1-.53z" />
  </svg>
);

interface FeaturesGridProps {
  platform?: PlatformType;
}

interface SuggestionOption {
  id: PlatformType;
  title: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  badgeBg: string;
  btnStyle: string;
}

const ALL_SUGGESTIONS: SuggestionOption[] = [
  {
    id: 'facebook',
    title: 'Facebook Video Downloader',
    path: '/',
    icon: Facebook,
    iconColor: 'text-[#1877F2]',
    badgeBg: 'bg-[#1877F2]/10',
    btnStyle:
      'bg-white text-slate-800 border-slate-200 hover:bg-[#1877F2] hover:text-white hover:border-[#1877F2] shadow-2xs hover:shadow-md',
  },
  {
    id: 'youtube',
    title: 'YouTube Video Downloader',
    path: '/youtube',
    icon: Youtube,
    iconColor: 'text-red-600',
    badgeBg: 'bg-red-500/10',
    btnStyle:
      'bg-white text-slate-800 border-slate-200 hover:bg-red-600 hover:text-white hover:border-red-600 shadow-2xs hover:shadow-md',
  },
  {
    id: 'instagram',
    title: 'Instagram Video Downloader',
    path: '/instagram',
    icon: Instagram,
    iconColor: 'text-[#E1306C]',
    badgeBg: 'bg-pink-500/10',
    btnStyle:
      'bg-white text-slate-800 border-slate-200 hover:bg-gradient-to-r hover:from-[#833AB4] hover:via-[#FD1D1D] hover:to-[#F77737] hover:text-white hover:border-transparent shadow-2xs hover:shadow-md',
  },
  {
    id: 'tiktok',
    title: 'TikTok Video Downloader',
    path: '/tiktok',
    icon: TikTokIcon,
    iconColor: 'text-slate-900',
    badgeBg: 'bg-slate-200/80',
    btnStyle:
      'bg-white text-slate-800 border-slate-200 hover:bg-slate-900 hover:text-white hover:border-slate-900 shadow-2xs hover:shadow-md',
  },
];

export const FeaturesGrid: React.FC<FeaturesGridProps> = ({ platform = 'facebook' }) => {
  const platformConfig = PLATFORMS[platform] || PLATFORMS.facebook;

  // Dynamically filter out current platform to leave the remaining 3 suggestions
  const relatedSuggestions = ALL_SUGGESTIONS.filter((item) => item.id !== platform);

  const features = [
    {
      icon: Video,
      title: 'High Quality',
      description: `Download crisp 1080p, 4K HD ${platformConfig.name} videos, reels, and high-bitrate MP3 audio without compression loss.`,
      color: platformConfig.iconColor,
      bgColor: platformConfig.featureIconBg,
    },
    {
      icon: Zap,
      title: 'Ultra Fast',
      description: 'Blazing fast processing speed with direct high-speed CDN delivery for instant downloads.',
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
    {
      icon: ShieldCheck,
      title: 'Secure Connection',
      description: '100% Malware-Free, encrypted connections with total user privacy and zero data tracking.',
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
  ];

  return (
    <section className="w-full max-w-5xl mx-auto px-4 py-12 border-t border-slate-200/80 my-6">
      {/* Title & Subtitle */}
      <div className="text-center mb-6 space-y-1.5">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
          Why Choose SaveVibe {platformConfig.name} Downloader
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
          Built with high-performance infrastructure for seamless {platformConfig.name} media downloads
        </p>
      </div>

      {/* Dynamic Related Suggestions Section (Placed between heading and "High Quality" card section) */}
      <div className="mb-10 max-w-3xl mx-auto">
        <div className="flex items-center justify-center gap-2 mb-3.5">
          <span className="h-px bg-slate-200/80 flex-1 max-w-[50px] sm:max-w-[90px]" />
          <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider text-center px-1">
            Dynamic Related Suggestions
          </span>
          <span className="h-px bg-slate-200/80 flex-1 max-w-[50px] sm:max-w-[90px]" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {relatedSuggestions.map((item) => {
            const IconComponent = item.icon;
            return (
              <Link
                key={item.id}
                href={item.path}
                className={`group relative flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 ${item.btnStyle}`}
              >
                <div
                  className={`p-2 rounded-lg ${item.badgeBg} group-hover:bg-white/20 transition-colors shrink-0 flex items-center justify-center`}
                >
                  <IconComponent className={`w-4 h-4 ${item.iconColor} group-hover:text-white transition-colors`} />
                </div>
                <span className="text-xs font-bold leading-tight truncate group-hover:text-white transition-colors">
                  {item.title}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* High Quality & Core Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {features.map((feature, idx) => {
          const IconComponent = feature.icon;
          return (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col items-center text-center space-y-3"
            >
              <div className={`p-3 rounded-xl ${feature.bgColor} ${feature.color}`}>
                <IconComponent className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                {feature.title}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
};
