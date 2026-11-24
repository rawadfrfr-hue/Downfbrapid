import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { generateLegalMetadata } from '@/lib/seo-data';
import { FileText, ArrowLeft } from 'lucide-react';

export const metadata: Metadata = generateLegalMetadata({
  title: 'ব্যবহারের শর্তাবলী (Terms of Service) - Save Vibe বাংলা',
  description:
    'Save Vibe অনলাইন ভিডিও ডাউনলোডার ও ট্রান্সক্রিপ্ট টুলের ব্যবহারের শর্তাবলী, ব্যক্তিগত ব্যবহার ও কপিরাইট নির্দেশিকা জানুন।',
  path: '/bn/terms-of-service',
  locale: 'bn',
  alternateEnPath: '/terms-of-service',
  alternateBnPath: '/bn/terms-of-service',
});

export default function BnTermsOfServicePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900">
      <Header locale="bn" />
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-10 sm:py-14">
        <Link
          href="/bn"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> হোম পেজে ফিরে যান
        </Link>

        <div className="bg-white p-6 sm:p-10 rounded-2xl border border-slate-200/80 shadow-2xs space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
            <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
              <FileText className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                ব্যবহারের শর্তাবলী (Terms of Service)
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                সর্বশেষ আপডেট: ২৩ নভেম্বর, ২০২৬ • Save Vibe (savevibe.bond)
              </p>
            </div>
          </div>

          <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
            <p>
              <strong>Save Vibe</strong> (<strong>https://savevibe.bond/bn</strong>)-এ স্বাগতম। আমাদের অনলাইন মিডিয়া ডাউনলোডার ও ট্রান্সক্রিপ্ট টুল ব্যবহার করার মাধ্যমে আপনি নিচের শর্তাবলীতে সম্মত হচ্ছেন। যেকোনো টুল ব্যবহারের আগে অনুগ্রহ করে এগুলো মনোযোগ দিয়ে পড়ুন।
            </p>

            <h2 className="text-lg font-bold text-slate-900 pt-2">
              ১. অনুমোদিত ও ব্যক্তিগত ব্যবহার
            </h2>
            <p>
              Save Vibe কেবল সর্বজনীনভাবে উন্মুক্ত (publicly available) মিডিয়া কনটেন্ট ব্যক্তিগত ও অ-বাণিজ্যিক সংরক্ষণের জন্য প্রদান করা হয়েছে। কোনো ভিডিও বা অডিও ডাউনলোড ও ব্যবহার করার আগে নিশ্চিত করুন যে কনটেন্টটির মালিকানা আপনার অথবা মূল নির্মাতা ও স্বত্বাধিকারীর স্পষ্ট অনুমতি রয়েছে।
            </p>

            <h2 className="text-lg font-bold text-slate-900 pt-2">
              ২. কপিরাইট নীতি ও প্ল্যাটফর্মের সীমাবদ্ধতা
            </h2>
            <p>
              Save Vibe নিজস্ব সার্ভারে কোনো কপিরাইটযুক্ত ভিডিও হোস্ট, ক্যাশ, সংরক্ষণ বা পুনরায় প্রকাশ করে না। এটি কেবল পাবলিক ইউআরএল বিশ্লেষণ করে সরাসরি CDN স্ট্রিমের সাথে সংযোগ স্থাপনকারী একটি কারিগরি টুল।
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>ডাউনলোড করা কোনো মিডিয়া পুনরায় বিতরণ, বিক্রি বা বাণিজ্যিকভাবে ব্যবহার করা নিষিদ্ধ।</li>
              <li>অটোমেটেড স্ক্র্যাপিং, অতিরিক্ত সার্ভার চাপ সৃষ্টি বা প্রাইভেট অ্যাক্সেস নিয়ন্ত্রণ ভঙ্গ করা সম্পূর্ণ নিষিদ্ধ।</li>
              <li>অস্বাভাবিক বা অপব্যবহারমূলক অনুরোধের ক্ষেত্রে Save Vibe যেকোনো সময় রেট-লিমিট আরোপ করার অধিকার সংরক্ষণ করে।</li>
            </ul>

            <h2 className="text-lg font-bold text-slate-900 pt-2">
              ৩. দায়বদ্ধতা ও ওয়ারেন্টি সংক্রান্ত ঘোষণা
            </h2>
            <p>
              আমাদের সেবা কোনো ধরনের নিশ্চয়তা ছাড়াই &ldquo;যেমন আছে&rdquo; (AS IS) ভিত্তিতে প্রদান করা হয়। তৃতীয় পক্ষের সোশ্যাল মিডিয়া প্ল্যাটফর্মের পরিবর্তনের কারণে নিরবচ্ছিন্ন আপটাইম বা সব ধরনের লিংকের সামঞ্জস্যতার কোনো গ্যারান্টি দেওয়া হয় না।
            </p>

            <h2 className="text-lg font-bold text-slate-900 pt-2">
              ৪. সংশ্লিষ্ট নীতিমালা ও যোগাযোগ
            </h2>
            <p>
              অনুগ্রহ করে আমাদের{' '}
              <Link href="/bn/privacy-policy" className="text-[#1877F2] font-semibold hover:underline">
                গোপনীয়তা নীতি
              </Link>{' '}
              এবং{' '}
              <Link href="/bn/dmca" className="text-[#1877F2] font-semibold hover:underline">
                DMCA ও কপিরাইট নীতিমালা
              </Link>{' '}
              দেখুন। কোনো আইনি প্রশ্ন বা সহায়তার জন্য ইমেইল করুন:{' '}
              <a
                href="mailto:support@savevibe.bond"
                className="text-[#1877F2] font-semibold hover:underline"
              >
                support@savevibe.bond
              </a>
              ।
            </p>
          </div>
        </div>
      </main>
      <Footer locale="bn" />
    </div>
  );
}
