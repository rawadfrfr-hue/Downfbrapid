import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { generateLegalMetadata } from '@/lib/seo-data';
import { Scale, ArrowLeft } from 'lucide-react';

export const metadata: Metadata = generateLegalMetadata({
  title: 'DMCA ও কপিরাইট নীতিমালা - Save Vibe বাংলা',
  description:
    'Save Vibe-এর DMCA ও কপিরাইট নীতিমালা জানুন। আমরা কীভাবে কপিরাইট সম্মান করি এবং লিংক ব্লকিং বা টেকডাউন অনুরোধ পরিচালনা করি তা এখানে দেখুন।',
  path: '/bn/dmca',
  locale: 'bn',
  alternateEnPath: '/dmca',
  alternateBnPath: '/bn/dmca',
});

export default function BnDmcaPage() {
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
            <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
              <Scale className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                DMCA ও কপিরাইট নীতিমালা
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                সর্বশেষ আপডেট: ২৩ নভেম্বর, ২০২৬ • Save Vibe (savevibe.bond)
              </p>
            </div>
          </div>

          <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
            <p>
              <strong>Save Vibe</strong> (<strong>https://savevibe.bond/bn</strong>) বিশ্বজুড়ে কনটেন্ট নির্মাতা, প্রকাশক ও কপিরাইট মালিকদের মেধাস্বত্ব অধিকারকে সম্পূর্ণ সম্মান করে। আমরা Digital Millennium Copyright Act (DMCA) এবং প্রযোজ্য কপিরাইট আইন মেনে চলি।
            </p>

            <h2 className="text-lg font-bold text-slate-900 pt-2">
              ১. কোনো কপিরাইটযুক্ত মিডিয়া হোস্ট বা সংরক্ষণ করা হয় না
            </h2>
            <p>
              Save Vibe একটি স্বয়ংক্রিয় কারিগরি টুল, যা শুধু ব্যবহারকারীর দেওয়া সর্বজনীন (public) ইউআরএল প্রসেস করে। আমাদের সার্ভারে কোনো ভিডিও, অডিও বা সাবটাইটেল ফাইল হোস্ট, সংরক্ষণ, ইনডেক্স বা আপলোড করা হয় না। সব মিডিয়া মূল তৃতীয় পক্ষের প্ল্যাটফর্মের (যেমন ইউটিউব, ফেসবুক, ইনস্টাগ্রাম বা টিকটক) সার্ভারেই থাকে।
            </p>

            <h2 className="text-lg font-bold text-slate-900 pt-2">
              ২. ব্যবহারকারীর দায়িত্ব ও ফেয়ার ইউজ
            </h2>
            <p>
              Save Vibe-এর মাধ্যমে কোনো কনটেন্ট ডাউনলোডের আগে ব্যবহারকারীর আইনি অনুমতি, মালিকানা বা ফেয়ার-ইউজ অধিকার রয়েছে কি না তা যাচাই করার দায়িত্ব সম্পূর্ণ ব্যবহারকারীর। এই টুল কেবল অনুমোদিত পাবলিক মিডিয়ার ব্যক্তিগত ও অ-বাণিজ্যিক অফলাইন সংরক্ষণের জন্য।
            </p>

            <h2 className="text-lg font-bold text-slate-900 pt-2">
              ৩. DMCA বা কপিরাইট অপসারণ অনুরোধ জমা দেওয়া
            </h2>
            <p>
              Save Vibe কোনো ফাইল হোস্ট না করায় মূল কনটেন্ট স্থায়ীভাবে সরাতে হলে সংশ্লিষ্ট উৎস প্ল্যাটফর্মের সাথে যোগাযোগ করতে হয়। তবে আপনি যদি কপিরাইট মালিক বা অনুমোদিত প্রতিনিধি হন এবং নির্দিষ্ট কোনো ইউআরএল বা চ্যানেল Save Vibe-এ প্রসেসিং থেকে ব্লক করতে চান, তাহলে নিচের তথ্যসহ লিখিত নোটিশ পাঠান:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>আপনার পূর্ণ নাম, প্রতিষ্ঠানের নাম (যদি থাকে) এবং ইলেকট্রনিক বা বাস্তব স্বাক্ষর।</li>
              <li>যে কপিরাইটযুক্ত কাজের অধিকার লঙ্ঘিত হয়েছে বলে দাবি করছেন তার বিবরণ।</li>
              <li>Save Vibe-এ ব্লক করার জন্য নির্দিষ্ট ইউআরএল বা চ্যানেল/পেজের ঠিকানা।</li>
              <li>বিতর্কিত ব্যবহারটি কপিরাইট মালিক বা আইন দ্বারা অনুমোদিত নয়—এ মর্মে সৎ বিশ্বাসের বিবৃতি।</li>
              <li>ব্যবস্থা নেওয়ার পর নিশ্চিত করার জন্য আপনার যোগাযোগের ইমেইল ও ফোন নম্বর।</li>
            </ul>

            <h2 className="text-lg font-bold text-slate-900 pt-2">
              ৪. নির্ধারিত কপিরাইট যোগাযোগ
            </h2>
            <p>
              সব DMCA নোটিশ ও কপিরাইট সংক্রান্ত প্রশ্ন অনুগ্রহ করে পাঠান:{' '}
              <a
                href="mailto:support@savevibe.bond"
                className="text-[#1877F2] font-semibold hover:underline"
              >
                support@savevibe.bond
              </a>
              । বৈধ অনুরোধগুলো দ্রুত পর্যালোচনা করে আইন অনুযায়ী ব্যবস্থা নেওয়া হয়। এছাড়া আমাদের{' '}
              <Link href="/bn/terms-of-service" className="text-[#1877F2] font-semibold hover:underline">
                ব্যবহারের শর্তাবলী
              </Link>{' '}
              এবং{' '}
              <Link href="/bn/privacy-policy" className="text-[#1877F2] font-semibold hover:underline">
                গোপনীয়তা নীতি
              </Link>{' '}
              দেখতে পারেন।
            </p>
          </div>
        </div>
      </main>
      <Footer locale="bn" />
    </div>
  );
}
