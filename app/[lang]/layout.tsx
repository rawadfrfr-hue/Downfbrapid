import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { notFound } from 'next/navigation';
import '../globals.css';
import { getMetadataBase } from '@/lib/seo-data';
import { getActiveLanguagesCached, getGlobalSettingsCached } from '@/lib/cms-store';
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

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1877F2',
};

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
};

export default async function DynamicLangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const code = lang.toLowerCase();

  // Explicit routes handle 'en' (root), 'bn', and 'admin'
  if (code === 'en' || code === 'bn' || code === 'admin' || code === 'api') {
    notFound();
  }

  const [activeLanguages, globalSettings] = await Promise.all([
    getActiveLanguagesCached(),
    getGlobalSettingsCached(),
  ]);

  const langRecord = activeLanguages.find((l) => l.code === code);
  if (!langRecord) {
    notFound();
  }

  return (
    <html
      lang={langRecord.code}
      dir={langRecord.direction}
      className={`${inter.variable} ${jetbrainsMono.variable}`}
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
