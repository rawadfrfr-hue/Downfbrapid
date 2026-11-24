import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { generateLegalMetadata } from '@/lib/seo-data';
import { Scale, ArrowLeft } from 'lucide-react';

export const metadata: Metadata = generateLegalMetadata({
  title: 'DMCA & Copyright Policy - Save Vibe Video Downloader',
  description:
    "Review Save Vibe's DMCA & Copyright Disclaimer. Learn how we handle copyright compliance, non-hosted public links, and takedown notice requests.",
  path: '/dmca',
  locale: 'en',
  alternateEnPath: '/dmca',
  alternateBnPath: '/bn/dmca',
});

export default function DmcaPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900">
      <Header locale="en" />
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-10 sm:py-14">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <div className="bg-white p-6 sm:p-10 rounded-2xl border border-slate-200/80 shadow-2xs space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
            <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
              <Scale className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                DMCA &amp; Copyright Policy
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Last updated: November 23, 2026 • Save Vibe (savevibe.bond)
              </p>
            </div>
          </div>

          <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
            <p>
              <strong>Save Vibe</strong> (<strong>https://savevibe.bond</strong>) respects the intellectual property rights of content creators, publishers, and copyright owners worldwide. We comply with the Digital Millennium Copyright Act (DMCA) and applicable copyright laws.
            </p>

            <h2 className="text-lg font-bold text-slate-900 pt-2">
              1. No Hosted or Stored Copyrighted Media
            </h2>
            <p>
              Save Vibe is an automated technical utility that processes publicly available URLs provided directly by users. We do <strong>not</strong> host, store, index, upload, or distribute any video, audio, or subtitle files on Save Vibe servers. All media remains hosted on the original third-party platform&apos;s servers (such as YouTube, Facebook, Instagram, or TikTok).
            </p>

            <h2 className="text-lg font-bold text-slate-900 pt-2">
              2. User Responsibility &amp; Fair Use
            </h2>
            <p>
              Users are solely responsible for verifying that they have legal permission, ownership, or fair-use rights before downloading any content through Save Vibe. Our tool is intended strictly for personal, non-commercial offline archiving of permitted public media.
            </p>

            <h2 className="text-lg font-bold text-slate-900 pt-2">
              3. Submitting a DMCA / Copyright Removal Request
            </h2>
            <p>
              Because Save Vibe does not host media files, removing content permanently requires contacting the source platform where the video is hosted. However, if you are a copyright owner or authorized agent and wish to request that specific URLs or domains be blocked from processing through Save Vibe, please send a written notice containing:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>Your full name, organization (if applicable), and electronic or physical signature.</li>
              <li>Identification of the copyrighted work claimed to have been infringed.</li>
              <li>The exact URL(s) or channel/page identifiers requested to be blocked on Save Vibe.</li>
              <li>A statement of good-faith belief that the disputed use is not authorized by the copyright owner or law.</li>
              <li>Your contact email address and phone number so we can confirm action taken.</li>
            </ul>

            <h2 className="text-lg font-bold text-slate-900 pt-2">
              4. Designated Copyright Contact
            </h2>
            <p>
              Please send all DMCA notices and copyright inquiries to:{' '}
              <a
                href="mailto:support@savevibe.bond"
                className="text-[#1877F2] font-semibold hover:underline"
              >
                support@savevibe.bond
              </a>
              . Valid requests are reviewed promptly and handled in accordance with applicable law. You may also view our{' '}
              <Link href="/terms-of-service" className="text-[#1877F2] font-semibold hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy-policy" className="text-[#1877F2] font-semibold hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </main>
      <Footer locale="en" />
    </div>
  );
}
