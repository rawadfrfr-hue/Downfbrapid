'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clipboard, X, Download, AlertCircle } from 'lucide-react';
import { SkeletonLoader } from './SkeletonLoader';
import { ResultCard, VideoData } from './ResultCard';
import { PLATFORMS, PlatformType } from '@/lib/platforms';

interface VideoFetcherProps {
  platform?: PlatformType;
  onRecordDownload: (quality: string) => void;
  onAddHistory: (item: VideoData) => void;
}

export const VideoFetcher: React.FC<VideoFetcherProps> = ({
  platform = 'facebook',
  onRecordDownload,
  onAddHistory,
}) => {
  const platformConfig = PLATFORMS[platform] || PLATFORMS.facebook;
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
      inputRef.current?.focus();
    }
  };

  const handleClear = () => {
    setUrl('');
    setErrorMessage('');
    inputRef.current?.focus();
  };

  const handleFetch = async (targetUrl?: string, isDemoFlag?: boolean) => {
    const linkToFetch = (targetUrl || url).trim();

    if (!linkToFetch) {
      setErrorMessage(`Please paste or enter a valid ${platformConfig.name} video link.`);
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
        body: JSON.stringify({
          url: linkToFetch,
          platform: platformConfig.id,
          isDemo: isDemoFlag || false,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || `Unable to download ${platformConfig.name} video. Please check your link.`);
      }

      setTimeout(() => {
        setResultData(json.data);
        setState('success');
        onAddHistory(json.data);
      }, 650);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : `Failed to process ${platformConfig.name} video link.`;
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
    <section className="w-full max-w-3xl mx-auto text-center pt-6 sm:pt-10 pb-8 px-4">
      {/* Hero Header Section */}
      <div className="space-y-4 mb-8 sm:mb-9">
        {/* Top Feature Image Banner (Same SVG file across all platform pages) */}
        <div className="flex justify-center mb-1">
          <img
            src="/assets/aistudio/bnrsavevibe_b7be51c6.svg"
            alt="SaveVibe Feature Banner"
            className="max-w-[280px] sm:max-w-[360px] md:max-w-[420px] h-auto object-contain mx-auto transition-transform duration-300 hover:scale-102"
          />
        </div>

        {/* Platform Specific Headline */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.12] text-balance">
          {platformConfig.heroTitle}
        </h1>

        <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-600 font-normal leading-relaxed">
          {platformConfig.heroSubtitle}
        </p>
      </div>

      {/* Central Input Form & Download Action */}
      <div className="w-full max-w-2xl mx-auto space-y-3.5">
        <div className="relative">
          <div
            className={`relative flex items-center bg-white border border-slate-200 rounded-xl shadow-xs hover:shadow-sm focus-within:shadow-md transition-all duration-200 ${platformConfig.focusBorder}`}
          >
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
              placeholder={platformConfig.placeholder}
              className="w-full py-4 pl-4 pr-24 bg-transparent text-slate-900 placeholder:text-slate-400 text-sm sm:text-base font-normal rounded-xl focus:outline-none"
            />

            {/* Clear & Paste Actions */}
            <div className="absolute right-3 flex items-center gap-1.5">
              {url && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                  aria-label="Clear input"
                  title="Clear text"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={handlePaste}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium text-xs transition-colors border border-slate-200/80 shadow-2xs focus:outline-none focus-visible:ring-2"
                title="Paste link from clipboard"
              >
                <Clipboard className={`w-3.5 h-3.5 ${platformConfig.iconColor}`} />
                <span className="hidden sm:inline">Paste</span>
              </button>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={() => handleFetch()}
          disabled={state === 'loading'}
          className={`w-full group relative overflow-hidden text-white font-bold py-3.5 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2.5 text-base focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-75 disabled:cursor-not-allowed ${platformConfig.buttonBg}`}
        >
          {state === 'loading' ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Processing Link...</span>
            </>
          ) : (
            <>
              <Download className="w-5 h-5 text-white" />
              <span>Download</span>
            </>
          )}
        </button>

        {/* Error Feedback Message */}
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-2 text-xs font-medium text-rose-600 bg-rose-50 border border-rose-200 p-3 rounded-xl"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </motion.div>
        )}
      </div>

      {/* Dynamic Results Display */}
      <AnimatePresence mode="wait">
        {state === 'loading' && <SkeletonLoader key="skeleton" />}

        {state === 'success' && resultData && (
          <ResultCard
            key="result"
            data={resultData}
            platform={platform}
            onReset={handleReset}
            onRecordDownload={onRecordDownload}
          />
        )}
      </AnimatePresence>
    </section>
  );
};
