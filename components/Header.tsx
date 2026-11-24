'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  Menu,
  X,
  Facebook,
  Youtube,
  Instagram,
  Film,
  Play,
  Camera,
  Music,
  FileText,
  Home,
  Globe,
} from 'lucide-react';
import { PLATFORMS, PagePlatform, PlatformType, getPlatformConfig } from '@/lib/platforms';
import {
  Locale,
  getLocaleFromPathname,
  getLocalizedPath,
  getMatchingLanguagePath,
  stripLocalePrefix,
} from '@/lib/i18n';
import type { CmsLanguageRecord } from '@/lib/cms-types';

const TikTokIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 3 15.68 6.34 6.34 0 0 0 9.35 22a6.33 6.33 0 0 0 6.33-6.32V9.05a8.16 8.16 0 0 0 4.91 1.62V7.22a4.85 4.85 0 0 1-1-.53z" />
  </svg>
);

const BrandLogoSvg: React.FC<{ className?: string }> = ({ className = 'w-9 h-9' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 72 72"
    aria-hidden="true"
    className={`savevibe-logo shrink-0 ${className}`}
  >
    <path
      fill="currentColor"
      d="M53,17c4.41,0,8,3.59,8,8v22c0,4.41-3.59,8-8,8H19c-4.41,0-8-3.59-8-8V25c0-4.41,3.59-8,8-8h14v14.95l-2.23-2.24c-0.97-0.98-2.55-0.98-3.53-0.01c-0.98,0.97-0.99,2.56-0.01,3.54l7,7.05c0.47,0.47,1.1,0.74,1.77,0.74s1.3-0.27,1.77-0.74l7-7.05c0.98-0.98,0.97-2.57-0.01-3.54c-0.98-0.97-2.56-0.97-3.53,0.01L39,31.95V10c0-1.657,1.343-3,3-3s3,1.343,3,3v7H53z"
    />
  </svg>
);

interface HeaderProps {
  platform?: PagePlatform;
  locale?: Locale;
  activeLanguages?: CmsLanguageRecord[];
  siteName?: string;
}

export const Header: React.FC<HeaderProps> = ({
  platform,
  locale,
  activeLanguages,
  siteName = 'Save Vibe',
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const pathname = usePathname();

  const resolvedLocale: Locale = locale || getLocaleFromPathname(pathname);
  const isBn = resolvedLocale === 'bn';
  const basePath = stripLocalePrefix(pathname).basePath;

  const languagesList: CmsLanguageRecord[] =
    activeLanguages && activeLanguages.length > 0
      ? activeLanguages
      : [
          {
            id: 'en',
            code: 'en',
            name: 'English',
            nativeName: 'English',
            hreflang: 'en',
            direction: 'ltr',
            isDefault: true,
            isActive: true,
            sortOrder: 0,
            updatedAt: '',
          },
          {
            id: 'bn',
            code: 'bn',
            name: 'Bengali',
            nativeName: 'বাংলা',
            hreflang: 'bn',
            direction: 'ltr',
            isDefault: false,
            isActive: true,
            sortOrder: 1,
            updatedAt: '',
          },
        ];

  const activePlatform: PagePlatform = (() => {
    if (platform) return platform;
    if (basePath.startsWith('/youtube')) return 'youtube';
    if (basePath.startsWith('/instagram')) return 'instagram';
    if (basePath.startsWith('/tiktok')) return 'tiktok';
    if (basePath.startsWith('/facebook')) return 'facebook';
    return 'home';
  })();

  const activeThemeClass = getPlatformConfig(activePlatform).themeClass;
  const homeHref = getLocalizedPath('/', resolvedLocale);
  const alternateHref = getMatchingLanguagePath(pathname, isBn ? 'en' : 'bn');
  const alternateLabel = isBn ? 'English' : 'বাংলা';
  const alternateLangCode = isBn ? 'en' : 'bn';
  const currentLangObj =
    languagesList.find((l) => l.code === resolvedLocale) || languagesList[0];

  // Sync browser tab SVG favicon cleanly on client-side navigation for platform pages
  useEffect(() => {
    let svgIconLink = document.getElementById('savevibe-tab-favicon') as HTMLLinkElement | null;

    if (activePlatform === 'home') {
      if (svgIconLink) {
        svgIconLink.remove();
      }
      return;
    }

    const faviconUrl = PLATFORMS[activePlatform].faviconPath;

    if (!svgIconLink) {
      svgIconLink = document.createElement('link');
      svgIconLink.id = 'savevibe-tab-favicon';
      svgIconLink.rel = 'icon';
      svgIconLink.type = 'image/svg+xml';
      svgIconLink.setAttribute('sizes', 'any');
      document.head.prepend(svgIconLink);
    }

    if (svgIconLink.getAttribute('href') !== faviconUrl) {
      svgIconLink.setAttribute('href', faviconUrl);
    }
  }, [activePlatform]);

  // Reset menu on route change
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setIsMenuOpen(false);
    setIsLangMenuOpen(false);
  }

  // Handle ESC key to close sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMenuOpen) {
        setIsMenuOpen(false);
      }
      if (e.key === 'Escape' && isLangMenuOpen) {
        setIsLangMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMenuOpen, isLangMenuOpen]);

  // Lock body scroll when sidebar is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  // Desktop Menu Items
  const desktopMenuItems = [
    {
      id: 'facebook' as PlatformType,
      label: isBn ? 'ফেসবুক' : 'Facebook',
      path: getLocalizedPath(PLATFORMS.facebook.path, resolvedLocale),
      icon: Facebook,
      colorClass: 'text-[#1877F2]',
      activeBorder: 'border-[#1877F2]',
      activeBg: 'bg-blue-50/80 text-[#1877F2]',
    },
    {
      id: 'youtube' as PlatformType,
      label: isBn ? 'ইউটিউব' : 'YouTube',
      path: getLocalizedPath(PLATFORMS.youtube.path, resolvedLocale),
      icon: Youtube,
      colorClass: 'text-red-600',
      activeBorder: 'border-red-600',
      activeBg: 'bg-red-50/80 text-red-600',
    },
    {
      id: 'instagram' as PlatformType,
      label: isBn ? 'ইনস্টাগ্রাম' : 'Instagram',
      path: getLocalizedPath(PLATFORMS.instagram.path, resolvedLocale),
      icon: Instagram,
      colorClass: 'text-[#E1306C]',
      activeBorder: 'border-[#E1306C]',
      activeBg: 'bg-pink-50/80 text-[#E1306C]',
    },
    {
      id: 'tiktok' as PlatformType,
      label: isBn ? 'টিকটক' : 'TikTok',
      path: getLocalizedPath(PLATFORMS.tiktok.path, resolvedLocale),
      icon: TikTokIcon,
      colorClass: 'text-slate-900',
      activeBorder: 'border-slate-900',
      activeBg: 'bg-slate-100/90 text-slate-900',
    },
    {
      id: 'youtube-transcript',
      label: isBn ? 'ট্রান্সক্রিপ্ট' : 'YT Transcript',
      path: getLocalizedPath('/youtube-transcript', resolvedLocale),
      icon: FileText,
      colorClass: 'text-red-600',
      activeBorder: 'border-red-600',
      activeBg: 'bg-red-50/80 text-red-600',
    },
  ];

  // Slide-out Sidebar Items
  const sidebarMenuItems = [
    {
      id: 'home',
      label: isBn ? 'হোম (সব প্ল্যাটফর্ম)' : 'Home (All-in-One)',
      path: homeHref,
      icon: Home,
    },
    {
      id: 'facebook' as PlatformType,
      label: isBn ? 'ফেসবুক ডাউনলোডার' : 'Facebook Downloader',
      path: getLocalizedPath(PLATFORMS.facebook.path, resolvedLocale),
      icon: Film,
    },
    {
      id: 'youtube' as PlatformType,
      label: isBn ? 'ইউটিউব ডাউনলোডার' : 'YouTube Downloader',
      path: getLocalizedPath(PLATFORMS.youtube.path, resolvedLocale),
      icon: Play,
    },
    {
      id: 'instagram' as PlatformType,
      label: isBn ? 'ইনস্টাগ্রাম ডাউনলোডার' : 'Instagram Downloader',
      path: getLocalizedPath(PLATFORMS.instagram.path, resolvedLocale),
      icon: Camera,
    },
    {
      id: 'tiktok' as PlatformType,
      label: isBn ? 'টিকটক ডাউনলোডার' : 'TikTok Downloader',
      path: getLocalizedPath(PLATFORMS.tiktok.path, resolvedLocale),
      icon: Music,
    },
    {
      id: 'youtube-transcript',
      label: isBn ? 'ইউটিউব ট্রান্সক্রিপ্ট' : 'YouTube Transcript',
      path: getLocalizedPath('/youtube-transcript', resolvedLocale),
      icon: FileText,
    },
  ];

  return (
    <>
      <header
        data-platform={activePlatform}
        className={`w-full border-b border-slate-200/80 backdrop-blur-md bg-white/90 sticky top-0 z-40 transition-colors duration-250 ${activeThemeClass}`}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3 sm:gap-4">
          {/* Brand Logo & Name */}
          <Link href={homeHref} className="flex items-center gap-3 group focus:outline-none shrink-0">
            <BrandLogoSvg className="w-9 h-9 group-hover:scale-105" />
            <div className="flex flex-col">
              <span className="font-bold text-xl tracking-tight text-slate-900 leading-none group-hover:text-slate-800 whitespace-nowrap">
                {siteName}
              </span>
              <span className="text-[10px] font-medium text-slate-500 leading-none mt-1 whitespace-nowrap">
                {isBn ? 'সোশ্যাল ভিডিও ডাউনলোডার' : 'Social Video Downloader'}
              </span>
            </div>
          </Link>

          {/* Desktop Quick Nav Links */}
          <nav
            aria-label={isBn ? 'প্রধান নেভিগেশন' : 'Primary Navigation'}
            className="hidden md:flex items-center gap-1.5"
          >
            {desktopMenuItems.map((item) => {
              const isActive = pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.id}
                  href={item.path}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center gap-2 whitespace-nowrap shrink-0 ${
                    isActive
                      ? `${item.activeBg} border ${item.activeBorder} shadow-2xs`
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${item.colorClass}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Controls: Crawlable Language Switcher + Hamburger Menu */}
          <div className="flex items-center gap-2 ml-auto shrink-0 relative">
            {languagesList.length <= 2 ? (
              <Link
                href={alternateHref}
                hrefLang={alternateLangCode}
                lang={alternateLangCode}
                aria-label={isBn ? 'Switch to English' : 'বাংলা সংস্করণে যান'}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
              >
                <Globe className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>{alternateLabel}</span>
              </Link>
            ) : (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsLangMenuOpen((v) => !v)}
                  aria-expanded={isLangMenuOpen}
                  aria-label="Select Language"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
                >
                  <Globe className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>{currentLangObj?.nativeName || resolvedLocale.toUpperCase()}</span>
                </button>
                {isLangMenuOpen && (
                  <div className="absolute right-0 mt-1.5 w-44 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-50">
                    {languagesList.map((lang) => {
                      const href = getMatchingLanguagePath(pathname, lang.code);
                      const isCurrent = lang.code === resolvedLocale;
                      return (
                        <Link
                          key={lang.code}
                          href={href}
                          hrefLang={lang.hreflang}
                          lang={lang.code}
                          onClick={() => setIsLangMenuOpen(false)}
                          className={`flex items-center justify-between px-3 py-2 text-xs transition-colors ${
                            isCurrent
                              ? 'bg-slate-100 font-bold text-slate-900'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span>{lang.nativeName}</span>
                          <span className="font-mono text-[10px] text-slate-400 uppercase">
                            {lang.code}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => setIsMenuOpen(true)}
              aria-label={isBn ? 'নেভিগেশন মেনু খুলুন' : 'Open Navigation Sidebar Menu'}
              aria-expanded={isMenuOpen}
              className="p-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 active:bg-slate-200/60 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-slate-300 group"
            >
              <Menu className="w-6 h-6 text-slate-800 transition-transform duration-200 group-hover:scale-110" />
            </button>
          </div>
        </div>
      </header>

      {/* Off-canvas Slide-out Sidebar Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <div className="fixed inset-0 z-50 flex">
            {/* Dark Overlay/Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-xs cursor-pointer"
              aria-hidden="true"
            />

            {/* Left Side Slide-in Sidebar Panel */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              data-platform={activePlatform}
              className={`relative w-[75vw] max-w-xs h-full bg-[#F9FAFB] text-slate-900 shadow-2xl flex flex-col z-50 border-r border-slate-200/60 overflow-y-auto ${activeThemeClass}`}
            >
              <div className="p-4 border-b border-slate-200/50 flex items-center justify-between bg-[#F9FAFB]">
                <Link
                  href={homeHref}
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-2.5 group"
                >
                  <BrandLogoSvg className="w-7 h-7" />
                  <div className="flex flex-col">
                    <span className="font-extrabold text-base text-slate-900 leading-none font-sans tracking-tight">
                      Save Vibe
                    </span>
                    <span className="text-[10px] font-medium text-slate-400 leading-none mt-1">
                      {isBn ? 'সোশ্যাল ভিডিও ডাউনলোডার' : 'Social Video Downloader'}
                    </span>
                  </div>
                </Link>

                <button
                  type="button"
                  onClick={() => setIsMenuOpen(false)}
                  aria-label={isBn ? 'সাইডবার মেনু বন্ধ করুন' : 'Close Sidebar Menu'}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-200/50 transition-colors focus:outline-none"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 px-3 py-3 space-y-1">
                {sidebarMenuItems.map((item) => {
                  const isActive =
                    item.path === '/' || item.path === '/bn'
                      ? pathname === item.path
                      : pathname === item.path;
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.id}
                      href={item.path}
                      onClick={() => setIsMenuOpen(false)}
                      className={`w-full py-2 px-3 rounded-lg transition-colors duration-150 flex items-center gap-2.5 border-none shadow-none text-left ${
                        isActive
                          ? 'bg-slate-200/60 font-bold text-slate-900'
                          : 'text-slate-800 hover:bg-slate-200/40'
                      }`}
                    >
                      <Icon className="w-4 h-4 text-slate-700 shrink-0 stroke-[1.75]" />
                      <span className="text-xs font-bold text-slate-800 font-sans tracking-tight">
                        {item.label}
                      </span>
                    </Link>
                  );
                })}

                <div className="pt-3 mt-3 border-t border-slate-200/60">
                  <Link
                    href={alternateHref}
                    hrefLang={alternateLangCode}
                    lang={alternateLangCode}
                    onClick={() => setIsMenuOpen(false)}
                    className="w-full py-2 px-3 rounded-lg transition-colors duration-150 flex items-center justify-between text-slate-800 hover:bg-slate-200/40"
                  >
                    <span className="flex items-center gap-2.5 text-xs font-bold">
                      <Globe className="w-4 h-4 text-slate-700 shrink-0 stroke-[1.75]" />
                      <span>{isBn ? 'ভাষা: English' : 'Language: বাংলা'}</span>
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500">
                      {alternateLabel}
                    </span>
                  </Link>
                </div>
              </div>

              <div className="p-3 text-[10px] text-slate-400 text-center font-normal border-t border-slate-200/40">
                {isBn ? '© ২০২৬ Save Vibe ডাউনলোডার' : '© 2026 Save Vibe Downloader'}
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
