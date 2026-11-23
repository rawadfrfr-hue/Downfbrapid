'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronDown, Languages, FileText, CaseSensitive, CheckCircle2, Youtube } from 'lucide-react';
import { Header } from '@/components/Header';
import { TranscriptWorkspace } from '@/components/TranscriptWorkspace';
import { Footer } from '@/components/Footer';
import { PrivacyTermsModal, ModalType } from '@/components/PrivacyTermsModal';
import { TRANSCRIPT_SEO } from '@/lib/seo-data';

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
        <section className="w-full max-w-3xl mx-auto px-4 py-12 border-t border-[#E5E5E5] space-y-10">
          <div>
            <div className="text-center mb-8 space-y-1.5">
              <h2 className="text-xl sm:text-2xl font-bold text-[#0F0F0F] tracking-tight">
                Translate, Transliterate, and Export YouTube Captions
              </h2>
              <p className="text-xs sm:text-sm text-[#606060] max-w-lg mx-auto">
                Extract time-synced captions, translate into 40+ languages, or read non-Latin scripts in English letters with Save Vibe.
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
          </div>

          {/* Step-by-Step Transcript Workflow */}
          <div className="pt-8 border-t border-[#E5E5E5]">
            <h2 className="text-lg sm:text-xl font-bold text-[#0F0F0F] text-center mb-6">
              How to Extract &amp; Export YouTube Transcripts
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {TRANSCRIPT_SEO.howToSteps.map((step, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-[12px] bg-white border border-[#E5E5E5] space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#FF0000] bg-red-50 px-2 py-0.5 rounded">
                      Step 0{idx + 1}
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
              Why Use the Save Vibe YouTube Transcript Downloader?
            </h2>
            <p>
              Students, researchers, journalists, and video editors often need the full spoken text of a YouTube tutorial, podcast, or lecture without scrubbing through an entire timeline. Save Vibe fetches official and auto-generated YouTube caption tracks directly in milliseconds and presents every sentence alongside clickable timestamps.
            </p>
            <p>
              Once extracted, you can filter spoken lines by keyword, switch between original audio captions and 40+ translated languages, or toggle A–Z transliteration for non-Latin scripts such as Bengali, Hindi, Arabic, Japanese, and Korean. When you are ready to save, export clean SubRip (.srt) or WebVTT (.vtt) subtitle tracks for video editors, structured CSV tables for spreadsheets, or formatted PDF and plain-text notes for offline study.
            </p>
            <div className="pt-2">
              <Link
                href="/youtube"
                className="inline-flex items-center gap-1.5 font-semibold text-[#FF0000] hover:underline"
              >
                <Youtube className="w-4 h-4" />
                Need the MP4 video or MP3 audio instead? Open Save Vibe YouTube Video Downloader
              </Link>
            </div>
          </article>
        </section>

        {/* Frequently Asked Questions (All answers remain in DOM for SSR indexing) */}
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
            {TRANSCRIPT_SEO.faqs.map((faq, idx) => {
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

      <Footer onOpenModal={(type) => setActiveLegalModal(type)} />

      <PrivacyTermsModal
        activeModal={activeLegalModal}
        onClose={() => setActiveLegalModal(null)}
      />
    </div>
  );
}
