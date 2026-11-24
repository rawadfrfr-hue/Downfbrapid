'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ChevronDown,
  Languages,
  FileText,
  CaseSensitive,
  CheckCircle2,
  Youtube,
  Wrench,
} from 'lucide-react';
import { Header } from '@/components/Header';
import { TranscriptWorkspace } from '@/components/TranscriptWorkspace';
import { Footer } from '@/components/Footer';
import { PrivacyTermsModal, ModalType } from '@/components/PrivacyTermsModal';
import { TRANSCRIPT_SEO, getLocalizedTranscriptSeo } from '@/lib/seo-data';
import { Locale, getLocalizedPath } from '@/lib/i18n';

interface TranscriptPageClientProps {
  locale?: Locale;
}

export function TranscriptPageClient({ locale = 'en' }: TranscriptPageClientProps) {
  const isBn = locale === 'bn';
  const seo = getLocalizedTranscriptSeo(locale);
  const bnSeo = isBn && 'troubleshooting' in seo ? seo : null;
  const [activeLegalModal, setActiveLegalModal] = useState<ModalType>(null);
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);

  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-[#0F0F0F] theme-youtube">
      <Header platform="youtube" locale={locale} />

      <main className="flex-1 flex flex-col items-center">
        <TranscriptWorkspace locale={locale} />

        {/* Capabilities & Format Overview */}
        <section className="w-full max-w-3xl mx-auto px-4 py-12 border-t border-[#E5E5E5] space-y-10">
          <div>
            <div className="text-center mb-8 space-y-1.5">
              <h2 className="text-xl sm:text-2xl font-bold text-[#0F0F0F] tracking-tight">
                {isBn
                  ? 'ইউটিউব ক্যাপশন অনুবাদ, রূপান্তর ও এক্সপোর্ট করুন'
                  : 'Translate, Transliterate, and Export YouTube Captions'}
              </h2>
              <p className="text-xs sm:text-sm text-[#606060] max-w-lg mx-auto">
                {isBn
                  ? 'Save Vibe দিয়ে সময়-নির্ধারিত ক্যাপশন বের করুন, ৪০+ ভাষায় অনুবাদ করুন অথবা অ-ল্যাটিন লেখা ইংরেজি অক্ষরে পড়ুন।'
                  : 'Extract time-synced captions, translate into 40+ languages, or read non-Latin scripts in English letters with Save Vibe.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-[12px] bg-white border border-[#E5E5E5] space-y-2.5">
                <div className="w-9 h-9 rounded-[8px] bg-[#F2F2F2] text-[#FF0000] flex items-center justify-center">
                  <Languages className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-[#0F0F0F]">
                  {bnSeo ? bnSeo.capabilities[0].title : '40+ Language Translation'}
                </h3>
                <p className="text-xs text-[#606060] leading-relaxed">
                  {bnSeo
                    ? bnSeo.capabilities[0].description
                    : 'Translate any extracted transcript into Bengali, Hindi, Arabic, Spanish, Japanese, and more while keeping timestamps aligned.'}
                </p>
              </div>

              <div className="p-5 rounded-[12px] bg-white border border-[#E5E5E5] space-y-2.5">
                <div className="w-9 h-9 rounded-[8px] bg-[#F2F2F2] text-[#0F0F0F] flex items-center justify-center">
                  <CaseSensitive className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-[#0F0F0F]">
                  {bnSeo ? bnSeo.capabilities[1].title : 'In-Browser Transliteration'}
                </h3>
                <p className="text-xs text-[#606060] leading-relaxed">
                  {bnSeo
                    ? bnSeo.capabilities[1].description
                    : 'Read Bengali, Hindi, Arabic, Japanese, Korean, or Russian captions in English letters without changing the spoken language.'}
                </p>
              </div>

              <div className="p-5 rounded-[12px] bg-white border border-[#E5E5E5] space-y-2.5">
                <div className="w-9 h-9 rounded-[8px] bg-[#F2F2F2] text-[#0F0F0F] flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-[#0F0F0F]">
                  {bnSeo ? bnSeo.capabilities[2].title : '5 Export Formats'}
                </h3>
                <p className="text-xs text-[#606060] leading-relaxed">
                  {bnSeo
                    ? bnSeo.capabilities[2].description
                    : 'Download your transcript as .txt, .srt, .vtt, .pdf, or .csv with optional timestamps and live keyword search.'}
                </p>
              </div>
            </div>
          </div>

          {/* Step-by-Step Transcript Workflow */}
          <div className="pt-8 border-t border-[#E5E5E5]">
            <h2 className="text-lg sm:text-xl font-bold text-[#0F0F0F] text-center mb-6">
              {isBn
                ? 'কীভাবে ইউটিউব ট্রান্সক্রিপ্ট বের ও এক্সপোর্ট করবেন'
                : 'How to Extract & Export YouTube Transcripts'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {seo.howToSteps.map((step, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-[12px] bg-white border border-[#E5E5E5] space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#FF0000] bg-red-50 px-2 py-0.5 rounded">
                      {isBn ? `ধাপ ০${idx + 1}` : `Step 0${idx + 1}`}
                    </span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-[#0F0F0F]">{step.title}</h3>
                  <p className="text-xs text-[#606060] leading-relaxed">{step.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Rich Guide Text for SEO Depth */}
          <article className="p-6 rounded-[12px] bg-white border border-[#E5E5E5] space-y-3 text-xs sm:text-[13px] text-[#606060] leading-relaxed">
            <h2 className="text-base sm:text-lg font-bold text-[#0F0F0F]">
              {isBn
                ? 'কেন Save Vibe ইউটিউব ট্রান্সক্রিপ্ট ডাউনলোডার ব্যবহার করবেন?'
                : 'Why Use the Save Vibe YouTube Transcript Downloader?'}
            </h2>
            {isBn ? (
              <>
                <p>
                  শিক্ষার্থী, গবেষক, সাংবাদিক ও ভিডিও এডিটরদের প্রায়ই কোনো ইউটিউব লেকচার, পডকাস্ট বা টিউটোরিয়ালের পুরো কথার লিখিত রূপ দরকার হয়। পুরো ভিডিও টেনে টেনে শোনার বদলে Save Vibe কয়েক মিলিসেকেন্ডেই অফিসিয়াল ও অটো-জেনারেটেড ক্যাপশন ট্র্যাক সংগ্রহ করে প্রতিটি লাইনের পাশে ক্লিকযোগ্য টাইমস্ট্যাম্পসহ দেখায়।
                </p>
                <p>
                  ট্রান্সক্রিপ্ট আনার পর আপনি নির্দিষ্ট কীওয়ার্ড দিয়ে সার্চ করতে পারবেন, বাংলাসহ ৪০টিরও বেশি ভাষায় অনুবাদ করতে পারবেন কিংবা ইংরেজি অক্ষরে উচ্চারণ (A–Z Transliteration) দেখতে পারবেন। শেষে ভিডিও এডিটরের জন্য .srt বা .vtt, ডেটা বিশ্লেষণের জন্য .csv অথবা পড়ার জন্য পরিচ্ছন্ন .pdf ও .txt ফাইল হিসেবে সেভ করতে পারবেন।
                </p>
              </>
            ) : (
              <>
                <p>
                  Students, researchers, journalists, and video editors often need the full spoken text of a YouTube tutorial, podcast, or lecture without scrubbing through an entire timeline. Save Vibe fetches official and auto-generated YouTube caption tracks directly in milliseconds and presents every sentence alongside clickable timestamps.
                </p>
                <p>
                  Once extracted, you can filter spoken lines by keyword, switch between original audio captions and 40+ translated languages, or toggle A–Z transliteration for non-Latin scripts such as Bengali, Hindi, Arabic, Japanese, and Korean. When you are ready to save, export clean SubRip (.srt) or WebVTT (.vtt) subtitle tracks for video editors, structured CSV tables for spreadsheets, or formatted PDF and plain-text notes for offline study.
                </p>
              </>
            )}
            <div className="pt-2">
              <Link
                href={getLocalizedPath('/youtube', locale)}
                className="inline-flex items-center gap-1.5 font-semibold text-[#FF0000] hover:underline"
              >
                <Youtube className="w-4 h-4" />
                {isBn
                  ? 'টেক্সটের বদলে MP4 ভিডিও বা MP3 অডিও দরকার? Save Vibe ইউটিউব ভিডিও ডাউনলোডার খুলুন'
                  : 'Need the MP4 video or MP3 audio instead? Open Save Vibe YouTube Video Downloader'}
              </Link>
            </div>
          </article>

          {/* Troubleshooting for Bangla page */}
          {bnSeo && bnSeo.troubleshooting?.length > 0 && (
            <div className="p-6 rounded-[12px] bg-white border border-[#E5E5E5] space-y-4">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-amber-600" />
                <h2 className="text-base sm:text-lg font-bold text-[#0F0F0F]">
                  {bnSeo.troubleshootingTitle}
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {bnSeo.troubleshooting.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-[10px] bg-[#FAFAFA] border border-[#E5E5E5] space-y-1.5"
                  >
                    <h3 className="text-xs font-semibold text-[#0F0F0F]">{item.issue}</h3>
                    <p className="text-xs text-[#606060] leading-relaxed">{item.solution}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Frequently Asked Questions (All answers remain in DOM for SSR indexing) */}
        <section className="w-full max-w-3xl mx-auto px-4 py-10 mb-6 border-t border-[#E5E5E5]">
          <div className="text-center mb-7 space-y-1.5">
            <h2 className="text-xl sm:text-2xl font-bold text-[#0F0F0F] tracking-tight">
              {isBn ? 'সচরাচর জিজ্ঞাসিত প্রশ্ন (FAQ)' : 'Frequently Asked Questions'}
            </h2>
            <p className="text-xs sm:text-sm text-[#606060]">
              {isBn
                ? 'ইউটিউব ট্রান্সক্রিপ্ট বের করা, অনুবাদ ও এক্সপোর্ট সংক্রান্ত সাধারণ প্রশ্ন ও উত্তর।'
                : 'Common questions about extracting, translating, and exporting YouTube transcripts.'}
            </p>
          </div>

          <div className="space-y-3">
            {(isBn ? seo.faqs : TRANSCRIPT_SEO.faqs).map((faq, idx) => {
              const isOpen = openFaqIdx === idx;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-[10px] border border-[#E5E5E5] overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                    aria-expanded={isOpen}
                    className="w-full flex items-center justify-between p-4 text-left font-semibold text-[#0F0F0F] text-xs sm:text-sm hover:bg-[#FAFAFA] transition-colors"
                  >
                    <span className="pr-4">{faq.question}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#606060] shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-[#0F0F0F]' : ''
                      }`}
                    />
                  </button>
                  <div
                    className={
                      isOpen
                        ? 'px-4 pb-4 pt-2.5 text-xs sm:text-[13px] text-[#606060] leading-relaxed border-t border-[#F2F2F2] block'
                        : 'hidden'
                    }
                  >
                    {faq.answer}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <Footer onOpenModal={(type) => setActiveLegalModal(type)} locale={locale} />

      <PrivacyTermsModal
        activeModal={activeLegalModal}
        onClose={() => setActiveLegalModal(null)}
        locale={locale}
      />
    </div>
  );
}
