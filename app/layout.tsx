import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const LOGO_FAVICON_URL = '/assets/aistudio/logoosavevibe_afe0d13c.svg';

export const metadata: Metadata = {
  title: 'SaveVibe - Fast & Secure Video Downloader',
  description: 'Effortlessly download public Facebook videos, reels, and watch clips in high definition with SaveVibe. Paste your link below to save in MP4 or MP3 format.',
  icons: {
    icon: LOGO_FAVICON_URL,
    shortcut: LOGO_FAVICON_URL,
    apple: LOGO_FAVICON_URL,
  },
  openGraph: {
    title: 'SaveVibe - Fast & Secure Video Downloader',
    description: 'Effortlessly download public Facebook videos, reels, and watch clips in high definition with SaveVibe. Paste your link below to save in MP4 or MP3 format.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SaveVibe - Fast & Secure Video Downloader',
    description: 'Effortlessly download public Facebook videos, reels, and watch clips in high definition with SaveVibe. Paste your link below to save in MP4 or MP3 format.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="icon" href={LOGO_FAVICON_URL} type="image/png" />
      </head>
      <body className="font-sans antialiased bg-[#F8FAFC] text-slate-900 selection:bg-[#1877F2]/20 selection:text-[#1877F2]" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
