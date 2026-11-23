import React from 'react';
import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/seo-data';
import { TranscriptPageClient } from '@/components/TranscriptPageClient';

export const metadata: Metadata = {
  title: 'YouTube Transcript Downloader - Extract & Export TXT, SRT, VTT, PDF, CSV',
  description:
    'Extract time-synced YouTube video transcripts directly from YouTube internal APIs in milliseconds. Live timeline preview, keyword search, one-click copy, and export to TXT, SRT, VTT, PDF, and CSV.',
  alternates: {
    canonical: `${SITE_URL}/youtube-transcript`,
  },
  icons: {
    icon: [
      { url: '/favicons/youtube.svg', type: 'image/svg+xml' },
      { url: '/favicons/search-logo-96.png', sizes: '96x96', type: 'image/png' },
      { url: '/favicons/search-logo-192.png', sizes: '192x192', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/favicons/apple-touch-icon.png',
  },
  openGraph: {
    title: 'YouTube Transcript Downloader - SaveVibe',
    description:
      'Extract YouTube transcripts in milliseconds, search keywords live, and download in TXT, SRT, VTT, PDF, or CSV formats.',
    url: `${SITE_URL}/youtube-transcript`,
    siteName: 'SaveVibe',
    type: 'website',
  },
};

export default function YouTubeTranscriptPage() {
  return <TranscriptPageClient />;
}
