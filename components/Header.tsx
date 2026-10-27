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
  ChevronRight,
  ShieldCheck,
  Zap,
  Sparkles,
} from 'lucide-react';
import { PLATFORMS, PlatformType } from '@/lib/platforms';

const TikTokIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 3 15.68 6.34 6.34 0 0 0 9.35 22a6.33 6.33 0 0 0 6.33-6.32V9.05a8.16 8.16 0 0 0 4.91 1.62V7.22a4.85 4.85 0 0 1-1-.53z" />
  </svg>
);

export const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

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

  const menuItems = [
    {
      id: 'facebook' as PlatformType,
      label: 'Facebook',
      description: 'HD Videos, Reels & Public Clips',
      path: PLATFORMS.facebook.path,
      icon: Facebook,
      colorClass: 'text-[#1877F2]',
      iconBg: 'bg-[#1877F2]/10',
      activeBorder: 'border-[#1877F2]',
      activeBg: 'bg-blue-50/80 text-[#1877F2]',
      badgeText: 'Facebook',
    },
    {
      id: 'youtube' as PlatformType,
      label: 'YouTube',
      description: '4K Shorts, Videos & MP3 Audio',
      path: PLATFORMS.youtube.path,
      icon: Youtube,
      colorClass: 'text-red-600',
      iconBg: 'bg-red-500/10',
      activeBorder: 'border-red-600',
      activeBg: 'bg-red-50/80 text-red-600',
      badgeText: 'YouTube',
    },
    {
      id: 'instagram' as PlatformType,
      label: 'Instagram',
      description: 'Reels, IGTV & Video Posts',
      path: PLATFORMS.instagram.path,
      icon: Instagram,
      colorClass: 'text-[#E1306C]',
      iconBg: 'bg-pink-500/10',
      activeBorder: 'border-[#E1306C]',
      activeBg: 'bg-pink-50/80 text-[#E1306C]',
      badgeText: 'Instagram',
    },
    {
      id: 'tiktok' as PlatformType,
      label: 'TikTok',
      description: 'Max Quality without Watermark',
      path: PLATFORMS.tiktok.path,
      icon: TikTokIcon,
      colorClass: 'text-slate-900',
      iconBg: 'bg-slate-200/70',
      activeBorder: 'border-slate-900',
      activeBg: 'bg-slate-100/90 text-slate-900',
      badgeText: 'TikTok',
    },
  ];

  return (
    <>
      <header className="w-full border-b border-slate-200/80 backdrop-blur-md bg-white/90 sticky top-0 z-40 transition-colors duration-250">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Brand Logo & Name */}
          <Link href="/" className="flex items-center gap-3 group focus:outline-none">
            <img
              src="/assets/aistudio/logoosavevibe_afe0d13c.svg"
              alt="SaveVibe Logo"
              className="w-9 h-9 object-contain shrink-0 transition-transform duration-200 group-hover:scale-105"
            />
            <div className="flex flex-col">
              <span className="font-bold text-xl tracking-tight text-slate-900 leading-none group-hover:text-slate-800">
                SaveVibe
              </span>
              <span className="text-[10px] font-medium text-slate-500 leading-none mt-1">
                Fast & Secure Media Downloader
              </span>
            </div>
          </Link>

          {/* Desktop Quick Nav Links */}
          <nav className="hidden md:flex items-center gap-1.5">
            {menuItems.map((item) => {
              const isActive =
                item.path === '/'
                  ? pathname === '/' || pathname === ''
                  : pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.id}
                  href={item.path}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center gap-2 ${
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
            className="p-2.5 rounded-xl border border-slate-200/90 bg-slate-50 hover:bg-slate-100 active:bg-slate-200/80 text-slate-700 hover:text-slate-900 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-slate-300 flex items-center justify-center gap-2 shadow-2xs group"
          >
            <Menu className="w-5 h-5 text-slate-800 transition-transform duration-200 group-hover:scale-110" />
            <span className="text-xs font-bold text-slate-800">Menu</span>
          </button>
        </div>
      </header>

      {/* Off-canvas Slide-out Sidebar Menu (Hidden on left, slides in smoothly on trigger) */}
      <AnimatePresence>
        {isMenuOpen && (
          <div className="fixed inset-0 z-50 flex">
            {/* 5. Dark Overlay/Backdrop (Click to dismiss menu with smooth fade) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs cursor-pointer"
              aria-hidden="true"
            />

            {/* 1, 3, 4. Left Side Slide-in White Sidebar Panel */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="relative w-80 max-w-[85vw] h-full bg-white text-slate-900 shadow-2xl flex flex-col z-50 border-r border-slate-200 overflow-y-auto"
            >
              {/* Sidebar Header with Brand & Close Button */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
                <Link
                  href="/"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 group"
                >
                  <img
                    src="/assets/aistudio/logoosavevibe_afe0d13c.svg"
                    alt="SaveVibe Logo"
                    className="w-8 h-8 object-contain"
                  />
                  <div className="flex flex-col">
                    <span className="font-extrabold text-lg text-slate-900 leading-none">
                      SaveVibe
                    </span>
                    <span className="text-[10px] font-medium text-slate-500 leading-none mt-1">
                      Media Downloader Suite
                    </span>
                  </div>
                </Link>

                <button
                  type="button"
                  onClick={() => setIsMenuOpen(false)}
                  aria-label="Close Sidebar Menu"
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-200/60 transition-colors focus:outline-none"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Sidebar Content (Left-aligned & clean layout) */}
              <div className="flex-1 px-4 py-6 space-y-6">
                <div>
                  <div className="px-2 mb-3 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-sans">
                      Select Downloader
                    </span>
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  </div>

                  {/* Left-aligned Menu Items */}
                  <div className="space-y-2">
                    {menuItems.map((item) => {
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
                          className={`w-full p-3.5 rounded-2xl transition-all duration-200 flex items-center justify-between gap-3 text-left group ${
                            isActive
                              ? `${item.activeBg} border ${item.activeBorder} shadow-xs font-semibold`
                              : 'text-slate-700 hover:bg-slate-100/90 hover:text-slate-900 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div
                              className={`p-2.5 rounded-xl ${item.iconBg} shrink-0 transition-transform group-hover:scale-105`}
                            >
                              <Icon className={`w-5 h-5 ${item.colorClass}`} />
                            </div>
                            <div className="flex flex-col min-w-0 text-left">
                              <span className="text-sm font-bold text-slate-900 leading-snug truncate">
                                {item.label}
                              </span>
                              <span className="text-[11px] font-normal text-slate-500 truncate mt-0.5">
                                {item.description}
                              </span>
                            </div>
                          </div>

                          <ChevronRight
                            className={`w-4 h-4 shrink-0 transition-transform duration-200 group-hover:translate-x-1 ${
                              isActive ? item.colorClass : 'text-slate-400'
                            }`}
                          />
                        </Link>
                      );
                    })}
                  </div>
                </div>

                {/* Quick Info & Security Card */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Free & Unlimited</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-500 font-normal">
                    Download unlimited Facebook, YouTube, and Instagram videos in Full HD quality with zero ads.
                  </p>
                  <div className="pt-2 border-t border-slate-200/60 flex items-center gap-2 text-[11px] font-medium text-amber-600">
                    <Zap className="w-3.5 h-3.5" />
                    <span>Instant High-Speed CDN Delivery</span>
                  </div>
                </div>
              </div>

              {/* Sidebar Footer */}
              <div className="p-4 border-t border-slate-100 bg-slate-50/50 text-[11px] text-slate-400 text-center font-medium">
                © {new Date().getFullYear()} SaveVibe Downloader Suite
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
