import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'FB Downloader - Fast & Free Facebook Video Saver',
  description: 'Ultra-fast, ad-free Facebook video and reel downloader. Fetch and save HD videos, SD videos, and MP3 audio in seconds.',
  openGraph: {
    title: 'FB Downloader - Fast & Free Facebook Video Saver',
    description: 'Ultra-fast, ad-free Facebook video and reel downloader. Fetch and save HD videos, SD videos, and MP3 audio in seconds.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FB Downloader - Fast & Free Facebook Video Saver',
    description: 'Ultra-fast, ad-free Facebook video and reel downloader. Fetch and save HD videos, SD videos, and MP3 audio in seconds.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={plusJakarta.variable}>
      <body className="font-sans antialiased selection:bg-[#1877F2]/20 selection:text-[#1877F2]" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
