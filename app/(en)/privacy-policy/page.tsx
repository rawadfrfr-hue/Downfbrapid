import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { generateLegalMetadata } from '@/lib/seo-data';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

export const metadata: Metadata = generateLegalMetadata({
  title: 'Privacy Policy - Save Vibe Social Media Downloader',
  description:
    "Read Save Vibe's Privacy Policy to learn how we protect your privacy with zero URL logging, no account tracking, and secure direct downloads.",
  path: '/privacy-policy',
  locale: 'en',
  alternateEnPath: '/privacy-policy',
  alternateBnPath: '/bn/privacy-policy',
});

export default function PrivacyPolicyPage() {
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
            <div className="p-3 rounded-xl bg-blue-50 text-[#1877F2]">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Privacy Policy
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Last updated: November 23, 2026 • Save Vibe (savevibe.bond)
              </p>
            </div>
          </div>

          <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
            <p>
              At <strong>Save Vibe</strong> (<strong>https://savevibe.bond</strong>), user privacy is built into the core of our service. This Privacy Policy explains what information is processed when you use our video downloaders and YouTube transcript tools, and how we keep your browsing private.
            </p>

            <h2 className="text-lg font-bold text-slate-900 pt-2">
              1. Zero URL Logging &amp; No Media Storage
            </h2>
            <p>
              Save Vibe does not store, archive, or build user profiles from the video links you paste. Submitted URLs are processed transiently in memory solely to fetch publicly accessible stream links from third-party content delivery networks (CDNs). We never save downloaded videos or transcripts on our servers.
            </p>

            <h2 className="text-lg font-bold text-slate-900 pt-2">
              2. No Account Registration or Tracking Cookies
            </h2>
            <p>
              You do not need to create an account, sign in with Google, Facebook, Instagram, or TikTok, or share any personal contact details to use Save Vibe.
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>Any session download history is stored strictly in your own browser&apos;s local storage and can be cleared anytime.</li>
              <li>All connections between your browser and Save Vibe are encrypted using HTTPS/TLS.</li>
              <li>We do not sell, rent, or trade user data with third-party data brokers.</li>
            </ul>

            <h2 className="text-lg font-bold text-slate-900 pt-2">
              3. Third-Party Links &amp; Services
            </h2>
            <p>
              When you download a file or extract a transcript, Save Vibe connects to public endpoints of third-party platforms (such as YouTube, Facebook, Instagram, and TikTok). Their respective privacy policies govern content hosted on their networks.
            </p>

            <h2 className="text-lg font-bold text-slate-900 pt-2">
              4. Contact Us
            </h2>
            <p>
              If you have any questions about this Privacy Policy or how Save Vibe handles data, please contact us at{' '}
              <a
                href="mailto:support@savevibe.bond"
                className="text-[#1877F2] font-semibold hover:underline"
              >
                support@savevibe.bond
              </a>
              . You can also review our{' '}
              <Link href="/terms-of-service" className="text-[#1877F2] font-semibold hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/dmca" className="text-[#1877F2] font-semibold hover:underline">
                DMCA Policy
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
