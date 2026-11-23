import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { generateLegalMetadata } from '@/lib/seo-data';
import { FileText, ArrowLeft } from 'lucide-react';

export const metadata: Metadata = generateLegalMetadata({
  title: 'Terms of Service - Save Vibe Online Video Downloader',
  description:
    'Read Save Vibe Terms of Service for authorized personal archiving, copyright compliance, fair use rules, and online video downloader usage terms.',
  path: '/terms-of-service',
});

export default function TermsOfServicePage() {
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
            <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
              <FileText className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Terms of Service
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Last updated: November 23, 2026 • Save Vibe (savevibe.bond)
              </p>
            </div>
          </div>

          <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
            <p>
              Welcome to <strong>Save Vibe</strong> (accessible at{' '}
              <strong>https://savevibe.bond</strong>). By accessing or using our online media utility, you agree to be bound by these Terms of Service. Please read them carefully before using any downloader or transcript tool.
            </p>

            <h2 className="text-lg font-bold text-slate-900 pt-2">
              1. Authorized Non-Commercial Personal Use
            </h2>
            <p>
              Save Vibe is provided strictly for non-commercial, personal archiving of publicly available media content. Users must ensure that they own the content or have explicit permission from original creators and rights holders before downloading or using any saved media.
            </p>

            <h2 className="text-lg font-bold text-slate-900 pt-2">
              2. Copyright Compliance &amp; Platform Limitations
            </h2>
            <p>
              Save Vibe does not host, cache, store, or re-publish copyrighted videos on its servers. Our platform acts solely as a technical link parser and direct CDN stream connector for publicly accessible URLs.
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>Users are prohibited from redistributing, selling, or commercializing downloaded media.</li>
              <li>Automated scraping, abusive traffic, or bypassing private access controls is strictly prohibited.</li>
              <li>Save Vibe reserves the right to rate-limit or restrict abusive requests at any time.</li>
            </ul>

            <h2 className="text-lg font-bold text-slate-900 pt-2">
              3. Disclaimer of Warranties
            </h2>
            <p>
              The service is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis without warranties of any kind. We do not guarantee uninterrupted uptime or compatibility with all third-party social media URLs.
            </p>

            <h2 className="text-lg font-bold text-slate-900 pt-2">
              4. Related Policies &amp; Contact
            </h2>
            <p>
              Please also review our{' '}
              <Link href="/privacy-policy" className="text-[#1877F2] font-semibold hover:underline">
                Privacy Policy
              </Link>{' '}
              and{' '}
              <Link href="/dmca" className="text-[#1877F2] font-semibold hover:underline">
                DMCA &amp; Copyright Policy
              </Link>
              . For legal or support inquiries, email us at{' '}
              <a
                href="mailto:support@savevibe.bond"
                className="text-[#1877F2] font-semibold hover:underline"
              >
                support@savevibe.bond
              </a>
              .
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
