'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Clipboard,
  X,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Video,
  Film,
  Zap,
} from 'lucide-react';
import { SkeletonLoader } from './SkeletonLoader';
import { ResultCard, VideoData } from './ResultCard';

interface VideoFetcherProps {
  onRecordDownload: (quality: string) => void;
  onAddHistory: (item: VideoData) => void;
}

const SAMPLE_LINKS = [
  {
    label: '4K Nature Reel',
    icon: Film,
    url: 'https://www.facebook.com/reel/10892347891234',
  },
  {
    label: 'AI Robotics Demo',
    icon: Zap,
    url: 'https://www.facebook.com/watch/?v=987654321098',
  },
  {
    label: 'Coastal Travel Vlog',
    icon: Video,
    url: 'https://www.facebook.com/share/v/876543210987/',
  },
];

export const VideoFetcher: React.FC<VideoFetcherProps> = ({
  onRecordDownload,
  onAddHistory,
}) => {
  const [url, setUrl] = useState('');
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [resultData, setResultData] = useState<VideoData | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text.trim());
        setErrorMessage('');
      }
    } catch {
      // Fallback focus input
      inputRef.current?.focus();
    }
  };

  const handleClear = () => {
    setUrl('');
    setErrorMessage('');
    inputRef.current?.focus();
  };

  const handleSampleClick = (sampleUrl: string) => {
    setUrl(sampleUrl);
    setErrorMessage('');
    handleFetch(sampleUrl);
  };

  const handleFetch = async (targetUrl?: string) => {
    const linkToFetch = (targetUrl || url).trim();

    if (!linkToFetch) {
      setErrorMessage('Please paste or enter a Facebook video link first.');
      inputRef.current?.focus();
      return;
    }

    setErrorMessage('');
    setState('loading');
    setResultData(null);

    try {
      const res = await fetch('/api/fetch-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: linkToFetch }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Unable to fetch video. Please check your link.');
      }

      // Smooth state transition with brief artificial delay for smooth 60fps skeleton display
      setTimeout(() => {
        setResultData(json.data);
        setState('success');
        onAddHistory(json.data);
      }, 750);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch Facebook video.';
      setErrorMessage(msg);
      setState('error');
    }
  };

  const handleReset = () => {
    setState('idle');
    setResultData(null);
    setErrorMessage('');
  };

  return (
    <section className="w-full max-w-3xl mx-auto text-center pt-8 sm:pt-14 pb-12 px-4">
      {/* Hero Section Header */}
      <div className="space-y-4 mb-8 sm:mb-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1877F2]/10 dark:bg-[#1877F2]/20 border border-[#1877F2]/20 text-[#1877F2] text-xs font-semibold tracking-wide">
          <Sparkles className="w-3.5 h-3.5" />
          <span>No Ads · HD 1080p & MP3 Downloads</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.1] text-balance">
          Download Facebook Videos{' '}
          <span className="bg-gradient-to-r from-[#1877F2] to-cyan-500 bg-clip-text text-transparent">
            Instantly
          </span>
        </h1>

        <p className="max-w-xl mx-auto text-sm sm:text-base text-slate-600 dark:text-slate-400 font-normal leading-relaxed">
          Paste any public Facebook video, reel, or watch link below to download high-definition MP4 videos or MP3 audio with 60fps speed.
        </p>
      </div>

      {/* Central Input Box */}
      <div className="w-full max-w-2xl mx-auto space-y-4">
        <div className="relative group">
          {/* Subtle glowing halo backdrop on focus/hover */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#1877F2] via-emerald-500 to-cyan-500 rounded-2xl blur-sm opacity-25 group-hover:opacity-40 transition duration-300 transform-gpu" />

          <div className="relative flex items-center bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl shadow-slate-900/5 transition-all duration-200 focus-within:ring-2 focus-within:ring-[#1877F2] focus-within:border-transparent">
            {/* Input Field */}
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
                  handleFetch();
                }
              }}
              placeholder="Paste your Facebook video link here..."
              className="w-full py-4 pl-5 pr-24 bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm sm:text-base font-normal rounded-2xl focus:outline-none"
            />

            {/* Right Action Icons (Clear & Paste) */}
            <div className="absolute right-3 flex items-center gap-1.5">
              {url && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  aria-label="Clear input"
                  title="Clear text"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {/* Active Paste Button */}
              <button
                type="button"
                onClick={handlePaste}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 font-medium text-xs transition-colors border border-slate-200/80 dark:border-slate-700/80 shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1877F2]"
                title="Paste link from clipboard"
              >
                <Clipboard className="w-3.5 h-3.5 text-[#1877F2]" />
                <span className="hidden sm:inline">Paste</span>
              </button>
            </div>
          </div>
        </div>

        {/* Prominent Glowing "Fetch Video" Button */}
        <button
          type="button"
          onClick={() => handleFetch()}
          disabled={state === 'loading'}
          className="w-full group relative overflow-hidden bg-[#1877F2] hover:bg-[#166fe5] active:bg-[#1565d8] text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-[#1877F2]/30 hover:shadow-xl hover:shadow-[#1877F2]/40 transform-gpu hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2.5 text-base sm:text-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#1877F2] disabled:opacity-75 disabled:cursor-not-allowed disabled:transform-none"
        >
          {state === 'loading' ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Fetching Video...</span>
            </>
          ) : (
            <>
              <span>Fetch Video</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>

        {/* Error Feedback Message */}
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-2 text-xs font-medium text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50 p-3 rounded-xl"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </motion.div>
        )}

        {/* Sample Links Quick Bar for instant 1-click test drive */}
        <div className="pt-2 flex flex-col items-center gap-2">
          <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
            Or try a quick sample link:
          </span>
          <div className="flex items-center justify-center flex-wrap gap-2">
            {SAMPLE_LINKS.map((sample, idx) => {
              const IconComp = sample.icon;
              return (
                <button
                  key={idx}
                  onClick={() => handleSampleClick(sample.url)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 hover:text-[#1877F2] dark:hover:text-[#1877F2] hover:border-[#1877F2]/40 transition-all transform-gpu hover:scale-105"
                >
                  <IconComp className="w-3 h-3 text-[#1877F2]" />
                  <span>{sample.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Smooth State Change Display: Skeleton Loader vs Result Card */}
      <AnimatePresence mode="wait">
        {state === 'loading' && <SkeletonLoader key="skeleton" />}

        {state === 'success' && resultData && (
          <ResultCard
            key="result"
            data={resultData}
            onReset={handleReset}
            onRecordDownload={onRecordDownload}
          />
        )}
      </AnimatePresence>
    </section>
  );
};
