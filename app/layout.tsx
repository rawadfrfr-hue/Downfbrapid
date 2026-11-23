import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { SITE_URL } from '@/lib/seo-data';
import NetlifyBadgeRemover from '@/components/NetlifyBadgeRemover';

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

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'SaveVibe - Fast & Secure Social Media Video Downloader',
    template: '%s | SaveVibe',
  },
  description:
    'Effortlessly download public Facebook, YouTube, Instagram, and TikTok videos without watermark in HD MP4 or MP3 with SaveVibe.',
  icons: {
    icon: [
      { url: SEARCH_LOGO_96, sizes: '96x96', type: 'image/png' },
      { url: SEARCH_LOGO_192, sizes: '192x192', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: SEARCH_LOGO_APPLE,
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

const EARLY_ANTI_NETLIFY_SCRIPT = `
(function() {
  if (typeof window === 'undefined') return;
  try {
    var origAttachShadow = Element.prototype.attachShadow;
    if (origAttachShadow && !origAttachShadow.__patched) {
      Element.prototype.attachShadow = function(init) {
        var res = origAttachShadow.call(this, init);
        try {
          var st = document.createElement('style');
          st.textContent = ':host, :host * { display: none !important; opacity: 0 !important; visibility: hidden !important; pointer-events: none !important; width: 0 !important; height: 0 !important; }';
          res.appendChild(st);
        } catch(e){}
        return res;
      };
      Element.prototype.attachShadow.__patched = true;
    }
  } catch(e){}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: EARLY_ANTI_NETLIFY_SCRIPT }} />
      </head>
      <body
        className="font-sans antialiased bg-[#F8FAFC] text-slate-900 selection:bg-[#1877F2]/20 selection:text-[#1877F2]"
        suppressHydrationWarning
      >
        <NetlifyBadgeRemover />
        {children}
      </body>
    </html>
  );
}

