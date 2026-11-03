import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SITE_URL } from '@/lib/seo-data';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'DMCA & Copyright Policy - SaveVibe Downloader',
  description:
    'DMCA Copyright Policy and Takedown Request Guidelines for SaveVibe. We respect intellectual property and process copyright notices promptly.',
  alternates: {
    canonical: `${SITE_URL}/dmca`,
  },
};

export default function DmcaPage() {
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
            <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                DMCA Copyright Policy
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Copyright Takedown Guidelines & Notice Procedure
              </p>
            </div>
          </div>

          <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
            <p>
              <strong>SaveVibe</strong> respects the intellectual property rights of creators and content owners. We comply strictly with the Digital Millennium Copyright Act (DMCA) and international copyright standards.
            </p>

            <h2 className="text-lg font-bold text-slate-900 pt-2">1. No Content Hosting Disclaimer</h2>
            <p>
              SaveVibe does not host, upload, or store any video files or audio tracks on its servers. All media items fetched through SaveVibe are retrieved dynamically in real time from public social media Content Delivery Networks (CDNs).
            </p>

            <h2 className="text-lg font-bold text-slate-900 pt-2">2. Submitting a Copyright Takedown Notice</h2>
            <p>
              If you are a copyright owner or authorized representative and believe that any link processed by our tool infringes upon your copyright, you may submit a formal notification containing the following details:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>Identification of the copyrighted work claimed to be infringed.</li>
              <li>Exact URL(s) of the content on original platforms.</li>
              <li>Your official contact details (name, email address, physical address).</li>
              <li>A statement that you have a good faith belief that the use is unauthorized.</li>
              <li>An electronic or physical signature of the copyright owner.</li>
            </ul>

            <h2 className="text-lg font-bold text-slate-900 pt-2">3. DMCA Contact Information</h2>
            <p>
              Please send all formal DMCA takedown requests to our designated agent via email at:
              <br />
              <strong className="text-slate-900">dmca@downfbrapid.vercel.app</strong> or <strong className="text-slate-900">dmca@savevibe.bond</strong>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
