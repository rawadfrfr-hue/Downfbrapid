'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDown, Languages, FileText, CaseSensitive } from 'lucide-react';
import { Header } from '@/components/Header';
import { TranscriptWorkspace } from '@/components/TranscriptWorkspace';
import { Footer } from '@/components/Footer';
import { PrivacyTermsModal, ModalType } from '@/components/PrivacyTermsModal';

const TRANSCRIPT_FAQS = [
  {
    question: 'How does multi-language transcript translation work without a VPS?',
    answer:
      'SaveVibe translates extracted YouTube captions into 40+ languages directly through Next.js API routes using the Unofficial Google Translate Web Scraper API, keeping every segment aligned with its original timestamps.',
  },
  {
    question: 'What is Client-Side Transliteration (English Letters)?',
    answer:
      'Transliteration keeps the transcript in the exact same spoken language (such as Bengali, Hindi, Arabic, Urdu, Japanese, or Korean) while converting the script into readable English letters (for example, "আমি ভালো আছি" becomes "ami bhalo achi") directly inside your browser.',
  },
  {
    question: 'Which file formats can I download for translated or transliterated transcripts?',
    answer:
      'Every view—Original, Translated, or Transliterated—can be exported in 5 formats: Plain Text (.txt), SubRip Subtitles (.srt), WebVTT (.vtt), formatted PDF Document (.pdf), and UTF-8 Spreadsheet CSV (.csv).',
  },
  {
    question: 'Does the PDF and CSV export work with Bengali, Hindi, Arabic, or Japanese captions?',
    answer:
      'Yes. CSV files include a UTF-8 BOM for clean spreadsheet compatibility, and PDF exports automatically switch to high-DPI Unicode rendering whenever non-Latin scripts are present.',
  },
];

export function TranscriptPageClient() {
  const [activeLegalModal, setActiveLegalModal] = useState<ModalType>(null);
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);

  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900">
      <Header />

      <main className="flex-1 flex flex-col items-center">
        <TranscriptWorkspace />

        {/* Capabilities & Format Overview */}
        <section className="w-full max-w-4xl mx-auto px-4 py-12 border-t border-slate-200/80">
          <div className="text-center mb-8 space-y-1.5">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Translate, Transliterate, and Export in Any Format
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
              Extract time-synced captions, translate into 40+ languages, or read non-Latin transcripts in English letters right inside your browser.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                <Languages className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                40+ Language Translation
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Translate any extracted transcript into Bengali, Hindi, Arabic, Spanish, Japanese, and 35+ more languages while preserving every timestamp.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center">
                <CaseSensitive className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                Client-Side Transliteration
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Convert Bengali, Hindi, Arabic, Japanese, Korean, or Russian transcripts into English letters right in your browser while keeping the original language.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                5 Ready-to-Use Export Formats
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Download your original, translated, or transliterated transcript as .txt, .srt, .vtt, .pdf, or .csv with live keyword search.
              </p>
            </div>
          </div>
        </section>

        {/* Frequently Asked Questions */}
        <section className="w-full max-w-3xl mx-auto px-4 py-10 mb-6 border-t border-slate-200/80">
          <div className="text-center mb-7 space-y-1.5">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              YouTube Transcript Downloader FAQs
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Common questions about extracting, searching, and exporting YouTube transcripts.
            </p>
          </div>

          <div className="space-y-3">
            {TRANSCRIPT_FAQS.map((faq, idx) => {
              const isOpen = openFaqIdx === idx;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-xl border border-slate-200/80 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between p-4 text-left font-semibold text-slate-900 text-xs sm:text-sm hover:bg-slate-50/80 transition-colors"
                  >
                    <span className="pr-4">{faq.question}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-red-600' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 pt-2 text-xs sm:text-[13px] text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/40">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <Footer onOpenModal={(type) => setActiveLegalModal(type)} />

      <PrivacyTermsModal
        activeModal={activeLegalModal}
        onClose={() => setActiveLegalModal(null)}
      />
    </div>
  );
}
