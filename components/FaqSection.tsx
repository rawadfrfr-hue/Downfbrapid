'use client';

import React, { useState } from 'react';
import { HelpCircle, ChevronDown, CheckCircle2, DownloadCloud } from 'lucide-react';
import { PagePlatform } from '@/lib/platforms';
import { getLocalizedPlatformConfig } from '@/lib/platforms-bn';
import { getLocalizedSeoData } from '@/lib/seo-data';
import type { Locale } from '@/lib/i18n';

interface FaqSectionProps {
  platform: PagePlatform;
  locale?: Locale;
}

export const FaqSection: React.FC<FaqSectionProps> = ({ platform, locale = 'en' }) => {
  const isBn = locale === 'bn';
  const seoInfo = getLocalizedSeoData(platform, locale);
  const platformConfig = getLocalizedPlatformConfig(platform, locale);
  const isHome = platform === 'home';
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="w-full max-w-5xl mx-auto px-4 py-10 my-4 border-t border-slate-200/80">
      {/* Step by Step Guide */}
      <div className="mb-14 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold mb-3">
          <DownloadCloud className="w-3.5 h-3.5 text-blue-600" />
          {isBn ? 'সহজ ধাপে ধাপে নির্দেশিকা' : 'Easy Step-by-Step Guide'}
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mb-2">
          {isBn
            ? isHome
              ? 'কীভাবে অনলাইনে সোশ্যাল মিডিয়া ভিডিও ডাউনলোড করবেন'
              : `কীভাবে অনলাইনে ${platformConfig.name} ভিডিও ডাউনলোড করবেন`
            : isHome
            ? 'How to Download Social Media Videos Online'
            : `How to Download ${platformConfig.name} Videos Online`}
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto mb-8">
          {isBn
            ? isHome
              ? 'ফেসবুক, ইউটিউব, ইনস্টাগ্রাম ও টিকটকের পাবলিক ভিডিও HD কোয়ালিটিতে সেভ করতে নিচের ৩টি সহজ ধাপ অনুসরণ করুন।'
              : `পাবলিক ${platformConfig.name} ভিডিও ও অডিও HD কোয়ালিটিতে সেভ করতে নিচের ৩টি সহজ ধাপ অনুসরণ করুন।`
            : isHome
            ? 'Follow these 3 simple steps to save public Facebook, YouTube, Instagram, and TikTok videos in HD quality.'
            : `Follow these 3 simple steps to save public ${platformConfig.name} videos and audio clips in HD quality.`}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-left">
          {seoInfo.howToSteps.map((stepItem, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-md transition-all duration-200 relative flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 font-extrabold text-sm flex items-center justify-center border border-blue-100">
                    0{idx + 1}
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">{stepItem.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{stepItem.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Frequently Asked Questions (All answers remain in DOM for SSR & Googlebot indexing) */}
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold mb-3">
            <HelpCircle className="w-3.5 h-3.5" />
            {isBn ? 'সচরাচর জিজ্ঞাসিত প্রশ্ন (FAQ)' : 'Frequently Asked Questions'}
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mb-2">
            {isBn
              ? isHome
                ? 'Save Vibe ভিডিও ডাউনলোডার সম্পর্কিত প্রশ্নোত্তর'
                : `Save Vibe ${platformConfig.name} ডাউনলোডার প্রশ্নোত্তর`
              : isHome
              ? 'Save Vibe Video Downloader FAQs'
              : `Save Vibe ${platformConfig.name} Downloader FAQs`}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            {isBn
              ? isHome
                ? 'Save Vibe দিয়ে সোশ্যাল মিডিয়া ভিডিও ডাউনলোড সংক্রান্ত সাধারণ প্রশ্ন ও উত্তর নিচে দেখুন।'
                : `${platformConfig.name} ভিডিও ডাউনলোড সম্পর্কে আপনার সাধারণ প্রশ্নগুলোর উত্তর নিচে দেওয়া হলো।`
              : isHome
              ? 'Got questions about downloading social media videos with Save Vibe? Find quick answers below.'
              : `Got questions about downloading ${platformConfig.name} videos? Find all the quick answers below.`}
          </p>
        </div>

        <div className="space-y-3">
          {seoInfo.faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="bg-white rounded-xl border border-slate-200/80 shadow-2xs transition-all duration-200 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center justify-between p-4 text-left font-semibold text-slate-900 text-xs sm:text-sm focus:outline-none focus:bg-slate-50/80"
                >
                  <span className="pr-4">{faq.question}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-blue-600' : ''
                    }`}
                  />
                </button>
                <div
                  className={
                    isOpen
                      ? 'px-4 pb-4 pt-2 text-xs text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/30 block'
                      : 'hidden'
                  }
                >
                  {faq.answer}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
