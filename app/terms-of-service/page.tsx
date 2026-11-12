import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SITE_URL } from '@/lib/seo-data';
import { FileText, ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms of Service - SaveVibe Downloader',
  description:
    'Terms of Service and user guidelines for SaveVibe Social Media Downloader. Read about fair use, non-commercial personal archiving, and service rules.',
  alternates: {
    canonical: `${SITE_URL}/terms-of-service`,
  },
};

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
                Last updated: November 1, 2026 • SaveVibe Downloader
              </p>
            </div>
          </div>

          <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
            <p>
              Welcome to <strong>SaveVibe</strong>. By accessing or using our online media utility, you agree to be bound by these Terms of Service. Please read them carefully.
            </p>

            <h2 className="text-lg font-bold text-slate-900 pt-2">1. Authorized Non-Commercial Personal Use</h2>
            <p>
              SaveVibe is provided strictly for non-commercial, personal archiving of public media content. Users must ensure that they have explicit rights or permissions from original content creators before downloading and using saved material.
            </p>

            <h2 className="text-lg font-bold text-slate-900 pt-2">2. Copyright Compliance & Limitations</h2>
            <p>
              SaveVibe does not host, store, or re-publish copyrighted media on its servers. Our platform functions solely as an online link parser and direct CDN stream connector for publicly accessible content.
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>Users are prohibited from redistributing, selling, or commercializing downloaded media.</li>
              <li>SaveVibe reserves the right to rate-limit or restrict abusive requests.</li>
            </ul>

            <h2 className="text-lg font-bold text-slate-900 pt-2">3. Disclaimer of Warranties</h2>
            <p>
              The service is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis without warranties of any kind. We do not guarantee uninterrupted service or compatibility with all third-party media URLs.
            </p>

            <h2 className="text-lg font-bold text-slate-900 pt-2">4. Changes to Terms</h2>
            <p>
              We reserve the right to update these terms at any time. Continued use of SaveVibe constitutes acceptance of revised terms.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
