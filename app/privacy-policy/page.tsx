import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SITE_URL } from '@/lib/seo-data';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy - SaveVibe Downloader',
  description:
    'Read the Privacy Policy for SaveVibe Social Media Downloader. We respect user privacy with zero data logging, no tracking cookies, and 100% secure media fetching.',
  alternates: {
    canonical: `${SITE_URL}/privacy-policy`,
  },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900">
      <Header />
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-10 sm:py-14">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <div className="bg-white p-6 sm:p-10 rounded-2xl border border-slate-200/80 shadow-2xs space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
            <div className="p-3 rounded-xl bg-blue-50 text-[#1877F2]">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Privacy Policy
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Last updated: November 1, 2026 • SaveVibe Downloader
              </p>
            </div>
          </div>

          <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
            <p>
              Your privacy is paramount to us at <strong>SaveVibe</strong>. This Privacy Policy outlines the types of information we do not collect, how direct media connections are handled, and how your device security is preserved when using our web tools.
            </p>

            <h2 className="text-lg font-bold text-slate-900 pt-2">1. Zero Logging Policy</h2>
            <p>
              SaveVibe operates with a strict zero-logging architecture. We do not require account creation, email addresses, passwords, or personal identifying information. When you paste a video URL into our downloader:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>We do not store or log the URLs you query on our servers.</li>
              <li>We do not build user activity profiles or track download history server-side.</li>
              <li>Your download history remains strictly stored in your local browser storage.</li>
            </ul>

            <h2 className="text-lg font-bold text-slate-900 pt-2">2. Direct CDN Fetching & Security</h2>
            <p>
              All video metadata and media stream URLs are resolved directly from official public Content Delivery Networks (CDNs). SaveVibe acts as a real-time stream proxy to facilitate file savings without storing video files on intermediate disk servers.
            </p>

            <h2 className="text-lg font-bold text-slate-900 pt-2">3. Cookies & Local Analytics</h2>
            <p>
              We do not use persistent tracking cookies or third-party spyware. Local browser storage is exclusively used to keep your recent download history locally on your device for your convenience.
            </p>

            <h2 className="text-lg font-bold text-slate-900 pt-2">4. Third-Party Links</h2>
            <p>
              Our website may contain external links to social media platforms (Facebook, YouTube, Instagram, TikTok). We are not responsible for the privacy practices of external platforms.
            </p>

            <h2 className="text-lg font-bold text-slate-900 pt-2">5. Contact Us</h2>
            <p>
              If you have any questions regarding our Privacy Policy or data handling practices, please contact us at support@downfbrapid.vercel.app or support@savevibe.bond.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
