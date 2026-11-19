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
