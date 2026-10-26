'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { VideoFetcher } from '@/components/VideoFetcher';
import { FeaturesGrid } from '@/components/FeaturesGrid';
import { Footer } from '@/components/Footer';
import { DownloadHistory } from '@/components/DownloadHistory';
import { PrivacyTermsModal, ModalType } from '@/components/PrivacyTermsModal';
import { VideoData } from '@/components/ResultCard';

export default function Home() {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [activeLegalModal, setActiveLegalModal] = useState<ModalType>(null);
  const [historyItems, setHistoryItems] = useState<VideoData[]>([]);
  const [downloadsCount, setDownloadsCount] = useState(0);

  // Load client-side stored preferences safely after initial hydration
  useEffect(() => {
    requestAnimationFrame(() => {
      try {
        const savedTheme = localStorage.getItem('fb_downloader_theme');
        if (savedTheme) {
          setIsDarkMode(savedTheme === 'dark');
        }
        const savedHistory = localStorage.getItem('fb_downloader_history');
        if (savedHistory) {
          setHistoryItems(JSON.parse(savedHistory));
        }
      } catch {
        // Ignore localStorage read errors
      }
    });
  }, []);

  // Sync dark mode class on <html> element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('fb_downloader_theme', next ? 'dark' : 'light');
      } catch {}
      return next;
    });
  };

  const handleAddHistory = (item: VideoData) => {
    setHistoryItems((prev) => {
      const filtered = prev.filter((h) => h.originalUrl !== item.originalUrl);
      const updated = [item, ...filtered].slice(0, 15);
      try {
        localStorage.setItem('fb_downloader_history', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleClearHistory = () => {
    setHistoryItems([]);
    try {
      localStorage.removeItem('fb_downloader_history');
    } catch {}
  };

  const handleRecordDownload = (_quality: string) => {
    setDownloadsCount((prev) => prev + 1);
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-250 ${isDarkMode ? 'bg-[#0B0F19] text-white' : 'bg-[#F8FAFC] text-slate-900'}`}>
      {/* Top Header */}
      <Header
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
        historyCount={historyItems.length}
        onOpenHistory={() => setIsHistoryOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col justify-start items-center">
        <VideoFetcher
          onRecordDownload={handleRecordDownload}
          onAddHistory={handleAddHistory}
        />

        {/* Features & Trust Grid */}
        <FeaturesGrid />
      </main>

      {/* Professional Footer */}
      <Footer
        onOpenModal={(type) => setActiveLegalModal(type)}
        totalDownloadsCount={downloadsCount}
      />

      {/* Download History Drawer */}
      <DownloadHistory
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        items={historyItems}
        onClearHistory={handleClearHistory}
        onSelectVideo={(_video) => {
          // Handled via history select if needed
        }}
      />

      {/* Interactive Legal & Contact Modal */}
      <PrivacyTermsModal
        activeModal={activeLegalModal}
        onClose={() => setActiveLegalModal(null)}
      />
    </div>
  );
}
