'use client';

import React from 'react';
import Link from 'next/link';
import {
  Video,
  Zap,
  ShieldCheck,
  Facebook,
  Youtube,
  Instagram,
  FileText,
  CheckCircle2,
  Wrench,
} from 'lucide-react';
import { PagePlatform, PlatformType } from '@/lib/platforms';
import { getLocalizedPlatformConfig } from '@/lib/platforms-bn';
import { getLocalizedSeoData } from '@/lib/seo-data';
import type { BanglaPlatformSeoConfig } from '@/lib/seo-data-bn';
import { Locale, getLocalizedPath } from '@/lib/i18n';

const TikTokIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 3 15.68 6.34 6.34 0 0 0 9.35 22a6.33 6.33 0 0 0 6.33-6.32V9.05a8.16 8.16 0 0 0 4.91 1.62V7.22a4.85 4.85 0 0 1-1-.53z" />
  </svg>
);

interface FeaturesGridProps {
  platform?: PagePlatform;
  locale?: Locale;
}

interface ToolSuggestionOption {
  id: PlatformType | 'youtube-transcript';
  title: string;
  bnTitle: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  badgeBg: string;
  btnStyle: string;
}

const ALL_TOOL_SUGGESTIONS: ToolSuggestionOption[] = [
  {
    id: 'facebook',
    title: 'Facebook Video Downloader',
    bnTitle: 'ফেসবুক ভিডিও ডাউনলোডার',
    path: '/facebook',
    icon: Facebook,
    iconColor: 'text-[#1877F2]',
    badgeBg: 'bg-[#1877F2]/10',
    btnStyle:
      'bg-white text-slate-800 border-slate-200 hover:bg-[#1877F2] hover:text-white hover:border-[#1877F2] shadow-2xs hover:shadow-md',
  },
  {
    id: 'youtube',
    title: 'YouTube Video Downloader',
    bnTitle: 'ইউটিউব ভিডিও ডাউনলোডার',
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
    bnTitle: 'ইনস্টাগ্রাম ভিডিও ডাউনলোডার',
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
    bnTitle: 'টিকটক ভিডিও ডাউনলোডার',
    path: '/tiktok',
    icon: TikTokIcon,
    iconColor: 'text-slate-900',
    badgeBg: 'bg-slate-200/80',
    btnStyle:
      'bg-white text-slate-800 border-slate-200 hover:bg-slate-900 hover:text-white hover:border-slate-900 shadow-2xs hover:shadow-md',
  },
  {
    id: 'youtube-transcript',
    title: 'YouTube Transcript Tool',
    bnTitle: 'ইউটিউব ট্রান্সক্রিপ্ট টুল',
    path: '/youtube-transcript',
    icon: FileText,
    iconColor: 'text-red-600',
    badgeBg: 'bg-red-500/10',
    btnStyle:
      'bg-white text-slate-800 border-slate-200 hover:bg-red-600 hover:text-white hover:border-red-600 shadow-2xs hover:shadow-md',
  },
];

export const FeaturesGrid: React.FC<FeaturesGridProps> = ({ platform = 'home', locale = 'en' }) => {
  const isBn = locale === 'bn';
  const platformConfig = getLocalizedPlatformConfig(platform, locale);
  const seoInfo = getLocalizedSeoData(platform, locale);
  const bnSeo = isBn ? (seoInfo as BanglaPlatformSeoConfig) : null;
  const isHome = platform === 'home';

  const relatedSuggestions = isHome
    ? ALL_TOOL_SUGGESTIONS
    : ALL_TOOL_SUGGESTIONS.filter((item) => item.id !== platform);

  const featureIcons = [Video, Zap, ShieldCheck];
  const featureStyles = [
    { color: platformConfig.iconColor, bgColor: platformConfig.featureIconBg },
    { color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
    { color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
  ];

  return (
    <section className="w-full max-w-5xl mx-auto px-4 py-12 border-t border-slate-200/80 my-6 space-y-12">
      {/* Title & Subtitle */}
      <div>
        <div className="text-center mb-6 space-y-1.5">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            {isBn
              ? isHome
                ? 'কেন Save Vibe ভিডিও ডাউনলোডার ব্যবহার করবেন?'
                : `কেন Save Vibe ${platformConfig.name} ডাউনলোডার সেরা?`
              : isHome
              ? 'Why Choose Save Vibe Video Downloader'
              : `Why Choose Save Vibe ${platformConfig.name} Downloader`}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
            {seoInfo.featuresSubtitle}
          </p>
        </div>

        {/* Dedicated Tools Internal Cross-Linking */}
        <div className="mb-10 max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-3.5">
            <span className="h-px bg-slate-200/80 flex-1 max-w-[50px] sm:max-w-[90px]" />
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider text-center px-1">
              {isBn
                ? isHome
                  ? 'সাপোর্টেড প্ল্যাটফর্ম ডাউনলোডারসমূহ'
                  : 'Save Vibe-এর অন্যান্য টুলস দেখুন'
                : isHome
                ? 'Supported Platform Downloaders'
                : 'Explore More Save Vibe Tools'}
            </span>
            <span className="h-px bg-slate-200/80 flex-1 max-w-[50px] sm:max-w-[90px]" />
          </div>

          <div
            className={`grid grid-cols-1 sm:grid-cols-2 ${
              relatedSuggestions.length >= 5 ? 'lg:grid-cols-5' : 'lg:grid-cols-4'
            } gap-3`}
          >
            {relatedSuggestions.map((item) => {
              const IconComponent = item.icon;
              return (
                <Link
                  key={item.id}
                  href={getLocalizedPath(item.path, locale)}
                  className={`group relative flex items-center gap-2.5 p-3 rounded-xl border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 ${item.btnStyle}`}
                >
                  <div
                    className={`p-2 rounded-lg ${item.badgeBg} group-hover:bg-white/20 transition-colors shrink-0 flex items-center justify-center`}
                  >
                    <IconComponent
                      className={`w-4 h-4 ${item.iconColor} group-hover:text-white transition-colors`}
                    />
                  </div>
                  <span className="text-xs font-bold leading-tight truncate group-hover:text-white transition-colors">
                    {isBn ? item.bnTitle : item.title}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Platform-Specific 3 Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {seoInfo.features.map((feature, idx) => {
            const IconComponent = featureIcons[idx] || Video;
            const style = featureStyles[idx] || featureStyles[0];
            return (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col items-center text-center space-y-3"
              >
                <div className={`p-3 rounded-xl ${style.bgColor} ${style.color}`}>
                  <IconComponent className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900">{feature.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Rich Platform Guide & Supported Formats Section */}
      <article className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 sm:p-8 space-y-5">
        <div className="space-y-2">
          <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-[#1877F2] bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-md">
            {seoInfo.guideBadge}
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {seoInfo.guideTitle}
          </h2>
        </div>

        <div className="space-y-3.5 text-sm text-slate-600 leading-relaxed">
          {seoInfo.guideParagraphs.map((paragraph, pIdx) => (
            <p key={pIdx}>{paragraph}</p>
          ))}
        </div>

        <div className="pt-2 border-t border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3">
            {isBn
              ? 'সাপোর্টেড লিংক, রেজোলিউশন ও ফরম্যাট'
              : 'Supported Links, Resolutions & Formats'}
          </h3>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {seoInfo.supportedFormats.map((fmt, fIdx) => (
              <li key={fIdx} className="flex items-start gap-2 text-xs text-slate-600">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>{fmt}</span>
              </li>
            ))}
          </ul>
        </div>
      </article>

      {/* Troubleshooting Guide for Bangla Pages */}
      {bnSeo && bnSeo.troubleshooting?.length > 0 && (
        <section className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <Wrench className="w-4 h-4" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              {bnSeo.troubleshootingTitle}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {bnSeo.troubleshooting.map((item, tIdx) => (
              <div
                key={tIdx}
                className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/70 space-y-2"
              >
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                  {item.issue}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">{item.solution}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </section>
  );
};
