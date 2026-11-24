import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono, Noto_Sans_Bengali } from 'next/font/google';
import { notFound } from 'next/navigation';
import '../globals.css';
import { SITE_URL, OG_IMAGE_URL, getMetadataBase } from '@/lib/seo-data';
import { getActiveLanguagesCached, getGlobalSettingsCached } from '@/lib/cms-store';
import { MaintenanceView } from '@/components/MaintenanceView';
import { CustomScriptInjector } from '@/components/CustomScriptInjector';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const notoSansBengali = Noto_Sans_Bengali({
  subsets: ['bengali', 'latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-bengali',
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
    default: 'Save Vibe বাংলা - ফ্রি অনলাইন ভিডিও ও ট্রান্সক্রিপ্ট ডাউনলোডার',
    template: '%s | Save Vibe',
  },
  description:
    'ফেসবুক, ইউটিউব, ইনস্টাগ্রাম ও টিকটক ভিডিও একদম ফ্রিতে HD MP4 বা MP3 ফরম্যাটে ডাউনলোড করুন। দ্রুত, নিরাপদ ও লগইন ছাড়াই ব্যবহারযোগ্য।',
  icons: {
    icon: [
      { url: SEARCH_LOGO_96, sizes: '96x96', type: 'image/png' },
      { url: SEARCH_LOGO_192, sizes: '192x192', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: SEARCH_LOGO_APPLE,
  },
  openGraph: {
    title: 'Save Vibe বাংলা - ফ্রি অনলাইন ভিডিও ডাউনলোডার',
    description:
      'ফেসবুক, ইউটিউব, ইনস্টাগ্রাম ও টিকটক ভিডিও সহজেই HD MP4 বা MP3 হিসেবে ডাউনলোড করুন Save Vibe-এ।',
    type: 'website',
    siteName: 'Save Vibe',
    url: `${SITE_URL}/bn`,
    locale: 'bn_BD',
    images: [
      {
        url: OG_IMAGE_URL,
        width: 1200,
        height: 630,
        alt: 'Save Vibe বাংলা - ফ্রি ভিডিও ডাউনলোডার',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Save Vibe বাংলা - ফ্রি অনলাইন ভিডিও ডাউনলোডার',
    description:
      'ফেসবুক, ইউটিউব, ইনস্টাগ্রাম ও টিকটক ভিডিও সহজেই HD MP4 বা MP3 হিসেবে ডাউনলোড করুন Save Vibe-এ।',
    images: [OG_IMAGE_URL],
  },
};

export default async function BnRootLayout({ children }: { children: React.ReactNode }) {
  const [globalSettings, activeLanguages] = await Promise.all([
    getGlobalSettingsCached(),
    getActiveLanguagesCached(),
  ]);

  const isBnActive = activeLanguages.some((l) => l.code === 'bn');
  if (!isBnActive) {
    notFound();
  }

  return (
    <html
      lang="bn"
      dir="ltr"
      className={`${inter.variable} ${notoSansBengali.variable} ${jetbrainsMono.variable}`}
    >
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
