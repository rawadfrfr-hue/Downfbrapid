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
  Globe,
  Sparkles,
} from 'lucide-react';
import {
  TranscriptResultData,
  TranscriptExportFormat,
  buildCopyText,
  downloadTranscriptFile,
  formatDisplayTimestamp,
  formatDurationSeconds,
} from '@/lib/youtube-transcript';

const SAMPLE_VIDEOS = [
  {
    label: '3Blue1Brown: Neural Networks',
    url: 'https://www.youtube.com/watch?v=aircAruvnKk',
  },
  {
    label: 'TED: How Great Leaders Inspire Action',
    url: 'https://www.youtube.com/watch?v=qp0HIF3SfI4',
  },
];

const EXPORT_FORMATS: Array<{
  format: TranscriptExportFormat;
  ext: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    format: 'txt',
    ext: '.txt',
    label: 'Plain Text',
    description: 'Clean readable text lines',
    icon: FileText,
  },
  {
    format: 'srt',
    ext: '.srt',
    label: 'SubRip Subtitle',
    description: 'Standard video editor format',
    icon: Subtitles,
  },
  {
    format: 'vtt',
    ext: '.vtt',
    label: 'WebVTT Caption',
    description: 'HTML5 web player subtitles',
    icon: FileCode2,
  },
  {
    format: 'pdf',
    ext: '.pdf',
    label: 'PDF Document',
    description: 'Formatted printable transcript',
    icon: FileText,
  },
  {
    format: 'csv',
    ext: '.csv',
    label: 'Spreadsheet CSV',
    description: 'Timeline & text columns for Excel',
    icon: FileSpreadsheet,
  },
];

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function formatProcessingDuration(ms: number): string {
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

export const TranscriptWorkspace: React.FC = () => {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [result, setResult] = useState<TranscriptResultData | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isSwitchingLang, setIsSwitchingLang] = useState(false);

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

  // Live elapsed timer while extracting
  useEffect(() => {
    if (status !== 'loading') return;
    const start = performance.now();
    const id = window.setInterval(() => {
      setElapsedMs(Math.round(performance.now() - start));
    }, 60);
    return () => window.clearInterval(id);
  }, [status]);

  // Close Download Transcript dropdown on outside click or Escape
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
      setErrorMessage('Please paste a valid YouTube video or Shorts URL.');
      inputRef.current?.focus();
      return;
    }

    if (overrideUrl !== undefined) {
      setUrl(overrideUrl);
    }

    setErrorMessage('');
    setIsDownloadMenuOpen(false);
    if (lang && result) {
      setIsSwitchingLang(true);
    } else {
      setElapsedMs(0);
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
          json?.error || 'Could not extract transcript for this YouTube video.'
        );
      }

      setResult(json.data as TranscriptResultData);
      setStatus('success');
      setSearchQuery('');
      setActiveMatchCursor(0);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Failed to extract YouTube transcript.';
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
    inputRef.current?.focus();
  };

  const handleCopyAll = async () => {
    if (!result) return;
    const text = buildCopyText(result.segments, includeTimestamps);
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch {
      // Fallback textarea copy
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
    downloadTranscriptFile(result, format, includeTimestamps);
    setIsDownloadMenuOpen(false);
    setLastDownloadedFormat(format.toUpperCase());
    setTimeout(() => setLastDownloadedFormat(null), 2200);
  };

  // Search matching indices & filtered view
  const normalizedQuery = searchQuery.trim().toLowerCase();

  const matchingSegmentIndices = useMemo(() => {
    if (!result || !normalizedQuery) return [] as number[];
    const matches: number[] = [];
    result.segments.forEach((seg, idx) => {
      if (seg.text.toLowerCase().includes(normalizedQuery)) {
        matches.push(idx);
      }
    });
    return matches;
  }, [result, normalizedQuery]);

  const displayedSegments = useMemo(() => {
    if (!result) return [];
    if (!normalizedQuery || !filterMatchesOnly) {
      return result.segments.map((seg, idx) => ({ seg, originalIdx: idx }));
    }
    const matchSet = new Set(matchingSegmentIndices);
    return result.segments
      .map((seg, idx) => ({ seg, originalIdx: idx }))
      .filter(({ originalIdx }) => matchSet.has(originalIdx));
  }, [result, normalizedQuery, filterMatchesOnly, matchingSegmentIndices]);

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
                ? 'bg-red-600 text-white px-0.5 rounded-xs font-medium'
                : 'bg-amber-200/80 text-slate-900 px-0.5 rounded-xs font-medium'
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
    <section className="w-full max-w-4xl mx-auto pt-8 sm:pt-12 pb-10 px-4">
      {/* Hero Header */}
      <div className="text-center space-y-3.5 mb-8">
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-[1.12] text-balance">
          YouTube Transcript Downloader
        </h1>
        <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-600 leading-relaxed">
          Scrape accurate, time-synced transcripts directly from YouTube&apos;s internal API in milliseconds. Search keywords live and export as TXT, SRT, VTT, PDF, or CSV.
        </p>
      </div>

      {/* Input & Extract Transcript Form */}
      <div className="w-full max-w-2xl mx-auto space-y-3">
        <div className="relative flex items-center bg-white border border-slate-200 rounded-xl shadow-xs hover:shadow-sm focus-within:border-red-600 focus-within:ring-1 focus-within:ring-red-600 transition-all duration-200">
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
            placeholder="Paste YouTube video, Shorts, or live link here..."
            aria-label="YouTube Video URL"
            className="w-full py-4 pl-4 pr-28 bg-transparent text-slate-900 placeholder:text-slate-400 text-sm sm:text-base rounded-xl focus:outline-none"
          />

          <div className="absolute right-3 flex items-center gap-1.5">
            {url && (
              <button
                type="button"
                onClick={handleClearInput}
                aria-label="Clear URL"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={handlePaste}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium text-xs transition-colors border border-slate-200/80 whitespace-nowrap shrink-0"
            >
              <Clipboard className="w-3.5 h-3.5 text-red-600" />
              <span className="hidden sm:inline">Paste</span>
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleExtract()}
          disabled={status === 'loading'}
          className="w-full py-3.5 px-6 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:opacity-80 disabled:cursor-not-allowed text-white font-bold text-base transition-all duration-150 flex items-center justify-center gap-2.5 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 whitespace-nowrap"
        >
          {status === 'loading' ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
              <span>Extracting Transcript</span>
              <span className="font-mono tabular-nums text-xs text-white/90">
                ({(elapsedMs / 1000).toFixed(1)}s)
              </span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>Extract Transcript</span>
            </>
          )}
        </button>

        {/* Quick Sample Videos (visible when idle/error) */}
        {status !== 'success' && (
          <div className="flex items-center justify-center flex-wrap gap-x-4 gap-y-1.5 pt-1 text-xs text-slate-500">
            <span>Try an example:</span>
            {SAMPLE_VIDEOS.map((sample) => (
              <button
                key={sample.url}
                type="button"
                onClick={() => handleExtract(sample.url)}
                disabled={status === 'loading'}
                className="text-slate-700 hover:text-red-600 underline underline-offset-4 decoration-slate-300 hover:decoration-red-600 transition-colors font-medium"
              >
                {sample.label}
              </button>
            ))}
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2.5 text-xs sm:text-sm font-medium text-rose-700 bg-rose-50 border border-rose-200 p-3.5 rounded-xl text-left"
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
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-8 bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-[0_8px_30px_rgba(15,23,42,0.04)] space-y-5"
          >
            <div className="flex flex-col sm:flex-row gap-4 animate-pulse">
              <div className="w-full sm:w-44 aspect-video rounded-xl bg-slate-200 shrink-0" />
              <div className="flex-1 space-y-2.5 py-1">
                <div className="h-5 bg-slate-200 rounded w-3/4" />
                <div className="h-3.5 bg-slate-100 rounded w-1/2" />
                <div className="h-3.5 bg-slate-100 rounded w-1/3" />
              </div>
            </div>
            <div className="h-px bg-slate-100" />
            <div className="space-y-3 animate-pulse">
              {[1, 2, 3, 4, 5].map((n) => (
                <div key={n} className="flex items-center gap-4">
                  <div className="w-12 h-4 bg-slate-200 rounded shrink-0" />
                  <div className="h-4 bg-slate-100 rounded flex-1" />
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Extracted Transcript Workspace */}
        {status === 'success' && result && (
          <motion.div
            key="transcript-result"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="mt-8 space-y-4"
          >
            {/* Video Info & Action Controls Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-[0_8px_30px_rgba(15,23,42,0.05)]">
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 items-start">
                {/* 16:9 Thumbnail */}
                <div className="w-full sm:w-44 aspect-video rounded-xl overflow-hidden bg-slate-900 border border-slate-200/80 shrink-0 relative">
                  <Image
                    src={`https://i.ytimg.com/vi/${result.videoId}/hqdefault.jpg`}
                    alt={result.title}
                    fill
                    sizes="(max-width: 640px) 100vw, 176px"
                    referrerPolicy="no-referrer"
                    className="object-cover"
                  />
                  {result.durationSeconds > 0 && (
                    <span className="absolute bottom-2 right-2 bg-black/75 text-white font-mono tabular-nums text-[11px] font-medium px-1.5 py-0.5 rounded z-10">
                      {formatDurationSeconds(result.durationSeconds)}
                    </span>
                  )}
                </div>

                {/* Title & Clean Unboxed Metadata */}
                <div className="flex-1 min-w-0 w-full space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug text-left">
                      {result.title}
                    </h2>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="text-xs font-medium text-slate-500 hover:text-slate-900 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>New Video</span>
                    </button>
                  </div>

                  {/* Clean Metadata Row with typographic separators (zero pills) */}
                  <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-xs text-slate-500">
                    <span className="font-medium text-slate-700">{result.author}</span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">{result.segments.length} segments</span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">{result.wordCount.toLocaleString()} words</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums text-emerald-700 font-medium">
                      Extracted in {formatProcessingDuration(result.processingTimeMs)}
                    </span>
                  </div>

                  {/* Language Switcher (when multiple tracks exist) */}
                  {result.availableLanguages.length > 0 && (
                    <div className="pt-1 flex items-center gap-2 text-xs">
                      <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <label htmlFor="transcript-lang" className="text-slate-500 font-medium">
                        Language:
                      </label>
                      <select
                        id="transcript-lang"
                        value={result.language}
                        disabled={isSwitchingLang}
                        onChange={(e) => handleExtract(result.originalUrl, e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-800 focus:outline-none focus:border-red-600 disabled:opacity-60"
                      >
                        {result.availableLanguages.map((lang) => (
                          <option key={lang.code} value={lang.code}>
                            {lang.name}
                            {lang.isAutoGenerated ? ' (Auto)' : ''}
                          </option>
                        ))}
                      </select>
                      {isSwitchingLang && (
                        <span className="text-slate-400 text-xs">Loading...</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Bar: Copy Transcript + Download Transcript (5 formats) + Timestamp Toggle */}
              <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Copy Transcript Button */}
                  <button
                    type="button"
                    onClick={handleCopyAll}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
                  >
                    {copiedAll ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Copied Transcript!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 shrink-0" />
                        <span>Copy Transcript</span>
                      </>
                    )}
                  </button>

                  {/* Download Transcript Dropdown (5 Formats: .txt, .srt, .vtt, .pdf, .csv) */}
                  <div className="relative" ref={downloadMenuRef}>
                    <button
                      type="button"
                      onClick={() => setIsDownloadMenuOpen((prev) => !prev)}
                      aria-expanded={isDownloadMenuOpen}
                      aria-haspopup="menu"
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2"
                    >
                      <Download className="w-4 h-4 shrink-0" />
                      <span>
                        {lastDownloadedFormat
                          ? `Downloaded .${lastDownloadedFormat.toLowerCase()}`
                          : 'Download Transcript'}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 shrink-0 transition-transform duration-150 ${
                          isDownloadMenuOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    <AnimatePresence>
                      {isDownloadMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 6, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 4, scale: 0.98 }}
                          transition={{ duration: 0.14 }}
                          role="menu"
                          className="absolute left-0 mt-2 w-68 rounded-xl bg-white border border-slate-200 shadow-xl z-30 py-1.5 overflow-hidden"
                        >
                          <div className="px-3.5 py-2 border-b border-slate-100 text-[11px] font-semibold text-slate-500">
                            Choose Export Format (5 Formats)
                          </div>
                          {EXPORT_FORMATS.map((item) => {
                            const Icon = item.icon;
                            return (
                              <button
                                key={item.format}
                                type="button"
                                role="menuitem"
                                onClick={() => handleDownloadFormat(item.format)}
                                className="w-full px-3.5 py-2.5 flex items-center gap-3 text-left hover:bg-slate-50 active:bg-slate-100 transition-colors group"
                              >
                                <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-red-50 flex items-center justify-center shrink-0 transition-colors">
                                  <Icon className="w-4 h-4 text-slate-600 group-hover:text-red-600 transition-colors" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-xs font-bold text-slate-900">
                                      {item.label}
                                    </span>
                                    <span className="font-mono text-[11px] font-semibold text-red-600">
                                      {item.ext}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-500 truncate">
                                    {item.description}
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

                {/* Timestamps Segmented Toggle */}
                <div
                  className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200/70"
                  role="group"
                  aria-label="Timestamp visibility"
                >
                  <button
                    type="button"
                    onClick={() => setIncludeTimestamps(true)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                      includeTimestamps
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    With Timestamps
                  </button>
                  <button
                    type="button"
                    onClick={() => setIncludeTimestamps(false)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                      !includeTimestamps
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Plain Text
                  </button>
                </div>
              </div>
            </div>

            {/* Live Timeline Transcript Card with Built-in Top Search Bar */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-[0_8px_30px_rgba(15,23,42,0.05)] overflow-hidden">
              {/* Top Search & Timeline Control Bar */}
              <div className="px-4 sm:px-5 py-3.5 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
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
                    placeholder="Search keyword in transcript..."
                    aria-label="Search keyword in transcript"
                    className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setFilterMatchesOnly(false);
                        setActiveMatchCursor(0);
                      }}
                      aria-label="Clear keyword search"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-2.5 text-xs">
                  {normalizedQuery ? (
                    <>
                      <span className="font-mono tabular-nums text-slate-600 whitespace-nowrap">
                        {matchingSegmentIndices.length > 0
                          ? `${(activeMatchCursor % matchingSegmentIndices.length) + 1} of ${
                              matchingSegmentIndices.length
                            } matches`
                          : '0 matches'}
                      </span>

                      {matchingSegmentIndices.length > 0 && (
                        <div className="flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden">
                          <button
                            type="button"
                            onClick={() => jumpToMatch('prev')}
                            aria-label="Previous match"
                            className="p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-px h-4 bg-slate-200" />
                          <button
                            type="button"
                            onClick={() => jumpToMatch('next')}
                            aria-label="Next match"
                            className="p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      <div className="inline-flex items-center gap-0.5 p-0.5 bg-slate-200/70 rounded-lg">
                        <button
                          type="button"
                          onClick={() => setFilterMatchesOnly(false)}
                          className={`px-2 py-1 text-[11px] font-medium rounded-md transition-colors whitespace-nowrap ${
                            !filterMatchesOnly
                              ? 'bg-white text-slate-900 shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          All
                        </button>
                        <button
                          type="button"
                          onClick={() => setFilterMatchesOnly(true)}
                          className={`px-2 py-1 text-[11px] font-medium rounded-md transition-colors whitespace-nowrap ${
                            filterMatchesOnly
                              ? 'bg-white text-slate-900 shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Matches
                        </button>
                      </div>
                    </>
                  ) : (
                    <span className="text-slate-500 whitespace-nowrap">
                      Timeline Preview · Click timestamp to copy line
                    </span>
                  )}
                </div>
              </div>

              {/* Scrollable Timeline Segments */}
              <div className="max-h-[540px] overflow-y-auto divide-y divide-slate-100">
                {displayedSegments.length === 0 ? (
                  <div className="py-12 px-6 text-center space-y-2">
                    <p className="text-sm font-medium text-slate-700">
                      No transcript lines match &ldquo;{searchQuery}&rdquo;
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setFilterMatchesOnly(false);
                      }}
                      className="text-xs font-semibold text-red-600 hover:text-red-700 underline underline-offset-4"
                    >
                      Show all {result.segments.length} timeline segments
                    </button>
                  </div>
                ) : (
                  displayedSegments.map(({ seg, originalIdx }) => {
                    const isCurrentActiveMatch =
                      normalizedQuery.length > 0 && originalIdx === activeSegmentOriginalIdx;
                    const isCopiedLine = copiedSegmentIdx === originalIdx;

                    return (
                      <div
                        key={`${seg.startMs}-${originalIdx}`}
                        ref={(el) => {
                          segmentRefs.current[originalIdx] = el;
                        }}
                        className={`flex items-baseline gap-3 sm:gap-5 px-4 sm:px-5 py-3 transition-colors ${
                          isCurrentActiveMatch
                            ? 'bg-red-50/70'
                            : 'hover:bg-slate-50/90'
                        }`}
                      >
                        {includeTimestamps && (
                          <button
                            type="button"
                            onClick={() => handleCopySegment(originalIdx, seg.startMs, seg.text)}
                            title="Copy this timeline line"
                            className="font-mono tabular-nums text-xs font-semibold text-red-600 hover:text-red-700 w-14 sm:w-16 shrink-0 text-left focus:outline-none focus-visible:underline"
                          >
                            {isCopiedLine ? (
                              <span className="text-emerald-600 font-sans">Copied</span>
                            ) : (
                              formatDisplayTimestamp(seg.startMs)
                            )}
                          </button>
                        )}

                        <p className="flex-1 text-sm sm:text-[15px] leading-relaxed text-slate-800 text-left">
                          {renderHighlightedText(seg.text, isCurrentActiveMatch)}
                        </p>
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
