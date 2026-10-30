'use client';

import React, { useState } from 'react';
import { HelpCircle, ChevronDown, CheckCircle2, DownloadCloud } from 'lucide-react';
import { PlatformType } from '@/lib/platforms';
import { SEO_DATA } from '@/lib/seo-data';

interface FaqSectionProps {
  platform: PlatformType;
}

export const FaqSection: React.FC<FaqSectionProps> = ({ platform }) => {
  const seoInfo = SEO_DATA[platform] || SEO_DATA.facebook;
  const platformName = platform.charAt(0).toUpperCase() + platform.slice(1);
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
          Easy Step-by-Step Guide
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mb-2">
          How to Download {platformName} Videos Online
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto mb-8">
          Follow these 3 simple steps to save public {platformName} videos, reels, and audio clips in HD quality.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-left">
          {seoInfo.howToSteps.map((stepText, idx) => (
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
                <h3 className="text-sm font-bold text-slate-900 mb-1">
                  {idx === 0 && 'Copy Link'}
                  {idx === 1 && 'Paste URL'}
                  {idx === 2 && 'Download File'}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">{stepText}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Frequently Asked Questions */}
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold mb-3">
            <HelpCircle className="w-3.5 h-3.5" />
            Frequently Asked Questions
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mb-2">
            SaveVibe {platformName} Downloader FAQs
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Got questions about downloading {platformName} videos? Find all the quick answers below.
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
                  className="w-full flex items-center justify-between p-4 text-left font-semibold text-slate-900 text-xs sm:text-sm focus:outline-none focus:bg-slate-50/80"
                >
                  <span className="pr-4">{faq.question}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-blue-600' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/30">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
