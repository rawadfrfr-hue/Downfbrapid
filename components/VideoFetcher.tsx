'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { Clipboard, X, Download, AlertCircle } from 'lucide-react';
import { SkeletonLoader } from './SkeletonLoader';
import { ResultCard, VideoData } from './ResultCard';
import { PagePlatform } from '@/lib/platforms';
import { getLocalizedPlatformConfig } from '@/lib/platforms-bn';
import { Locale, getLocalizedPath } from '@/lib/i18n';
import type { CmsPageContentRecord } from '@/lib/cms-types';

interface VideoFetcherProps {
  platform?: PagePlatform;
  locale?: Locale;
  cmsContent?: CmsPageContentRecord;
  onRecordDownload: (quality: string) => void;
  onAddHistory: (item: VideoData) => void;
}

function localizeFetchError(rawMessage: string, platformName: string, isBn: boolean): string {
  if (!isBn) return rawMessage;
  const lower = rawMessage.toLowerCase();
  if (lower.includes('private') || lower.includes('login') || lower.includes('friends')) {
    return 'এই ভিডিওটি প্রাইভেট বা লগইন-সীমাবদ্ধ। শুধুমাত্র পাবলিক ভিডিওর লিংক ব্যবহার করুন।';
  }
  if (lower.includes('valid') && lower.includes('url')) {
    return `অনুগ্রহ করে একটি সঠিক ${platformName} ভিডিওর লিংক পেস্ট করুন।`;
  }
  if (lower.includes('not found') || lower.includes('unavailable')) {
    return 'ভিডিওটি খুঁজে পাওয়া যায়নি বা মুছে ফেলা হয়েছে। অনুগ্রহ করে অন্য একটি পাবলিক লিংক চেষ্টা করুন।';
  }
  if (lower.includes('rate') || lower.includes('too many') || lower.includes('429')) {
    return 'অতিরিক্ত অনুরোধের কারণে সাময়িক বিলম্ব হচ্ছে। কয়েক সেকেন্ড পর আবার চেষ্টা করুন।';
  }
  return `${platformName} ভিডিও লিংক প্রসেস করা যায়নি। অনুগ্রহ করে লিংকটি যাচাই করে আবার চেষ্টা করুন।`;
}

export const VideoFetcher: React.FC<VideoFetcherProps> = ({
  platform = 'home',
  locale = 'en',
  cmsContent,
  onRecordDownload,
  onAddHistory,
}) => {
  const isBn = locale === 'bn';
  const baseConfig = getLocalizedPlatformConfig(platform, locale === 'bn' ? 'bn' : 'en');
  const platformConfig = cmsContent
    ? {
        ...baseConfig,
        heroTitle: cmsContent.heroTitle || baseConfig.heroTitle,
        heroSubtitle: cmsContent.heroSubtitle || baseConfig.heroSubtitle,
        placeholder: cmsContent.placeholder || baseConfig.placeholder,
      }
    : baseConfig;
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
      setErrorMessage(
        isBn
          ? platform === 'home'
            ? 'অনুগ্রহ করে একটি সঠিক ফেসবুক, ইউটিউব, ইনস্টাগ্রাম বা টিকটক ভিডিও লিংক পেস্ট করুন।'
            : `অনুগ্রহ করে একটি সঠিক ${platformConfig.name} ভিডিওর লিংক দিন।`
          : platform === 'home'
          ? 'Please paste a valid Facebook, YouTube, Instagram, or TikTok video link.'
          : `Please paste or enter a valid ${platformConfig.name} video link.`
      );
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
          locale,
          isDemo: isDemoFlag || false,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        const rawErr =
          json.error || `Unable to download ${platformConfig.name} video. Please check your link.`;
        throw new Error(localizeFetchError(rawErr, platformConfig.name, isBn));
      }

      setResultData(json.data);
      setState('success');
      onAddHistory(json.data);
    } catch (err: unknown) {
      const rawMsg =
        err instanceof Error
          ? err.message
          : `Failed to process ${platformConfig.name} video link.`;
      setErrorMessage(
        isBn && !/[\u0980-\u09FF]/.test(rawMsg)
          ? localizeFetchError(rawMsg, platformConfig.name, true)
          : rawMsg
      );
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
        {/* Top Feature Image Banner with explicit width/height to prevent CLS */}
        <div className="flex justify-center mb-1">
          <Image
            src="/assets/aistudio/bnrsavevibe_b7be51c6.svg"
            alt={
              isBn
                ? 'Save Vibe সোশ্যাল মিডিয়া ভিডিও ডাউনলোডার ব্যানার'
                : 'Save Vibe Social Media Video Downloader Banner'
            }
            width={1017}
            height={245}
            priority
            referrerPolicy="no-referrer"
            className="w-[280px] sm:w-[360px] md:w-[420px] h-auto object-contain mx-auto transition-transform duration-300 hover:scale-102"
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
              aria-label={platformConfig.placeholder}
              className="w-full py-4 pl-4 pr-24 bg-transparent text-slate-900 placeholder:text-slate-400 text-sm sm:text-base font-normal rounded-xl focus:outline-none"
            />

            {/* Clear & Paste Actions */}
            <div className="absolute right-3 flex items-center gap-1.5">
              {url && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                  aria-label={isBn ? 'লিংক মুছে ফেলুন' : 'Clear input'}
                  title={isBn ? 'মুছে ফেলুন' : 'Clear text'}
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={handlePaste}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium text-xs transition-colors border border-slate-200/80 shadow-2xs focus:outline-none focus-visible:ring-2"
                title={isBn ? 'ক্লিপবোর্ড থেকে পেস্ট করুন' : 'Paste link from clipboard'}
              >
                <Clipboard className={`w-3.5 h-3.5 ${platformConfig.iconColor}`} />
                <span className="hidden sm:inline">{isBn ? 'পেস্ট করুন' : 'Paste'}</span>
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
              <span>{isBn ? 'লিংক প্রসেস হচ্ছে...' : 'Processing Link...'}</span>
            </>
          ) : (
            <>
              <Download className="w-5 h-5 text-white" />
              <span>{isBn ? 'ডাউনলোড করুন' : 'Download'}</span>
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

        {(platformConfig.id === 'youtube' || platformConfig.id === 'home') && (
          <p className="text-xs text-slate-500 pt-1">
            {isBn ? 'সাবটাইটেল বা সার্চযোগ্য টেক্সট দরকার? ' : 'Need subtitles or searchable text? '}
            <Link
              href={getLocalizedPath('/youtube-transcript', locale)}
              className="font-semibold text-red-600 hover:text-red-700 underline underline-offset-4"
            >
              {isBn
                ? 'ইউটিউব ট্রান্সক্রিপ্ট ডাউনলোডার খুলুন'
                : 'Open YouTube Transcript Downloader'}
            </Link>
          </p>
        )}
      </div>

      {/* Dynamic Results Display */}
      <AnimatePresence mode="wait">
        {state === 'loading' && <SkeletonLoader key="skeleton" locale={locale} />}

        {state === 'success' && resultData && (
          <ResultCard
            key="result"
            data={resultData}
            platform={platform}
            locale={locale}
            onReset={handleReset}
            onRecordDownload={onRecordDownload}
          />
        )}
      </AnimatePresence>
    </section>
  );
};
