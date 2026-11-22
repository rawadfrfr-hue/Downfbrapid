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
} from 'lucide-react';
import { PLATFORMS, PlatformType } from '@/lib/platforms';

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
  platform?: PlatformType;
}

export const Header: React.FC<HeaderProps> = ({ platform }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  const activePlatform: PlatformType | 'default' = (() => {
    if (platform) return platform;
    if (pathname?.startsWith('/youtube')) return 'youtube';
    if (pathname?.startsWith('/instagram')) return 'instagram';
    if (pathname?.startsWith('/tiktok')) return 'tiktok';
    if (pathname === '/' || pathname?.startsWith('/facebook')) return 'facebook';
    return 'default';
  })();

  const activeThemeClass =
    activePlatform === 'default' ? 'theme-default' : PLATFORMS[activePlatform].themeClass;

  // Reset menu on route change
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setIsMenuOpen(false);
  }

  // Handle ESC key to close sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMenuOpen]);

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
      label: 'Facebook',
      path: PLATFORMS.facebook.path,
      icon: Facebook,
      colorClass: 'text-[#1877F2]',
      activeBorder: 'border-[#1877F2]',
      activeBg: 'bg-blue-50/80 text-[#1877F2]',
    },
    {
      id: 'youtube' as PlatformType,
      label: 'YouTube',
      path: PLATFORMS.youtube.path,
      icon: Youtube,
      colorClass: 'text-red-600',
      activeBorder: 'border-red-600',
      activeBg: 'bg-red-50/80 text-red-600',
    },
    {
      id: 'instagram' as PlatformType,
      label: 'Instagram',
      path: PLATFORMS.instagram.path,
      icon: Instagram,
      colorClass: 'text-[#E1306C]',
      activeBorder: 'border-[#E1306C]',
      activeBg: 'bg-pink-50/80 text-[#E1306C]',
    },
    {
      id: 'tiktok' as PlatformType,
      label: 'TikTok',
      path: PLATFORMS.tiktok.path,
      icon: TikTokIcon,
      colorClass: 'text-slate-900',
      activeBorder: 'border-slate-900',
      activeBg: 'bg-slate-100/90 text-slate-900',
    },
    {
      id: 'youtube-transcript',
      label: 'YT Transcript',
      path: '/youtube-transcript',
      icon: FileText,
      colorClass: 'text-red-600',
      activeBorder: 'border-red-600',
      activeBg: 'bg-red-50/80 text-red-600',
    },
  ];

  // Slide-out Sidebar Items (Minimalist, Generic Monochrome Glyph Icons, No Subtext, No Arrows, Flat Borderless Style)
  const sidebarMenuItems = [
    {
      id: 'facebook' as PlatformType,
      label: 'Facebook',
      path: PLATFORMS.facebook.path,
      icon: Film,
    },
    {
      id: 'youtube' as PlatformType,
      label: 'YouTube',
      path: PLATFORMS.youtube.path,
      icon: Play,
    },
    {
      id: 'instagram' as PlatformType,
      label: 'Instagram',
      path: PLATFORMS.instagram.path,
      icon: Camera,
    },
    {
      id: 'tiktok' as PlatformType,
      label: 'TikTok',
      path: PLATFORMS.tiktok.path,
      icon: Music,
    },
    {
      id: 'youtube-transcript',
      label: 'YT Transcript',
      path: '/youtube-transcript',
      icon: FileText,
    },
  ];

  return (
    <>
      <header
        data-platform={activePlatform}
        className={`w-full border-b border-slate-200/80 backdrop-blur-md bg-white/90 sticky top-0 z-40 transition-colors duration-250 ${activeThemeClass}`}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Brand Logo & Name */}
          <Link href="/" className="flex items-center gap-3 group focus:outline-none">
            <BrandLogoSvg className="w-9 h-9 group-hover:scale-105" />
            <div className="flex flex-col">
              <span className="font-bold text-xl tracking-tight text-slate-900 leading-none group-hover:text-slate-800">
                SaveVibe
              </span>
              <span className="text-[10px] font-medium text-slate-500 leading-none mt-1">
                Social Video Downloader
              </span>
            </div>
          </Link>

          {/* Desktop Quick Nav Links */}
          <nav className="hidden md:flex items-center gap-1.5">
            {desktopMenuItems.map((item) => {
              const isActive =
                item.path === '/'
                  ? pathname === '/' || pathname === ''
                  : pathname === item.path;
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

          {/* Top Right Corner 3-Line Hamburger Menu Button */}
          <button
            type="button"
            onClick={() => setIsMenuOpen(true)}
            aria-label="Open Navigation Sidebar Menu"
            aria-expanded={isMenuOpen}
            className="p-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 active:bg-slate-200/60 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-slate-300 ml-auto group"
          >
            <Menu className="w-6 h-6 text-slate-800 transition-transform duration-200 group-hover:scale-110" />
          </button>
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

            {/* Left Side Slide-in Sidebar Panel (75% Width, Pristine #F9FAFB Off-White) */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              data-platform={activePlatform}
              className={`relative w-[75vw] h-full bg-[#F9FAFB] text-slate-900 shadow-2xl flex flex-col z-50 border-r border-slate-200/60 overflow-y-auto ${activeThemeClass}`}
            >
              {/* Minimalist Brand Header & Close Button */}
              <div className="p-4 border-b border-slate-200/50 flex items-center justify-between bg-[#F9FAFB]">
                <Link
                  href="/"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-2.5 group"
                >
                  <BrandLogoSvg className="w-7 h-7" />
                  <div className="flex flex-col">
                    <span className="font-extrabold text-base text-slate-900 leading-none font-sans tracking-tight">
                      SaveVibe
                    </span>
                    <span className="text-[10px] font-medium text-slate-400 leading-none mt-1">
                      Social Video Downloader
                    </span>
                  </div>
                </Link>

                <button
                  type="button"
                  onClick={() => setIsMenuOpen(false)}
                  aria-label="Close Sidebar Menu"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-200/50 transition-colors focus:outline-none"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Directly starts list right below logo header (No "SELECT DOWNLOADER" title, compact rows, no subtext, no arrows, flat style) */}
              <div className="flex-1 px-3 py-3 space-y-1">
                {sidebarMenuItems.map((item) => {
                  const isActive =
                    item.path === '/'
                      ? pathname === '/' || pathname === ''
                      : pathname === item.path;
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.id}
                      href={item.path}
                      onClick={() => setIsMenuOpen(false)}
                      className={`w-full py-1.5 px-3 rounded-lg transition-colors duration-150 flex items-center gap-2.5 border-none shadow-none text-left ${
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
              </div>

              {/* Sidebar Footer with Copyright Notice */}
              <div className="p-3 text-[10px] text-slate-400 text-center font-normal border-t border-slate-200/40">
                © 2026 SaveVibe Downloader
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

