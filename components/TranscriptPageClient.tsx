'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDown, Languages, FileText, CaseSensitive } from 'lucide-react';
import { Header } from '@/components/Header';
import { TranscriptWorkspace } from '@/components/TranscriptWorkspace';
import { Footer } from '@/components/Footer';
import { PrivacyTermsModal, ModalType } from '@/components/PrivacyTermsModal';

const TRANSCRIPT_FAQS = [
  {
    question: 'How does transcript translation work?',
    answer:
      'You can translate extracted YouTube captions into 40+ languages directly in the workspace while keeping every line synced to its original timestamp.',
  },
  {
    question: 'What does Transliterate (A–Z) do?',
    answer:
      'Transliteration keeps the transcript in the same spoken language (such as Bengali, Hindi, Arabic, Urdu, Japanese, or Korean) while converting the script into readable English letters right in your browser.',
  },
  {
    question: 'Which export formats are supported?',
    answer:
      'Original, translated, and transliterated transcripts can be copied to your clipboard or downloaded as Plain Text (.txt), SubRip (.srt), WebVTT (.vtt), PDF (.pdf), or CSV (.csv) with or without timestamps.',
  },
  {
    question: 'Do PDF and CSV exports support non-Latin scripts?',
    answer:
      'Yes. Both CSV and PDF exports support Unicode scripts including Bengali, Hindi, Arabic, Japanese, Korean, and European languages.',
  },
];

export function TranscriptPageClient() {
  const [activeLegalModal, setActiveLegalModal] = useState<ModalType>(null);
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);

  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-[#0F0F0F] theme-youtube">
      <Header platform="youtube" />

      <main className="flex-1 flex flex-col items-center">
        <TranscriptWorkspace />

        {/* Capabilities & Format Overview */}
        <section className="w-full max-w-3xl mx-auto px-4 py-12 border-t border-[#E5E5E5]">
          <div className="text-center mb-8 space-y-1.5">
            <h2 className="text-xl sm:text-2xl font-bold text-[#0F0F0F] tracking-tight">
              Translate, Transliterate, and Export
            </h2>
            <p className="text-xs sm:text-sm text-[#606060] max-w-lg mx-auto">
              Extract time-synced captions, translate into 40+ languages, or read non-Latin scripts in English letters.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-[12px] bg-white border border-[#E5E5E5] space-y-2.5">
              <div className="w-9 h-9 rounded-[8px] bg-[#F2F2F2] text-[#FF0000] flex items-center justify-center">
                <Languages className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-[#0F0F0F]">
                40+ Language Translation
              </h3>
              <p className="text-xs text-[#606060] leading-relaxed">
                Translate any extracted transcript into Bengali, Hindi, Arabic, Spanish, Japanese, and more while keeping timestamps aligned.
              </p>
            </div>

            <div className="p-5 rounded-[12px] bg-white border border-[#E5E5E5] space-y-2.5">
              <div className="w-9 h-9 rounded-[8px] bg-[#F2F2F2] text-[#0F0F0F] flex items-center justify-center">
                <CaseSensitive className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-[#0F0F0F]">
                In-Browser Transliteration
              </h3>
              <p className="text-xs text-[#606060] leading-relaxed">
                Read Bengali, Hindi, Arabic, Japanese, Korean, or Russian captions in English letters without changing the spoken language.
              </p>
            </div>

            <div className="p-5 rounded-[12px] bg-white border border-[#E5E5E5] space-y-2.5">
              <div className="w-9 h-9 rounded-[8px] bg-[#F2F2F2] text-[#0F0F0F] flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-[#0F0F0F]">
                5 Export Formats
              </h3>
              <p className="text-xs text-[#606060] leading-relaxed">
                Download your transcript as .txt, .srt, .vtt, .pdf, or .csv with optional timestamps and live keyword search.
              </p>
            </div>
          </div>
        </section>

        {/* Frequently Asked Questions */}
        <section className="w-full max-w-3xl mx-auto px-4 py-10 mb-6 border-t border-[#E5E5E5]">
          <div className="text-center mb-7 space-y-1.5">
            <h2 className="text-xl sm:text-2xl font-bold text-[#0F0F0F] tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-[#606060]">
              Common questions about extracting, translating, and exporting YouTube transcripts.
            </p>
          </div>

          <div className="space-y-3">
            {TRANSCRIPT_FAQS.map((faq, idx) => {
              const isOpen = openFaqIdx === idx;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-[10px] border border-[#E5E5E5] overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between p-4 text-left font-semibold text-[#0F0F0F] text-xs sm:text-sm hover:bg-[#FAFAFA] transition-colors"
                  >
                    <span className="pr-4">{faq.question}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#606060] shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-[#0F0F0F]' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 pt-2.5 text-xs sm:text-[13px] text-[#606060] leading-relaxed border-t border-[#F2F2F2]">
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
