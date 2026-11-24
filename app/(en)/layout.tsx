import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import '../globals.css';
import { SITE_URL, OG_IMAGE_URL, getMetadataBase } from '@/lib/seo-data';
import { getGlobalSettingsCached } from '@/lib/cms-store';
import { MaintenanceView } from '@/components/MaintenanceView';
import { CustomScriptInjector } from '@/components/CustomScriptInjector';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

const SEARCH_LOGO_96 = '/favicons/search-logo-96.png';
const SEARCH_LOGO_192 = '/favicons/search-logo-192.png';
const SEARCH_LOGO_APPLE = '/favicons/apple-touch-icon.png';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1877F2',
};

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: {
    default: 'Save Vibe - Free Social Media Video Downloader Online',
    template: '%s | Save Vibe',
  },
  description:
    'Download Facebook, YouTube, Instagram, and TikTok videos free in HD MP4 or MP3 with Save Vibe. Fast, secure, ad-free, and no login required.',
  icons: {
    icon: [
      { url: SEARCH_LOGO_96, sizes: '96x96', type: 'image/png' },
      { url: SEARCH_LOGO_192, sizes: '192x192', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: SEARCH_LOGO_APPLE,
  },
  openGraph: {
    title: 'Save Vibe - Free Social Media Video Downloader Online',
    description:
      'Download Facebook, YouTube, Instagram, and TikTok videos free in HD MP4 or MP3 with Save Vibe. Fast, secure, ad-free, and no login required.',
    type: 'website',
    siteName: 'Save Vibe',
    url: SITE_URL,
    locale: 'en_US',
    images: [
      {
        url: OG_IMAGE_URL,
        width: 1200,
        height: 630,
        alt: 'Save Vibe - Free Social Media Video Downloader',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Save Vibe - Free Social Media Video Downloader Online',
    description:
      'Download Facebook, YouTube, Instagram, and TikTok videos free in HD MP4 or MP3 with Save Vibe. Fast, secure, ad-free, and no login required.',
    images: [OG_IMAGE_URL],
  },
};

export default async function EnRootLayout({ children }: { children: React.ReactNode }) {
  const globalSettings = await getGlobalSettingsCached();

  return (
    <html lang="en" dir="ltr" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body
        className="font-sans antialiased bg-[#F8FAFC] text-slate-900 selection:bg-[#1877F2]/20 selection:text-[#1877F2]"
        suppressHydrationWarning
      >
        <CustomScriptInjector
          headScripts={globalSettings.headScripts}
          bodyScripts={globalSettings.bodyScripts}
        />
        {globalSettings.maintenanceMode ? (
          <MaintenanceView
            siteName={globalSettings.siteName}
            message={globalSettings.maintenanceMessage}
          />
        ) : (
          children
        )}
      </body>
    </html>
  );
}
