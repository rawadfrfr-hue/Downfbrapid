'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDown, Zap, FileText, Search } from 'lucide-react';
import { Header } from '@/components/Header';
import { TranscriptWorkspace } from '@/components/TranscriptWorkspace';
import { Footer } from '@/components/Footer';
import { PrivacyTermsModal, ModalType } from '@/components/PrivacyTermsModal';

const TRANSCRIPT_FAQS = [
  {
    question: 'How does SaveVibe extract YouTube transcripts so quickly?',
    answer:
      'SaveVibe uses open-source InnerTube and TimedText parsers on the server to read YouTube caption tracks directly from YouTube internal endpoints in milliseconds, without downloading heavy video streams.',
  },
  {
    question: 'Which file formats are included in Download Transcript?',
    answer:
      'You can export any extracted transcript in 5 formats: Plain Text (.txt), SubRip Subtitles (.srt), WebVTT (.vtt), formatted PDF Document (.pdf), and UTF-8 Spreadsheet CSV (.csv).',
  },
  {
    question: 'Does the PDF and CSV export work with Bengali, Hindi, Arabic, or Japanese captions?',
    answer:
      'Yes. CSV files are exported with a UTF-8 BOM for clean spreadsheet compatibility, and PDF exports automatically switch to high-DPI Unicode rendering when non-Latin scripts are detected.',
  },
  {
    question: 'How do I search for a specific keyword inside a long video transcript?',
    answer:
      'Once the transcript loads in the timeline card, type any word or phrase in the top search bar. Matching segments highlight instantly, and you can jump between matches or filter down to matching lines only.',
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
              Built for Fast Research, Subtitles, and Note-Taking
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
              Extract manual or auto-generated YouTube captions in any available language and export cleanly for editing or study.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                Direct Internal API Extraction
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Scrapes structured JSON3 caption tracks directly via open-source InnerTube libraries in milliseconds with multi-language selection.
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
                Download as .txt for reading, .srt and .vtt for video editors, .pdf for clean archiving, or .csv for spreadsheets.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center">
                <Search className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                Live Timeline & Keyword Search
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Browse the complete time-stamped timeline, jump between keyword matches instantly, and copy individual lines or the full transcript.
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
