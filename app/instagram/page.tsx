'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { VideoFetcher } from '@/components/VideoFetcher';
import { FeaturesGrid } from '@/components/FeaturesGrid';
import { Footer } from '@/components/Footer';
import { PrivacyTermsModal, ModalType } from '@/components/PrivacyTermsModal';
import { VideoData } from '@/components/ResultCard';

export default function InstagramDownloaderPage() {
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

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900 transition-colors duration-200">
      {/* Top Header with 3-line Menu */}
      <Header />

      {/* Main Content Area - Instagram Downloader */}
      <main className="flex-1 flex flex-col justify-start items-center">
        <VideoFetcher
          platform="instagram"
          onRecordDownload={handleRecordDownload}
          onAddHistory={handleAddHistory}
        />

        {/* Features & Trust Grid */}
        <FeaturesGrid platform="instagram" />
      </main>

      {/* Professional Footer */}
      <Footer
        onOpenModal={(type) => setActiveLegalModal(type)}
        totalDownloadsCount={downloadsCount}
      />

      {/* Interactive Legal & Contact Modal */}
      <PrivacyTermsModal
        activeModal={activeLegalModal}
        onClose={() => setActiveLegalModal(null)}
      />
    </div>
  );
}
