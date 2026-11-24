import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { generateLegalMetadata } from '@/lib/seo-data';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

export const metadata: Metadata = generateLegalMetadata({
  title: 'গোপনীয়তা নীতি (Privacy Policy) - Save Vibe বাংলা',
  description:
    'Save Vibe কীভাবে আপনার গোপনীয়তা সুরক্ষিত রাখে তা জানুন। কোনো লিংক লগিং নেই, একাউন্ট ট্র্যাকিং নেই এবং সম্পূর্ণ নিরাপদ ডাউনলোড ব্যবস্থা।',
  path: '/bn/privacy-policy',
  locale: 'bn',
  alternateEnPath: '/privacy-policy',
  alternateBnPath: '/bn/privacy-policy',
});

export default function BnPrivacyPolicyPage() {
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
            <div className="p-3 rounded-xl bg-blue-50 text-[#1877F2]">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                গোপনীয়তা নীতি (Privacy Policy)
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                সর্বশেষ আপডেট: ২৩ নভেম্বর, ২০২৬ • Save Vibe (savevibe.bond)
              </p>
            </div>
          </div>

          <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
            <p>
              <strong>Save Vibe</strong> (<strong>https://savevibe.bond/bn</strong>)-এ ব্যবহারকারীর গোপনীয়তা আমাদের সেবার মূল ভিত্তি। আপনি যখন আমাদের ভিডিও ডাউনলোডার এবং ইউটিউব ট্রান্সক্রিপ্ট টুল ব্যবহার করেন, তখন কোন তথ্য কীভাবে প্রসেস করা হয় এবং কীভাবে আপনার ব্রাউজিং সুরক্ষিত রাখা হয়, তা এই নীতিমালায় স্পষ্টভাবে তুলে ধরা হয়েছে।
            </p>

            <h2 className="text-lg font-bold text-slate-900 pt-2">
              ১. কোনো ইউআরএল লগিং বা মিডিয়া সংরক্ষণ নয়
            </h2>
            <p>
              Save Vibe আপনার পেস্ট করা কোনো ভিডিওর লিংক সংরক্ষণ বা আর্কাইভ করে না এবং ব্যবহারকারীর প্রোফাইলও তৈরি করে না। প্রদত্ত লিংকগুলো শুধু তাৎক্ষণিকভাবে মেমোরিতে প্রসেস করে তৃতীয় পক্ষের কনটেন্ট ডেলিভারি নেটওয়ার্ক (CDN) থেকে পাবলিক স্ট্রিম লিংক এনে দেওয়া হয়। আমাদের সার্ভারে কোনো ডাউনলোড করা ভিডিও বা ট্রান্সক্রিপ্ট জমা থাকে না।
            </p>

            <h2 className="text-lg font-bold text-slate-900 pt-2">
              ২. একাউন্ট রেজিস্ট্রেশন বা ট্র্যাকিং কুকির প্রয়োজন নেই
            </h2>
            <p>
              Save Vibe ব্যবহার করতে আপনাকে কোনো একাউন্ট খুলতে হবে না কিংবা গুগল, ফেসবুক, ইনস্টাগ্রাম বা টিকটকে লগইন করতে হবে না। কোনো ব্যক্তিগত তথ্য শেয়ার করারও দরকার নেই।
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>আপনার সেশনের ডাউনলোড হিস্ট্রি কেবল আপনার নিজের ব্রাউজারের লোকাল স্টোরেজে থাকে এবং যেকোনো সময় মুছে ফেলা যায়।</li>
              <li>আপনার ব্রাউজার ও Save Vibe-এর মধ্যকার সব যোগাযোগ HTTPS/TLS এনক্রিপশনের মাধ্যমে সুরক্ষিত।</li>
              <li>আমরা তৃতীয় পক্ষের কোনো ডেটা ব্রোকারের কাছে ব্যবহারকারীর তথ্য বিক্রি, ভাড়া বা বিনিময় করি না।</li>
            </ul>

            <h2 className="text-lg font-bold text-slate-900 pt-2">
              ৩. তৃতীয় পক্ষের লিংক ও সেবা
            </h2>
            <p>
              যখন আপনি কোনো ফাইল ডাউনলোড করেন বা ট্রান্সক্রিপ্ট সংগ্রহ করেন, তখন Save Vibe ইউটিউব, ফেসবুক, ইনস্টাগ্রাম বা টিকটকের মতো তৃতীয় পক্ষের পাবলিক এন্ডপয়েন্টের সাথে সংযুক্ত হয়। ওই প্ল্যাটফর্মগুলোতে হোস্ট করা কনটেন্টের ক্ষেত্রে তাদের নিজস্ব গোপনীয়তা নীতি প্রযোজ্য।
            </p>

            <h2 className="text-lg font-bold text-slate-900 pt-2">
              ৪. যোগাযোগ করুন
            </h2>
            <p>
              এই গোপনীয়তা নীতি বা ডেটা সুরক্ষা সম্পর্কে কোনো প্রশ্ন থাকলে আমাদের ইমেইল করুন:{' '}
              <a
                href="mailto:support@savevibe.bond"
                className="text-[#1877F2] font-semibold hover:underline"
              >
                support@savevibe.bond
              </a>
              । এছাড়া আমাদের{' '}
              <Link href="/bn/terms-of-service" className="text-[#1877F2] font-semibold hover:underline">
                ব্যবহারের শর্তাবলী
              </Link>{' '}
              এবং{' '}
              <Link href="/bn/dmca" className="text-[#1877F2] font-semibold hover:underline">
                DMCA নীতিমালা
              </Link>{' '}
              পড়ে নিতে পারেন।
            </p>
          </div>
        </div>
      </main>
      <Footer locale="bn" />
    </div>
  );
}
