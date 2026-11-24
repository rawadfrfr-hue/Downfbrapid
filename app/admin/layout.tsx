import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import '../globals.css';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-admin-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-admin-mono',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0F172A',
};

export const metadata: Metadata = {
  title: {
    default: 'Save Vibe Admin',
    template: '%s · Save Vibe Admin',
  },
  description: 'Save Vibe multi-language, SEO, and downloader operations console.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${plusJakarta.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body
        style={{ fontFamily: 'var(--font-admin-sans), system-ui, sans-serif' }}
        className="antialiased bg-[#F8FAFC] text-slate-900"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
