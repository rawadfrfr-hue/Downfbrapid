import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { SITE_URL } from '@/lib/seo-data';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const LOGO_FAVICON_URL = '/assets/aistudio/logoosavevibe_afe0d13c.svg';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'SaveVibe - Fast & Secure Social Media Video Downloader',
    template: '%s | SaveVibe',
  },
  description:
    'Effortlessly download public Facebook, YouTube, Instagram, and TikTok videos without watermark in HD MP4 or MP3 with SaveVibe.',
  icons: {
    icon: LOGO_FAVICON_URL,
    shortcut: LOGO_FAVICON_URL,
    apple: LOGO_FAVICON_URL,
  },
  openGraph: {
    title: 'SaveVibe - Fast & Secure Social Media Video Downloader',
    description:
      'Effortlessly download public Facebook, YouTube, Instagram, and TikTok videos without watermark in HD MP4 or MP3 with SaveVibe.',
    type: 'website',
    siteName: 'SaveVibe',
    url: SITE_URL,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SaveVibe - Fast & Secure Social Media Video Downloader',
    description:
      'Effortlessly download public Facebook, YouTube, Instagram, and TikTok videos without watermark in HD MP4 or MP3 with SaveVibe.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="icon" href={LOGO_FAVICON_URL} type="image/svg+xml" />
      </head>
      <body
        className="font-sans antialiased bg-[#F8FAFC] text-slate-900 selection:bg-[#1877F2]/20 selection:text-[#1877F2]"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
