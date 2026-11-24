'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { VideoFetcher } from '@/components/VideoFetcher';
import { FeaturesGrid } from '@/components/FeaturesGrid';
import { FaqSection } from '@/components/FaqSection';
import { Footer } from '@/components/Footer';
import { PrivacyTermsModal, ModalType } from '@/components/PrivacyTermsModal';
import { VideoData } from '@/components/ResultCard';
import { PagePlatform, getPlatformConfig } from '@/lib/platforms';
import type { Locale } from '@/lib/i18n';
import type { CmsLanguageRecord, CmsPageContentRecord } from '@/lib/cms-types';

interface PlatformPageClientProps {
  platform: PagePlatform;
  locale?: Locale;
  cmsContent?: CmsPageContentRecord;
  activeLanguages?: CmsLanguageRecord[];
  siteName?: string;
}

export function PlatformPageClient({
  platform,
  locale = 'en',
  cmsContent,
  activeLanguages,
  siteName = 'Save Vibe',
}: PlatformPageClientProps) {
  const [activeLegalModal, setActiveLegalModal] = useState<ModalType>(null);
  const [_historyItems, setHistoryItems] = useState<VideoData[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const savedHistory = localStorage.getItem('savevibe_history');
      return savedHistory ? JSON.parse(savedHistory) : [];
    } catch {
      return [];
    }
  });
  const [downloadsCount, setDownloadsCount] = useState(0);

  // Force Light Mode on <html> element
  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);

  const handleAddHistory = (item: VideoData) => {
    setHistoryItems((prev) => {
      const filtered = prev.filter((h) => h.originalUrl !== item.originalUrl);
      const updated = [item, ...filtered].slice(0, 15);
      try {
        localStorage.setItem('savevibe_history', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleRecordDownload = (_quality: string) => {
    setDownloadsCount((prev) => prev + 1);
  };

  const platformConfig = getPlatformConfig(platform);

  return (
    <div
      className={`min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900 transition-colors duration-200 ${platformConfig.themeClass}`}
    >
      {/* Top Header */}
      <Header
        platform={platform}
        locale={locale}
        activeLanguages={activeLanguages}
        siteName={siteName}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col justify-start items-center">
        <VideoFetcher
          platform={platform}
          locale={locale}
          cmsContent={cmsContent}
          onRecordDownload={handleRecordDownload}
          onAddHistory={handleAddHistory}
        />

        {/* Features, Cross-Links & Detailed Guide */}
        <FeaturesGrid platform={platform} locale={locale} cmsContent={cmsContent} />

        {/* SEO FAQ & Step-by-Step Section */}
        <FaqSection platform={platform} locale={locale} cmsContent={cmsContent} />
      </main>

      {/* Professional Footer */}
      <Footer
        onOpenModal={(type) => setActiveLegalModal(type)}
        totalDownloadsCount={downloadsCount}
        locale={locale}
        siteName={siteName}
      />

      {/* Interactive Contact Modal */}
      <PrivacyTermsModal
        activeModal={activeLegalModal}
        onClose={() => setActiveLegalModal(null)}
        locale={locale}
      />
    </div>
  );
}
