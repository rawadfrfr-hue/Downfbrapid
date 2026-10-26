import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'FB Downloader - Fast & Secure Video Downloader',
  description: 'Effortlessly download public Facebook videos, reels, and watch clips in high definition. Paste your link below to save in MP4 or MP3 format.',
  openGraph: {
    title: 'FB Downloader - Fast & Secure Video Downloader',
    description: 'Effortlessly download public Facebook videos, reels, and watch clips in high definition. Paste your link below to save in MP4 or MP3 format.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FB Downloader - Fast & Secure Video Downloader',
    description: 'Effortlessly download public Facebook videos, reels, and watch clips in high definition. Paste your link below to save in MP4 or MP3 format.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased selection:bg-[#1877F2]/20 selection:text-[#1877F2]" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
