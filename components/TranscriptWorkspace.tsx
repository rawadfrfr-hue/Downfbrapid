'use client';

import React, { useState, useRef, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import {
  Clipboard,
  X,
  Search,
  Copy,
  Check,
  Download,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  FileText,
  FileSpreadsheet,
  Subtitles,
  FileCode2,
  RefreshCw,
  Columns2,
} from 'lucide-react';
import {
  TranscriptResultData,
  TranscriptSegment,
  TranscriptExportFormat,
  buildCopyText,
  downloadTranscriptFile,
  formatDisplayTimestamp,
  formatDurationSeconds,
} from '@/lib/youtube-transcript';
import {
  TRANSLATE_LANGUAGES,
  findTranslateLanguage,
} from '@/lib/translate-languages';
import {
  hasNonAsciiCharacters,
  transliterateSegmentsClientSide,
} from '@/lib/client-transliterate';
import type { Locale } from '@/lib/i18n';

const SAMPLE_VIDEOS = [
  {
    label: '3Blue1Brown: Neural Networks',
    bnLabel: '3Blue1Brown: নিউরাল নেটওয়ার্ক',
    url: 'https://www.youtube.com/watch?v=aircAruvnKk',
  },
  {
    label: 'TED: How Great Leaders Inspire Action',
    bnLabel: 'TED: নেতৃত্বের অনুপ্রেরণা',
    url: 'https://www.youtube.com/watch?v=qp0HIF3SfI4',
  },
];

const EXPORT_FORMATS: Array<{
  format: TranscriptExportFormat;
  ext: string;
  label: string;
  bnLabel: string;
  description: string;
  bnDescription: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    format: 'txt',
    ext: '.txt',
    label: 'Plain Text',
    bnLabel: 'প্লেইন টেক্সট',
    description: 'Clean readable text lines',
    bnDescription: 'সহজে পড়ার উপযোগী পরিষ্কার টেক্সট',
    icon: FileText,
  },
  {
    format: 'srt',
    ext: '.srt',
    label: 'SubRip Subtitle',
    bnLabel: 'SubRip সাবটাইটেল',
    description: 'Standard video editor format',
    bnDescription: 'ভিডিও এডিটিং সফটওয়্যারের ফরম্যাট',
    icon: Subtitles,
  },
  {
    format: 'vtt',
    ext: '.vtt',
    label: 'WebVTT Caption',
    bnLabel: 'WebVTT ক্যাপশন',
    description: 'HTML5 web player subtitles',
    bnDescription: 'ওয়েব প্লেয়ার সাবটাইটেল ফরম্যাট',
    icon: FileCode2,
  },
  {
    format: 'pdf',
    ext: '.pdf',
    label: 'PDF Document',
    bnLabel: 'PDF ডকুমেন্ট',
    description: 'Formatted printable transcript',
    bnDescription: 'প্রিন্ট ও সংরক্ষণের উপযোগী PDF',
    icon: FileText,
  },
  {
    format: 'csv',
    ext: '.csv',
    label: 'Spreadsheet CSV',
    bnLabel: 'স্প্রেডশিট CSV',
    description: 'Timeline & text columns for Excel',
    bnDescription: 'এক্সেলের জন্য সময় ও টেক্সট টেবিল',
    icon: FileSpreadsheet,
  },
];

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

interface TranscriptWorkspaceProps {
  locale?: Locale;
}

export const TranscriptWorkspace: React.FC<TranscriptWorkspaceProps> = ({ locale = 'en' }) => {
  const isBn = locale === 'bn';
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [result, setResult] = useState<TranscriptResultData | null>(null);
  const [isSwitchingLang, setIsSwitchingLang] = useState(false);

  // Translation state
  const [selectedTranslateLang, setSelectedTranslateLang] = useState<string>('original');
  const [translationCache, setTranslationCache] = useState<
    Record<string, { segments: TranscriptSegment[] }>
  >({});
  const [isTranslating, setIsTranslating] = useState(false);
  const [translateError, setTranslateError] = useState('');

  // Client-side transliteration state
  const [isTransliterated, setIsTransliterated] = useState(false);
  const [isTransliterating, setIsTransliterating] = useState(false);
  const [transliterationCache, setTransliterationCache] = useState<
    Record<string, { segments: TranscriptSegment[] }>
  >({});
  const [transliterationNotice, setTransliterationNotice] = useState('');
  const [showOriginalComparison, setShowOriginalComparison] = useState(false);

  // Result interaction controls
  const [includeTimestamps, setIncludeTimestamps] = useState(true);
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedSegmentIdx, setCopiedSegmentIdx] = useState<number | null>(null);
  const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState(false);
  const [lastDownloadedFormat, setLastDownloadedFormat] = useState<string | null>(null);

  // Live timeline search state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMatchesOnly, setFilterMatchesOnly] = useState(false);
  const [activeMatchCursor, setActiveMatchCursor] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const downloadMenuRef = useRef<HTMLDivElement>(null);
  const segmentRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // Close Download dropdown on outside click or Escape
  useEffect(() => {
    if (!isDownloadMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        downloadMenuRef.current &&
        !downloadMenuRef.current.contains(e.target as Node)
      ) {
        setIsDownloadMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsDownloadMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDownloadMenuOpen]);

  const resetTransformStates = () => {
    setSelectedTranslateLang('original');
    setTranslationCache({});
    setIsTranslating(false);
    setTranslateError('');
    setIsTransliterated(false);
    setIsTransliterating(false);
    setTransliterationCache({});
    setTransliterationNotice('');
    setShowOriginalComparison(false);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text.trim());
        setErrorMessage('');
      }
    } catch {
      inputRef.current?.focus();
    }
  };

  const handleClearInput = () => {
    setUrl('');
    setErrorMessage('');
    inputRef.current?.focus();
  };

  const handleExtract = async (overrideUrl?: string, lang?: string) => {
    const targetUrl = (overrideUrl ?? url).trim();
    if (!targetUrl) {
      setErrorMessage(
        isBn
          ? 'অনুগ্রহ করে একটি সঠিক ইউটিউব ভিডিও বা শর্টসের লিংক পেস্ট করুন।'
          : 'Please paste a valid YouTube video or Shorts URL.'
      );
      inputRef.current?.focus();
      return;
    }

    if (overrideUrl !== undefined) {
      setUrl(overrideUrl);
    }

    setErrorMessage('');
    setIsDownloadMenuOpen(false);
    resetTransformStates();

    if (lang && result) {
      setIsSwitchingLang(true);
    } else {
      setStatus('loading');
      setResult(null);
      setSearchQuery('');
      setFilterMatchesOnly(false);
      setActiveMatchCursor(0);
    }

    try {
      const res = await fetch('/api/youtube-transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl, lang }),
      });

      const json = await res.json();
      if (!res.ok || !json?.success || !json?.data) {
        throw new Error(
          isBn
            ? 'এই ইউটিউব ভিডিওটির ট্রান্সক্রিপ্ট পাওয়া যায়নি। ভিডিওটিতে সাবটাইটেল বা অটো-ক্যাপশন আছে কি না যাচাই করুন।'
            : json?.error || 'Could not extract transcript for this YouTube video.'
        );
      }

      setResult(json.data as TranscriptResultData);
      setStatus('success');
      setSearchQuery('');
      setActiveMatchCursor(0);
    } catch (err: unknown) {
      const msg = isBn
        ? err instanceof Error && /[\u0980-\u09FF]/.test(err.message)
          ? err.message
          : 'ইউটিউব ট্রান্সক্রিপ্ট সংগ্রহ করা যায়নি। অনুগ্রহ করে লিংকটি যাচাই করে আবার চেষ্টা করুন।'
        : err instanceof Error
        ? err.message
        : 'Failed to extract YouTube transcript.';
      setErrorMessage(msg);
      if (!lang) {
        setStatus('error');
      }
    } finally {
      setIsSwitchingLang(false);
    }
  };

  const handleReset = () => {
    setStatus('idle');
    setResult(null);
    setErrorMessage('');
    setSearchQuery('');
    setFilterMatchesOnly(false);
    setActiveMatchCursor(0);
    setIsDownloadMenuOpen(false);
    resetTransformStates();
    inputRef.current?.focus();
  };

  const runClientSideTransliteration = async (
    cacheKey: string,
    sourceSegments: TranscriptSegment[],
    sourceLangHint: string
  ) => {
    setTransliterationNotice('');

    const needsTranslit = sourceSegments.some((s) => hasNonAsciiCharacters(s.text));
    if (!needsTranslit) {
      setIsTransliterated(false);
      setTransliterationNotice(
        isBn
          ? 'এই ট্রান্সক্রিপ্টটি ইতিমধ্যেই ইংরেজি অক্ষরে রয়েছে। রূপান্তর করতে আগে বাংলা বা অন্য অ-ল্যাটিন ভাষায় অনুবাদ করুন।'
          : 'This transcript is already in English letters. Translate to a non-Latin language first to transliterate.'
      );
      return;
    }

    if (transliterationCache[cacheKey]) {
      setIsTransliterated(true);
      return;
    }

    setIsTransliterating(true);

    try {
      const texts = sourceSegments.map((s) => s.text);
      const res = await transliterateSegmentsClientSide(texts, sourceLangHint);

      const romanSegments: TranscriptSegment[] = sourceSegments.map((seg, idx) => ({
        ...seg,
        text: res.segments[idx] || seg.text,
      }));

      setTransliterationCache((prev) => ({
        ...prev,
        [cacheKey]: { segments: romanSegments },
      }));
      setIsTransliterated(true);
    } catch {
      setTransliterationNotice(
        isBn
          ? 'এই ব্রাউজার সেশনে অক্ষর রূপান্তর করা যায়নি।'
          : 'Could not transliterate in this browser session.'
      );
      setIsTransliterated(false);
    } finally {
      setIsTransliterating(false);
    }
  };

  const handleTranslateChange = async (targetLang: string) => {
    if (!result) return;
    setTranslateError('');
    setTransliterationNotice('');
    setIsDownloadMenuOpen(false);

    if (targetLang === 'original') {
      setSelectedTranslateLang('original');
      setActiveMatchCursor(0);
      if (isTransliterated) {
        const needsTranslit = result.segments.some((s) => hasNonAsciiCharacters(s.text));
        if (!needsTranslit) {
          setIsTransliterated(false);
        } else if (!transliterationCache['original']) {
          await runClientSideTransliteration('original', result.segments, result.language);
        }
      }
      return;
    }

    if (translationCache[targetLang]) {
      setSelectedTranslateLang(targetLang);
      setActiveMatchCursor(0);
      if (isTransliterated) {
        const cachedSegs = translationCache[targetLang].segments;
        if (!cachedSegs.some((s) => hasNonAsciiCharacters(s.text))) {
          setIsTransliterated(false);
        } else if (!transliterationCache[targetLang]) {
          await runClientSideTransliteration(targetLang, cachedSegs, targetLang);
        }
      }
      return;
    }

    setIsTranslating(true);
    try {
      const res = await fetch('/api/translate-transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          segments: result.segments.map((s) => s.text),
          sourceLang: result.language || 'auto',
          targetLang,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json?.success || !Array.isArray(json?.data?.translatedSegments)) {
        throw new Error(json?.error || 'Could not translate transcript.');
      }

      const translatedTexts = json.data.translatedSegments as string[];
      const translatedSegments: TranscriptSegment[] = result.segments.map((seg, idx) => ({
        ...seg,
        text: translatedTexts[idx] || seg.text,
      }));

      setTranslationCache((prev) => ({
        ...prev,
        [targetLang]: {
          segments: translatedSegments,
        },
      }));
      setSelectedTranslateLang(targetLang);
      setActiveMatchCursor(0);

      if (isTransliterated) {
        const langMeta = findTranslateLanguage(targetLang);
        if (langMeta?.code === 'en' || !translatedSegments.some((s) => hasNonAsciiCharacters(s.text))) {
          setIsTransliterated(false);
        } else {
          await runClientSideTransliteration(targetLang, translatedSegments, targetLang);
        }
      }
    } catch (err: unknown) {
      const msg = isBn
        ? 'ট্রান্সক্রিপ্ট অনুবাদ করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।'
        : err instanceof Error
        ? err.message
        : 'Translation request failed.';
      setTranslateError(msg);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleToggleTransliteration = async () => {
    if (!result || isTranslating || isTransliterating) return;
    setTransliterationNotice('');
    setIsDownloadMenuOpen(false);

    if (isTransliterated) {
      setIsTransliterated(false);
      return;
    }

    const activeBaseSegments =
      selectedTranslateLang === 'original'
        ? result.segments
        : translationCache[selectedTranslateLang]?.segments || result.segments;
    const sourceLangHint =
      selectedTranslateLang === 'original' ? result.language : selectedTranslateLang;

    await runClientSideTransliteration(
      selectedTranslateLang,
      activeBaseSegments,
      sourceLangHint
    );
  };

  const baseSegments = useMemo(() => {
    if (!result) return [] as TranscriptSegment[];
    if (selectedTranslateLang !== 'original' && translationCache[selectedTranslateLang]) {
      return translationCache[selectedTranslateLang].segments;
    }
    return result.segments;
  }, [result, selectedTranslateLang, translationCache]);

  const activeSegments = useMemo(() => {
    if (isTransliterated && transliterationCache[selectedTranslateLang]) {
      return transliterationCache[selectedTranslateLang].segments;
    }
    return baseSegments;
  }, [baseSegments, isTransliterated, transliterationCache, selectedTranslateLang]);

  const activeLanguageInfo = useMemo(() => {
    if (!result) return { code: 'en', label: 'English', shortTag: 'Original' };
    if (selectedTranslateLang === 'original') {
      return {
        code: result.language,
        label: result.languageName,
        shortTag: isTransliterated ? `${result.languageName} · English Script` : result.languageName,
      };
    }
    const langObj = findTranslateLanguage(selectedTranslateLang);
    const baseLabel = langObj ? `${langObj.name} (${langObj.nativeName})` : selectedTranslateLang;
    return {
      code: selectedTranslateLang,
      label: baseLabel,
      shortTag: isTransliterated ? `${baseLabel} · English Script` : baseLabel,
    };
  }, [result, selectedTranslateLang, isTransliterated]);

  const isTransformedView = selectedTranslateLang !== 'original' || isTransliterated;

  const handleCopyAll = async () => {
    if (!result) return;
    const text = buildCopyText(activeSegments, includeTimestamps);
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    }
  };

  const handleCopySegment = async (idx: number, startMs: number, text: string) => {
    const line = includeTimestamps
      ? `[${formatDisplayTimestamp(startMs)}] ${text}`
      : text;
    try {
      await navigator.clipboard.writeText(line);
      setCopiedSegmentIdx(idx);
      setTimeout(() => {
        setCopiedSegmentIdx((prev) => (prev === idx ? null : prev));
      }, 1500);
    } catch {
      // Ignore clipboard failure
    }
  };

  const handleDownloadFormat = (format: TranscriptExportFormat) => {
    if (!result) return;
    const wordCount = activeSegments.reduce(
      (acc, seg) => acc + seg.text.split(/\s+/).filter(Boolean).length,
      0
    );
    const exportData: TranscriptResultData = {
      ...result,
      language: activeLanguageInfo.code,
      languageName: activeLanguageInfo.shortTag,
      segments: activeSegments,
      wordCount,
    };
    const suffixParts: string[] = [];
    if (selectedTranslateLang !== 'original') {
      suffixParts.push(selectedTranslateLang);
    }
    if (isTransliterated) {
      suffixParts.push('transliterated');
    }
    const suffix = suffixParts.length > 0 ? suffixParts.join('_') : undefined;
    downloadTranscriptFile(exportData, format, includeTimestamps, suffix);
    setIsDownloadMenuOpen(false);
    setLastDownloadedFormat(format.toUpperCase());
    setTimeout(() => setLastDownloadedFormat(null), 2200);
  };

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const matchingSegmentIndices = useMemo(() => {
    if (!result || !normalizedQuery) return [] as number[];
    const matches: number[] = [];
    activeSegments.forEach((seg, idx) => {
      if (seg.text.toLowerCase().includes(normalizedQuery)) {
        matches.push(idx);
      }
    });
    return matches;
  }, [result, activeSegments, normalizedQuery]);

  const displayedSegments = useMemo(() => {
    if (!result) return [];
    if (!normalizedQuery || !filterMatchesOnly) {
      return activeSegments.map((seg, idx) => ({ seg, originalIdx: idx }));
    }
    const matchSet = new Set(matchingSegmentIndices);
    return activeSegments
      .map((seg, idx) => ({ seg, originalIdx: idx }))
      .filter(({ originalIdx }) => matchSet.has(originalIdx));
  }, [result, activeSegments, normalizedQuery, filterMatchesOnly, matchingSegmentIndices]);

  const activeSegmentOriginalIdx =
    matchingSegmentIndices.length > 0
      ? matchingSegmentIndices[activeMatchCursor % matchingSegmentIndices.length]
      : -1;

  const jumpToMatch = (direction: 'next' | 'prev') => {
    if (matchingSegmentIndices.length === 0) return;
    const total = matchingSegmentIndices.length;
    const nextCursor =
      direction === 'next'
        ? (activeMatchCursor + 1) % total
        : (activeMatchCursor - 1 + total) % total;
    setActiveMatchCursor(nextCursor);
    const targetIdx = matchingSegmentIndices[nextCursor];
    const el = segmentRefs.current[targetIdx];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const renderHighlightedText = (text: string, isCurrentActiveRow: boolean) => {
    if (!normalizedQuery) return text;
    const regex = new RegExp(`(${escapeRegExp(searchQuery.trim())})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) => {
      if (part.toLowerCase() === normalizedQuery) {
        return (
          <mark
            key={i}
            className={
              isCurrentActiveRow
                ? 'bg-[#FF0000] text-white px-0.5 rounded-[2px] font-medium'
                : 'bg-amber-200/80 text-[#0F0F0F] px-0.5 rounded-[2px] font-medium'
            }
          >
            {part}
          </mark>
        );
      }
      return <React.Fragment key={i}>{part}</React.Fragment>;
    });
  };

  return (
    <section className="w-full max-w-3xl mx-auto pt-8 sm:pt-12 pb-10 px-4">
      {/* Minimal SaaS Header */}
      <div className="text-center space-y-2.5 mb-8">
        <h1 className="text-2xl sm:text-4xl font-bold text-[#0F0F0F] tracking-tight leading-tight text-balance">
          {isBn ? 'ইউটিউব ট্রান্সক্রিপ্ট ডাউনলোডার' : 'YouTube Transcript Downloader'}
        </h1>
        <p className="max-w-xl mx-auto text-sm sm:text-[15px] text-[#606060] leading-relaxed">
          {isBn
            ? 'যেকোনো ইউটিউব ভিডিওর কথা ও সাবটাইটেল বের করুন, বাংলাসহ ৪০+ ভাষায় অনুবাদ করুন এবং TXT, SRT, VTT বা PDF হিসেবে সেভ করুন।'
            : 'Extract, translate, search, and export YouTube captions in clean text, subtitles, or PDF.'}
        </p>
      </div>

      {/* Section 1: Stacked URL Input & Extract Button (Height: 48px, Radius: 8px) */}
      <div className="w-full mb-4 space-y-3">
        <div className="flex flex-col gap-3">
          <div className="relative w-full h-[48px] flex items-center bg-white border border-[#E5E5E5] rounded-[8px] focus-within:border-[#0F0F0F] transition-colors">
            <input
              ref={inputRef}
              type="url"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (errorMessage) setErrorMessage('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleExtract();
                }
              }}
              placeholder={
                isBn
                  ? 'ইউটিউব ভিডিও বা শর্টস লিংক পেস্ট করুন...'
                  : 'Paste YouTube video or Shorts URL...'
              }
              aria-label={isBn ? 'ইউটিউব ভিডিও লিংক' : 'YouTube Video URL'}
              className="w-full h-full pl-3.5 pr-24 bg-transparent text-[#0F0F0F] placeholder:text-[#606060]/70 text-sm rounded-[8px] focus:outline-none"
            />

            <div className="absolute right-2 flex items-center gap-1">
              {url && (
                <button
                  type="button"
                  onClick={handleClearInput}
                  aria-label={isBn ? 'লিংক মুছে ফেলুন' : 'Clear URL'}
                  className="p-1.5 rounded-[6px] text-[#606060] hover:text-[#0F0F0F] hover:bg-[#F2F2F2] transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                type="button"
                onClick={handlePaste}
                aria-label={isBn ? 'ক্লিপবোর্ড থেকে পেস্ট করুন' : 'Paste URL from clipboard'}
                className="h-[32px] px-2.5 rounded-[6px] bg-[#F2F2F2] hover:bg-[#E5E5E5] text-[#0F0F0F] font-medium text-xs transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <Clipboard className="w-3.5 h-3.5 text-[#606060]" />
                <span>{isBn ? 'পেস্ট করুন' : 'Paste'}</span>
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleExtract()}
            disabled={status === 'loading'}
            className="w-full h-[48px] px-6 rounded-[8px] bg-[#FF0000] hover:bg-[#E00000] active:bg-[#CC0000] disabled:opacity-75 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors duration-150 flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF0000] focus-visible:ring-offset-2 whitespace-nowrap"
          >
            {status === 'loading' ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                <span>{isBn ? 'ট্রান্সক্রিপ্ট আনা হচ্ছে...' : 'Extracting...'}</span>
              </>
            ) : (
              <span>{isBn ? 'ট্রান্সক্রিপ্ট বের করুন' : 'Extract Transcript'}</span>
            )}
          </button>
        </div>

        {/* Example Videos (visible when idle/error) */}
        {status !== 'success' && (
          <div className="flex items-center justify-center flex-wrap gap-x-4 gap-y-1.5 pt-1 text-xs text-[#606060]">
            <span>{isBn ? 'উদাহরণ ভিডিও দেখুন:' : 'Try an example:'}</span>
            {SAMPLE_VIDEOS.map((sample) => (
              <button
                key={sample.url}
                type="button"
                onClick={() => handleExtract(sample.url)}
                disabled={status === 'loading'}
                className="text-[#0F0F0F] hover:text-[#FF0000] underline underline-offset-4 decoration-[#E5E5E5] hover:decoration-[#FF0000] transition-colors font-medium"
              >
                {isBn ? sample.bnLabel : sample.label}
              </button>
            ))}
          </div>
        )}

        {/* Error Banner */}
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2.5 text-[13px] font-medium text-[#CC0000] bg-red-50/70 border border-red-200/80 p-3.5 rounded-[8px] text-left"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </motion.div>
        )}
      </div>

      {/* Loading Skeleton */}
      <AnimatePresence mode="wait">
        {status === 'loading' && (
          <motion.div
            key="loading-skeleton"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="bg-white border border-[#E5E5E5] rounded-[12px] p-4 sm:p-6 space-y-4"
          >
            <div className="flex flex-row items-center gap-4 animate-pulse pb-4 border-b border-[#F2F2F2]">
              <div className="w-[120px] aspect-video rounded-[8px] bg-[#F2F2F2] shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-[#F2F2F2] rounded w-3/4" />
                <div className="h-3.5 bg-[#F2F2F2] rounded w-1/3" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-pulse pb-4 border-b border-[#F2F2F2]">
              <div className="h-[40px] bg-[#F2F2F2] rounded-[8px]" />
              <div className="h-[40px] bg-[#F2F2F2] rounded-[8px]" />
            </div>
            <div className="space-y-3 animate-pulse pt-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <div key={n} className="flex items-center gap-4">
                  <div className="w-12 h-3.5 bg-[#F2F2F2] rounded shrink-0" />
                  <div className="h-3.5 bg-[#F2F2F2] rounded flex-1" />
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Unified SaaS Workspace Card */}
        {status === 'success' && result && (
          <motion.div
            key="transcript-result"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="bg-white border border-[#E5E5E5] rounded-[12px] p-4 sm:p-6"
          >
            {/* Section 2: Horizontal Media Video Info (120px 16:9 Thumbnail Left, 2-Line Clamped Title & Channel Right) */}
            <div className="flex flex-row items-center gap-3.5 sm:gap-4 mb-4 pb-4 border-b border-[#F2F2F2]">
              <div className="w-[120px] aspect-video rounded-[8px] overflow-hidden bg-[#0F0F0F] shrink-0 relative">
                <Image
                  src={`https://i.ytimg.com/vi/${result.videoId}/hqdefault.jpg`}
                  alt={result.title}
                  fill
                  sizes="120px"
                  referrerPolicy="no-referrer"
                  className="object-cover"
                />
                {result.durationSeconds > 0 && (
                  <span className="absolute bottom-1 right-1 bg-black/80 text-white font-mono tabular-nums text-[10px] font-medium px-1.5 py-0.5 rounded-[4px] z-10">
                    {formatDurationSeconds(result.durationSeconds)}
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0 flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1 text-left">
                  <h2
                    title={result.title}
                    className="text-[15px] sm:text-base font-semibold text-[#0F0F0F] leading-snug line-clamp-2"
                  >
                    {result.title}
                  </h2>
                  <p className="text-[13px] text-[#606060] font-medium truncate mt-1">
                    {result.author}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleReset}
                  title="Extract another video"
                  aria-label="New Video"
                  className="p-2 rounded-[8px] text-[#606060] hover:text-[#0F0F0F] hover:bg-[#F2F2F2] transition-colors shrink-0"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Section 3: Translation & Options Grid (Side-by-Side 40px Dropdowns + Inline Transliterate Toggle Switch) */}
            <div className="mb-4 pb-4 border-b border-[#F2F2F2]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Source Language Dropdown (No external label, placeholder inside) */}
                <div className="relative">
                  <select
                    id="transcript-lang"
                    aria-label={isBn ? 'মূল ভাষা' : 'Source language'}
                    value={result.language}
                    disabled={
                      result.availableLanguages.length === 0 ||
                      isSwitchingLang ||
                      isTranslating
                    }
                    onChange={(e) => handleExtract(result.originalUrl, e.target.value)}
                    className="w-full h-[40px] pl-3.5 pr-9 bg-[#F2F2F2] hover:bg-[#EAEAEA] border border-transparent focus:border-[#0F0F0F] focus:bg-white rounded-[8px] text-[14px] font-medium text-[#0F0F0F] appearance-none cursor-pointer transition-colors focus:outline-none disabled:opacity-60 truncate"
                  >
                    {result.availableLanguages.length > 0 ? (
                      result.availableLanguages.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          {isBn ? 'মূল: ' : 'Source: '}
                          {lang.name}
                          {lang.isAutoGenerated ? (isBn ? ' (অটো)' : ' (Auto)') : ''}
                        </option>
                      ))
                    ) : (
                      <option value={result.language}>
                        {isBn ? 'মূল: ' : 'Source: '}
                        {result.languageName}
                      </option>
                    )}
                  </select>
                  <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#606060]">
                    {isSwitchingLang ? (
                      <span className="block w-3.5 h-3.5 border-2 border-[#D4D4D4] border-t-[#0F0F0F] rounded-full animate-spin" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </div>

                {/* Translate Language Dropdown (No external label, placeholder inside) */}
                <div className="relative">
                  <select
                    id="translate-target-lang"
                    aria-label={isBn ? 'অনুবাদের ভাষা' : 'Translate language'}
                    value={selectedTranslateLang}
                    disabled={isTranslating || isSwitchingLang}
                    onChange={(e) => handleTranslateChange(e.target.value)}
                    className={`w-full h-[40px] pl-3.5 pr-9 bg-[#F2F2F2] hover:bg-[#EAEAEA] border border-transparent focus:border-[#0F0F0F] focus:bg-white rounded-[8px] text-[14px] font-medium appearance-none cursor-pointer transition-colors focus:outline-none disabled:opacity-60 truncate ${
                      selectedTranslateLang === 'original'
                        ? 'text-[#606060]'
                        : 'text-[#0F0F0F]'
                    }`}
                  >
                    <option value="original">
                      {selectedTranslateLang === 'original'
                        ? isBn
                          ? 'ভাষায় অনুবাদ করুন...'
                          : 'Translate to...'
                        : isBn
                        ? `মূল (${result.languageName})`
                        : `Original (${result.languageName})`}
                    </option>
                    {TRANSLATE_LANGUAGES.map((lang) => (
                      <option key={lang.code} value={lang.code} className="text-[#0F0F0F]">
                        {lang.name} ({lang.nativeName})
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#606060]">
                    {isTranslating ? (
                      <span className="block w-3.5 h-3.5 border-2 border-[#D4D4D4] border-t-[#FF0000] rounded-full animate-spin" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </div>
              </div>

              {/* Compact Toggle Switch Row (Transliterate A-Z & Compare Original) */}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  role="switch"
                  aria-checked={isTransliterated}
                  onClick={handleToggleTransliteration}
                  disabled={isTranslating || isTransliterating || isSwitchingLang}
                  className="inline-flex items-center gap-2.5 text-left group focus:outline-none disabled:opacity-60"
                >
                  <span
                    className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-150 ${
                      isTransliterated ? 'bg-[#0F0F0F]' : 'bg-[#D4D4D4]'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 rounded-full bg-white shadow-xs transition-transform duration-150 ${
                        isTransliterated ? 'translate-x-[18px]' : 'translate-x-[2px]'
                      }`}
                    />
                  </span>
                  <span className="text-[13px] font-medium text-[#0F0F0F] group-hover:text-[#606060] transition-colors">
                    {isTransliterating
                      ? isBn
                        ? 'রূপান্তর হচ্ছে...'
                        : 'Transliterating...'
                      : isBn
                      ? 'ইংরেজি অক্ষরে পড়ুন (A–Z)'
                      : 'Transliterate (A–Z)'}
                  </span>
                </button>

                {isTransformedView && (
                  <button
                    type="button"
                    onClick={() => setShowOriginalComparison((prev) => !prev)}
                    className={`inline-flex items-center gap-1.5 text-[13px] font-medium transition-colors ${
                      showOriginalComparison
                        ? 'text-[#0F0F0F]'
                        : 'text-[#606060] hover:text-[#0F0F0F]'
                    }`}
                  >
                    <Columns2 className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {showOriginalComparison
                        ? isBn
                          ? 'মূল লেখা লুকান'
                          : 'Hide Original'
                        : isBn
                        ? 'মূল লেখার সাথে তুলনা'
                        : 'Compare Original'}
                    </span>
                  </button>
                )}
              </div>

              {/* Error or Notice Alerts */}
              {(translateError || transliterationNotice) && (
                <div className="mt-3 space-y-2">
                  {translateError && (
                    <div className="flex items-start justify-between gap-2 text-xs text-[#CC0000] bg-red-50/70 border border-red-200/80 px-3 py-2 rounded-[8px]">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>{translateError}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setTranslateError('')}
                        aria-label="Dismiss translation error"
                        className="text-[#606060] hover:text-[#0F0F0F]"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {transliterationNotice && (
                    <div className="flex items-start justify-between gap-2 text-xs text-[#0F0F0F] bg-[#F2F2F2] px-3 py-2 rounded-[8px]">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#606060]" />
                        <span>{transliterationNotice}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setTransliterationNotice('')}
                        aria-label="Dismiss transliteration notice"
                        className="text-[#606060] hover:text-[#0F0F0F]"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Section 4: Stacked Action Buttons — Copy (Secondary #F2F2F2) & Download Split-Down Button (Primary #0F0F0F) */}
            <div className="flex flex-col gap-3 mb-4 pb-4 border-b border-[#F2F2F2]">
              {/* Copy Transcript (Clean Secondary Button) */}
              <button
                type="button"
                onClick={handleCopyAll}
                className="w-full h-[44px] px-4 rounded-[8px] bg-[#F2F2F2] hover:bg-[#E5E5E5] active:bg-[#DCDCDC] text-[#0F0F0F] text-sm font-semibold transition-colors flex items-center justify-center gap-2 whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F0F0F] focus-visible:ring-offset-2"
              >
                {copiedAll ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{isBn ? 'ট্রান্সক্রিপ্ট কপি হয়েছে!' : 'Copied Transcript!'}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 shrink-0" />
                    <span>{isBn ? 'ট্রান্সক্রিপ্ট কপি করুন' : 'Copy Transcript'}</span>
                  </>
                )}
              </button>

              {/* Download Transcript (Solid Primary Button with Split-Down Menu) */}
              <div className="relative w-full" ref={downloadMenuRef}>
                <div className="flex items-center w-full h-[44px] rounded-[8px] bg-[#0F0F0F] text-white overflow-hidden">
                  <button
                    type="button"
                    onClick={() => handleDownloadFormat('txt')}
                    className="flex-1 h-full px-4 flex items-center justify-center gap-2 hover:bg-[#262626] active:bg-black text-sm font-semibold transition-colors whitespace-nowrap focus:outline-none"
                  >
                    <Download className="w-4 h-4 shrink-0" />
                    <span>
                      {lastDownloadedFormat
                        ? isBn
                          ? `.${lastDownloadedFormat.toLowerCase()} ডাউনলোড হয়েছে`
                          : `Downloaded .${lastDownloadedFormat.toLowerCase()}`
                        : isBn
                        ? 'ট্রান্সক্রিপ্ট ডাউনলোড'
                        : 'Download Transcript'}
                    </span>
                  </button>

                  <span className="w-px h-5 bg-white/20 shrink-0" aria-hidden="true" />

                  <button
                    type="button"
                    onClick={() => setIsDownloadMenuOpen((prev) => !prev)}
                    aria-expanded={isDownloadMenuOpen}
                    aria-haspopup="menu"
                    aria-label={isBn ? 'এক্সপোর্ট ফরম্যাট অপশন খুলুন' : 'Open export format and timestamp options'}
                    className="h-full px-4 flex items-center justify-center hover:bg-[#262626] active:bg-black transition-colors shrink-0 focus:outline-none"
                  >
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-150 ${
                        isDownloadMenuOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                </div>

                {/* Split-Down Popup Menu (Timestamp Option + 5 Export Formats) */}
                <AnimatePresence>
                  {isDownloadMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.98 }}
                      transition={{ duration: 0.14 }}
                      role="menu"
                      className="absolute right-0 mt-2 w-full sm:w-80 rounded-[10px] bg-white border border-[#E5E5E5] shadow-lg z-30 py-2 overflow-hidden"
                    >
                      {/* Timestamp vs Plain Text Toggle Inside Menu */}
                      <div className="px-3 pb-2.5 mb-1.5 border-b border-[#F2F2F2]">
                        <div
                          className="grid grid-cols-2 gap-1 p-1 bg-[#F2F2F2] rounded-[8px]"
                          role="group"
                          aria-label={isBn ? 'টাইমস্ট্যাম্প অপশন' : 'Timestamp visibility'}
                        >
                          <button
                            type="button"
                            onClick={() => setIncludeTimestamps(true)}
                            className={`py-1.5 px-2 text-xs font-medium rounded-[6px] transition-colors whitespace-nowrap ${
                              includeTimestamps
                                ? 'bg-white text-[#0F0F0F] shadow-2xs'
                                : 'text-[#606060] hover:text-[#0F0F0F]'
                            }`}
                          >
                            {isBn ? 'টাইমস্ট্যাম্পসহ' : 'With Timestamps'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setIncludeTimestamps(false)}
                            className={`py-1.5 px-2 text-xs font-medium rounded-[6px] transition-colors whitespace-nowrap ${
                              !includeTimestamps
                                ? 'bg-white text-[#0F0F0F] shadow-2xs'
                                : 'text-[#606060] hover:text-[#0F0F0F]'
                            }`}
                          >
                            {isBn ? 'শুধু টেক্সট' : 'Plain Text'}
                          </button>
                        </div>
                      </div>

                      {/* Format Options */}
                      {EXPORT_FORMATS.map((item) => {
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.format}
                            type="button"
                            role="menuitem"
                            onClick={() => handleDownloadFormat(item.format)}
                            className="w-full px-3.5 py-2 flex items-center gap-3 text-left hover:bg-[#F2F2F2] transition-colors"
                          >
                            <div className="w-8 h-8 rounded-[6px] bg-[#F2F2F2] flex items-center justify-center shrink-0">
                              <Icon className="w-4 h-4 text-[#0F0F0F]" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[13px] font-semibold text-[#0F0F0F]">
                                  {isBn ? item.bnLabel : item.label}
                                </span>
                                <span className="font-mono text-[11px] font-semibold text-[#606060]">
                                  {item.ext}
                                </span>
                              </div>
                              <p className="text-[11px] text-[#606060] truncate">
                                {isBn ? item.bnDescription : item.description}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Section 5: Pill Search Bar (Height: 42px, Border-radius: 20px) & Timeline Preview */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1 h-[42px] flex items-center bg-[#F2F2F2] focus-within:bg-white border border-transparent focus-within:border-[#0F0F0F] rounded-[20px] px-3.5 transition-colors">
                  <Search className="w-4 h-4 text-[#606060] shrink-0 mr-2.5 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setActiveMatchCursor(0);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        jumpToMatch(e.shiftKey ? 'prev' : 'next');
                      }
                    }}
                    placeholder={isBn ? 'ট্রান্সক্রিপ্টে খুঁজুন...' : 'Search in transcript...'}
                    aria-label={isBn ? 'ট্রান্সক্রিপ্টে শব্দ খুঁজুন' : 'Search keyword in transcript'}
                    className="w-full h-full bg-transparent text-[14px] text-[#0F0F0F] placeholder:text-[#606060] focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setFilterMatchesOnly(false);
                        setActiveMatchCursor(0);
                      }}
                      aria-label={isBn ? 'সার্চ মুছুন' : 'Clear keyword search'}
                      className="ml-1.5 text-[#606060] hover:text-[#0F0F0F] transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {normalizedQuery && (
                  <div className="flex items-center justify-between sm:justify-end gap-2.5 text-xs shrink-0">
                    <span className="font-mono tabular-nums text-[#606060] whitespace-nowrap">
                      {matchingSegmentIndices.length > 0
                        ? `${(activeMatchCursor % matchingSegmentIndices.length) + 1} / ${
                            matchingSegmentIndices.length
                          }`
                        : isBn
                        ? '০টি মিল'
                        : '0 matches'}
                    </span>

                    {matchingSegmentIndices.length > 0 && (
                      <div className="flex items-center border border-[#E5E5E5] rounded-[8px] bg-white overflow-hidden">
                        <button
                          type="button"
                          onClick={() => jumpToMatch('prev')}
                          aria-label={isBn ? 'আগের মিল' : 'Previous match'}
                          className="p-1.5 text-[#606060] hover:bg-[#F2F2F2] hover:text-[#0F0F0F] transition-colors"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-px h-4 bg-[#E5E5E5]" />
                        <button
                          type="button"
                          onClick={() => jumpToMatch('next')}
                          aria-label={isBn ? 'পরের মিল' : 'Next match'}
                          className="p-1.5 text-[#606060] hover:bg-[#F2F2F2] hover:text-[#0F0F0F] transition-colors"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    <div className="inline-flex items-center gap-0.5 p-0.5 bg-[#F2F2F2] rounded-[8px]">
                      <button
                        type="button"
                        onClick={() => setFilterMatchesOnly(false)}
                        className={`px-2.5 py-1 text-[11px] font-medium rounded-[6px] transition-colors whitespace-nowrap ${
                          !filterMatchesOnly
                            ? 'bg-white text-[#0F0F0F] shadow-2xs'
                            : 'text-[#606060] hover:text-[#0F0F0F]'
                        }`}
                      >
                        {isBn ? 'সবগুলো' : 'All'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setFilterMatchesOnly(true)}
                        className={`px-2.5 py-1 text-[11px] font-medium rounded-[6px] transition-colors whitespace-nowrap ${
                          filterMatchesOnly
                            ? 'bg-white text-[#0F0F0F] shadow-2xs'
                            : 'text-[#606060] hover:text-[#0F0F0F]'
                        }`}
                      >
                        {isBn ? 'মিলে যাওয়া' : 'Matches'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Scrollable Transcript Preview */}
              <div className="max-h-[520px] overflow-y-auto divide-y divide-[#F2F2F2] pr-1">
                {displayedSegments.length === 0 ? (
                  <div className="py-12 px-4 text-center space-y-2">
                    <p className="text-sm font-medium text-[#0F0F0F]">
                      {isBn
                        ? `“${searchQuery}” এর সাথে কোনো লাইন মেলেনি`
                        : `No transcript lines match “${searchQuery}”`}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setFilterMatchesOnly(false);
                      }}
                      className="text-xs font-semibold text-[#FF0000] hover:underline underline-offset-4"
                    >
                      {isBn ? 'সব লাইন দেখান' : 'Show all transcript lines'}
                    </button>
                  </div>
                ) : (
                  displayedSegments.map(({ seg, originalIdx }) => {
                    const isCurrentActiveMatch =
                      normalizedQuery.length > 0 && originalIdx === activeSegmentOriginalIdx;
                    const isCopiedLine = copiedSegmentIdx === originalIdx;
                    const originalText = result.segments[originalIdx]?.text;

                    return (
                      <div
                        key={`${seg.startMs}-${originalIdx}`}
                        ref={(el) => {
                          segmentRefs.current[originalIdx] = el;
                        }}
                        className={`flex items-baseline gap-4 py-3 px-2 rounded-[6px] transition-colors ${
                          isCurrentActiveMatch
                            ? 'bg-red-50/60'
                            : 'hover:bg-[#FAFAFA]'
                        }`}
                      >
                        {includeTimestamps && (
                          <button
                            type="button"
                            onClick={() => handleCopySegment(originalIdx, seg.startMs, seg.text)}
                            title={isBn ? 'লাইন কপি করুন' : 'Copy line'}
                            className="font-mono tabular-nums text-[12px] font-semibold text-[#606060] hover:text-[#0F0F0F] w-14 shrink-0 text-left focus:outline-none focus-visible:underline"
                          >
                            {isCopiedLine ? (
                              <span className="text-emerald-600 font-sans">
                                {isBn ? 'কপি হয়েছে' : 'Copied'}
                              </span>
                            ) : (
                              formatDisplayTimestamp(seg.startMs)
                            )}
                          </button>
                        )}

                        <div className="flex-1 min-w-0 space-y-1 text-left">
                          <p className="text-sm sm:text-[15px] leading-relaxed text-[#0F0F0F]">
                            {renderHighlightedText(seg.text, isCurrentActiveMatch)}
                          </p>
                          {showOriginalComparison &&
                            isTransformedView &&
                            originalText &&
                            originalText !== seg.text && (
                              <p className="text-xs leading-relaxed text-[#606060]">
                                {originalText}
                              </p>
                            )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
