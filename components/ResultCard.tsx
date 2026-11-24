'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowDown,
  Play,
  Check,
  Copy,
  RefreshCw,
  X,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import { PLATFORMS, PagePlatform, PlatformType } from '@/lib/platforms';
import { mergeVideoAndAudioInBrowser, MergeProgress } from '@/lib/client-ffmpeg';
import type { Locale } from '@/lib/i18n';

export interface QualityItem {
  id: string;
  quality: string;
  label: string;
  sublabel: string;
  url: string;
  downloadUrl: string;
  qualityLabel: string;
  format: string;
  badge?: string;
  requiresClientMerge?: boolean;
  videoUrl?: string;
  audioUrl?: string;
  vcodec?: string;
  acodec?: string;
  videoExt?: string;
  audioExt?: string;
}

export interface QualityInfo {
  quality: string;
  url: string;
  downloadUrl: string;
  size: string;
  format: string;
  requiresClientMerge?: boolean;
  videoUrl?: string;
  audioUrl?: string;
  vcodec?: string;
  acodec?: string;
  videoExt?: string;
  audioExt?: string;
}

export interface VideoData {
  id: string;
  originalUrl: string;
  title: string;
  author: string;
  views: string;
  duration: string;
  thumbnail: string;
  platform?: string;
  isSingleQuality?: boolean;
  previewUrl?: string;
  bestVideoUrl?: string;
  bestAudioUrl?: string | null;
  qualityList?: QualityItem[];
  qualities: {
    hd: QualityInfo;
    sd?: QualityInfo;
    audio?: QualityInfo;
  };
}

interface DownloadOption {
  type: string;
  mainTitle: string;
  subDetails: string;
  downloadUrl: string;
  qualityLabel: string;
  format: string;
  requiresClientMerge?: boolean;
  videoUrl?: string;
  audioUrl?: string;
  vcodec?: string;
  acodec?: string;
  videoExt?: string;
  audioExt?: string;
}

interface ResultCardProps {
  data: VideoData;
  platform?: PagePlatform;
  locale?: Locale;
  onReset: () => void;
  onRecordDownload: (quality: string) => void;
}

function getNowMs(): number {
  return Date.now();
}

function hasActiveUserGesture(startedAtMs: number): boolean {
  if (typeof navigator !== 'undefined' && 'userActivation' in navigator) {
    const ua = (navigator as Navigator & { userActivation?: { isActive?: boolean } }).userActivation;
    if (ua && typeof ua.isActive === 'boolean') {
      return ua.isActive;
    }
  }
  return getNowMs() - startedAtMs < 1500;
}

function triggerFileDownload(href: string, filename: string): void {
  const isBlobUrl = href.startsWith('blob:');
  const isBackendAttachment =
    href.startsWith('/') ||
    href.includes('/api/merge') ||
    href.includes('/api/proxy') ||
    href.includes('/api/download');

  const a = document.createElement('a');
  a.href = href;
  if (!isBlobUrl && !isBackendAttachment) {
    a.target = '_blank';
  }
  a.rel = 'noopener noreferrer';
  if (isBlobUrl) {
    a.setAttribute('download', filename);
  }
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    a.remove();
  }, 1500);
}

export const ResultCard: React.FC<ResultCardProps> = ({
  data,
  platform = 'facebook',
  locale = 'en',
  onReset,
  onRecordDownload,
}) => {
  const isBn = locale === 'bn';
  const detectedFromData = data.platform?.toLowerCase() as PlatformType | undefined;
  const resolvedPlatform: PlatformType =
    detectedFromData && detectedFromData in PLATFORMS
      ? detectedFromData
      : platform !== 'home'
      ? platform
      : 'facebook';
  const platformConfig = PLATFORMS[resolvedPlatform] || PLATFORMS.facebook;
  const [copiedLink, setCopiedLink] = useState(false);
  const [downloadingType, setDownloadingType] = useState<string | null>(null);
  const [mergeProgress, setMergeProgress] = useState<MergeProgress | null>(null);
  const [mergeError, setMergeError] = useState<string | null>(null);
  const [mergedBlobs, setMergedBlobs] = useState<Record<string, { url: string; filename: string }>>({});
  const [preparedDownloads, setPreparedDownloads] = useState<Record<string, string>>({});
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const mergedBlobUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    const urls = mergedBlobUrlsRef.current;
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, []);

  const isTikTok = platform === 'tiktok' || data.platform === 'TikTok';

  const getOptionTarget = (opt: DownloadOption) => {
    const formatExt = opt.format || 'mp4';
    const cleanExt = formatExt.toLowerCase().replace(/[^a-z0-9]/g, '') || 'mp4';
    const safeExt = `.${cleanExt}`;
    const cleanTitle = data.title.replace(/[^\w.\-]/g, '_').slice(0, 30) || 'SaveVibe_Media';
    const targetFilename = `${cleanTitle}_${opt.type}${safeExt}`;

    const fallbackDirectUrl =
      opt.type === 'hd'
        ? data.qualities.hd.url
        : opt.type === 'sd'
        ? data.qualities.sd?.url || data.qualities.hd.url
        : opt.type === 'audio'
        ? data.qualities.audio?.url || data.qualities.hd.url
        : data.qualities.hd.url;

    const rawTargetUrl = opt.downloadUrl || fallbackDirectUrl;
    const isAlreadyProxiedOrMerged =
      rawTargetUrl.startsWith('/api/') ||
      rawTargetUrl.includes('/api/merge') ||
      rawTargetUrl.includes('/api/proxy') ||
      rawTargetUrl.includes('/api/download');

    const finalDownloadUrl =
      !isAlreadyProxiedOrMerged && /^https?:\/\//i.test(rawTargetUrl)
        ? `/api/download?url=${encodeURIComponent(rawTargetUrl)}&filename=${encodeURIComponent(targetFilename)}&dl=1`
        : rawTargetUrl;

    return {
      cleanTitle,
      targetFilename,
      finalDownloadUrl,
    };
  };

  const handleDownload = async (opt: DownloadOption) => {
    const {
      type,
      qualityLabel,
      requiresClientMerge,
      videoUrl,
      audioUrl,
      vcodec,
      acodec,
      videoExt,
      audioExt,
    } = opt;

    const { cleanTitle, targetFilename, finalDownloadUrl } = getOptionTarget(opt);

    setMergeError(null);
    setDownloadingType(type);
    const startedAt = getNowMs();

    // Server-side FFmpeg merge path: prepare via /api/merge/prepare first so browser never hangs on a spinning redirect
    if (!requiresClientMerge && finalDownloadUrl.includes('/api/merge?')) {
      const alreadyPrepared = preparedDownloads[type];
      if (alreadyPrepared) {
        onRecordDownload(qualityLabel);
        triggerFileDownload(alreadyPrepared, targetFilename);
        setTimeout(() => setDownloadingType(null), 600);
        return;
      }

      try {
        setMergeProgress({
          stage: 'merging',
          percent: 35,
          message: isBn
            ? 'HD ভিডিও এবং অডিও প্রস্তুত ও মার্জ হচ্ছে...'
            : 'Preparing & merging HD video + audio...',
        });

        const prepareUrl = finalDownloadUrl
          .replace('/api/merge?', '/api/merge/prepare?')
          .replace(/&dl=\d+/, '');

        const prepRes = await fetch(prepareUrl, {
          method: 'POST',
          cache: 'no-store',
        });

        const prepJson = await prepRes.json().catch(() => null);
        if (!prepRes.ok || !prepJson?.success) {
          throw new Error(
            isBn
              ? 'ভিডিও ডাউনলোড প্রস্তুত করা যায়নি। অনুগ্রহ করে লিংকটি আবার দিন।'
              : prepJson?.detail ||
                  prepJson?.error ||
                  'Failed to prepare video download. Please fetch the video link again.'
          );
        }

        setMergeProgress({
          stage: 'saving',
          percent: 100,
          message: isBn ? 'প্রস্তুত — ডাউনলোড শুরু হচ্ছে...' : 'Ready — starting download...',
        });

        setPreparedDownloads((prev) => ({
          ...prev,
          [type]: finalDownloadUrl,
        }));

        onRecordDownload(qualityLabel);
        triggerFileDownload(finalDownloadUrl, targetFilename);
      } catch (err: unknown) {
        // Fallback to direct anchor trigger only on pure network/CORS error (not backend 4xx/5xx error)
        if (err instanceof TypeError) {
          onRecordDownload(qualityLabel);
          triggerFileDownload(finalDownloadUrl, targetFilename);
        } else {
          const msg = isBn
            ? 'ভিডিও ডাউনলোড প্রস্তুত করা যায়নি। অনুগ্রহ করে লিংকটি আবার যাচাই করুন।'
            : err instanceof Error
            ? err.message
            : 'Failed to prepare video download. Please fetch the link again.';
          setMergeError(msg);
        }
      } finally {
        setMergeProgress(null);
        setDownloadingType(null);
      }
      return;
    }

    // Client-side merging path using ffmpeg.wasm (fallback when server FFmpeg is unavailable)
    if (requiresClientMerge && videoUrl && audioUrl) {
      const cachedBlob = mergedBlobs[type];
      if (cachedBlob) {
        onRecordDownload(qualityLabel);
        triggerFileDownload(cachedBlob.url, cachedBlob.filename);
        setTimeout(() => setDownloadingType(null), 600);
        return;
      }

      try {
        setMergeProgress({
          stage: 'loading',
          percent: 5,
          message: isBn ? 'ব্রাউজার FFmpeg প্রস্তুত হচ্ছে...' : 'Preparing browser FFmpeg...',
        });

        const { blob, ext: mergedExt } = await mergeVideoAndAudioInBrowser({
          videoUrl,
          audioUrl,
          filename: targetFilename,
          vcodec,
          acodec,
          videoExt,
          audioExt,
          onProgress: (progress) => setMergeProgress(progress),
        });

        const finalFilename = `${cleanTitle}_${type}.${mergedExt}`;
        const blobUrl = URL.createObjectURL(blob);
        mergedBlobUrlsRef.current.push(blobUrl);
        setMergedBlobs((prev) => ({
          ...prev,
          [type]: { url: blobUrl, filename: finalFilename },
        }));

        onRecordDownload(qualityLabel);
        if (hasActiveUserGesture(startedAt)) {
          triggerFileDownload(blobUrl, finalFilename);
        }
      } catch (err: unknown) {
        const msg = isBn
          ? 'ব্রাউজারে ভিডিও মার্জ করা যায়নি। অনুগ্রহ করে লিংকটি আবার দিন।'
          : err instanceof Error
          ? err.message
          : 'Browser merge failed. Please try fetching the video link again.';
        setMergeError(msg);
      } finally {
        setMergeProgress(null);
        setDownloadingType(null);
      }
      return;
    }

    onRecordDownload(qualityLabel);
    triggerFileDownload(finalDownloadUrl, targetFilename);

    setTimeout(() => {
      setMergeProgress(null);
      setDownloadingType(null);
    }, 500);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(data.originalUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const fallbackOptions: DownloadOption[] = isTikTok
    ? [
        {
          type: 'sd',
          mainTitle: isBn
            ? 'স্ট্যান্ডার্ড কোয়ালিটি (ওয়াটারমার্ক ছাড়া)'
            : 'Standard quality (without watermark)',
          subDetails: isBn
            ? `MP4 • ওয়াটারমার্ক-মুক্ত • ${data.qualities.sd?.size || 'স্ট্যান্ডার্ড MP4'}`
            : `MP4 • Watermark-Free • ${data.qualities.sd?.size || 'Standard MP4'}`,
          downloadUrl: data.qualities.sd?.downloadUrl || data.qualities.hd.downloadUrl,
          qualityLabel: 'Standard quality (without watermark)',
          format: data.qualities.sd?.format || 'MP4',
          requiresClientMerge: data.qualities.sd?.requiresClientMerge,
          videoUrl: data.qualities.sd?.videoUrl,
          audioUrl: data.qualities.sd?.audioUrl,
          vcodec: data.qualities.sd?.vcodec,
          acodec: data.qualities.sd?.acodec,
          videoExt: data.qualities.sd?.videoExt,
          audioExt: data.qualities.sd?.audioExt,
        },
        {
          type: 'hd',
          mainTitle: isBn
            ? 'উচ্চ মানের HD (ওয়াটারমার্ক ছাড়া)'
            : 'High quality (without watermark)',
          subDetails: isBn
            ? `MP4 • ওয়াটারমার্ক-মুক্ত • ${data.qualities.hd.size || 'HD MP4'}`
            : `MP4 • Watermark-Free • ${data.qualities.hd.size || 'HD MP4'}`,
          downloadUrl: data.qualities.hd.downloadUrl,
          qualityLabel: 'High quality (without watermark)',
          format: data.qualities.hd.format || 'MP4',
          requiresClientMerge: data.qualities.hd.requiresClientMerge,
          videoUrl: data.qualities.hd.videoUrl,
          audioUrl: data.qualities.hd.audioUrl,
          vcodec: data.qualities.hd.vcodec,
          acodec: data.qualities.hd.acodec,
          videoExt: data.qualities.hd.videoExt,
          audioExt: data.qualities.hd.audioExt,
        },
      ]
    : [
        {
          type: 'hd',
          mainTitle: isBn
            ? 'উচ্চ মানের কোয়ালিটি (HD)'
            : data.qualities.hd.quality || 'High Quality',
          subDetails: `${data.qualities.hd.format || 'MP4'} • ${data.qualities.hd.size}`,
          downloadUrl: data.qualities.hd.downloadUrl,
          qualityLabel: data.qualities.hd.quality || 'High Quality',
          format: data.qualities.hd.format || 'MP4',
          requiresClientMerge: data.qualities.hd.requiresClientMerge,
          videoUrl: data.qualities.hd.videoUrl,
          audioUrl: data.qualities.hd.audioUrl,
          vcodec: data.qualities.hd.vcodec,
          acodec: data.qualities.hd.acodec,
          videoExt: data.qualities.hd.videoExt,
          audioExt: data.qualities.hd.audioExt,
        },
        ...(data.qualities.sd?.downloadUrl
          ? [
              {
                type: 'sd',
                mainTitle: isBn
                  ? 'স্ট্যান্ডার্ড কোয়ালিটি (SD)'
                  : data.qualities.sd.quality || 'Standard Quality',
                subDetails: `${data.qualities.sd.format || 'MP4'} • ${data.qualities.sd.size}`,
                downloadUrl: data.qualities.sd.downloadUrl,
                qualityLabel: data.qualities.sd.quality || 'Standard Quality',
                format: data.qualities.sd.format || 'MP4',
                requiresClientMerge: data.qualities.sd.requiresClientMerge,
                videoUrl: data.qualities.sd.videoUrl,
                audioUrl: data.qualities.sd.audioUrl,
                vcodec: data.qualities.sd.vcodec,
                acodec: data.qualities.sd.acodec,
                videoExt: data.qualities.sd.videoExt,
                audioExt: data.qualities.sd.audioExt,
              },
            ]
          : []),
        ...(data.qualities.audio?.downloadUrl
          ? [
              {
                type: 'audio',
                mainTitle: isBn
                  ? `${data.qualities.audio.format || 'M4A'} (শুধুমাত্র অডিও)`
                  : `${data.qualities.audio.format || 'M4A'} (Audio Only)`,
                subDetails: isBn
                  ? `${data.qualities.audio.format || 'M4A'} • অডিও ট্র্যাক • ${data.qualities.audio.size}`
                  : `${data.qualities.audio.format || 'M4A'} • Audio Track • ${data.qualities.audio.size}`,
                downloadUrl: data.qualities.audio.downloadUrl,
                qualityLabel: 'Audio Only',
                format: data.qualities.audio.format || 'M4A',
              },
            ]
          : []),
      ];

  const effectiveQualityList = data.qualityList;

  const downloadOptions: DownloadOption[] =
    effectiveQualityList && effectiveQualityList.length > 0
      ? effectiveQualityList.map((item) => {
          const formatText = item.format || (item.id === 'audio' ? 'M4A' : 'MP4');
          let mainTitle = '';
          if (isTikTok) {
            if (isBn && item.id === 'hd') mainTitle = 'উচ্চ মানের HD (ওয়াটারমার্ক ছাড়া)';
            else if (isBn && item.id === 'sd') mainTitle = 'স্ট্যান্ডার্ড কোয়ালিটি (ওয়াটারমার্ক ছাড়া)';
            else mainTitle = item.label;
          }
          else if (item.id === '2160p') mainTitle = '2160p (4K Ultra HD)';
          else if (item.id === '1440p') mainTitle = '1440p (2K Quad HD)';
          else if (item.id === '1080p') mainTitle = '1080p (Full HD)';
          else if (item.id === '720p') mainTitle = '720p (HD)';
          else if (item.id === '540p') mainTitle = '540p (SD)';
          else if (item.id === '480p') mainTitle = '480p (SD)';
          else if (item.id === '360p') mainTitle = isBn ? '360p (স্ট্যান্ডার্ড)' : '360p (Standard)';
          else if (item.id === '240p') mainTitle = isBn ? '240p (লো কোয়ালিটি)' : '240p (Low)';
          else if (item.id === '144p') mainTitle = isBn ? '144p (ডেটা সেভার)' : '144p (Data Saver)';
          else if (item.id === 'audio') mainTitle = isBn ? `${formatText} (শুধুমাত্র অডিও)` : `${formatText} (Audio Only)`;
          else mainTitle = item.label;

          let cleanSub = item.sublabel;
          cleanSub = cleanSub.replace(/^MP\d\s*•?\s*/i, '');
          cleanSub = cleanSub.replace(/\(([^)]+)\)/, '• $1');

          return {
            type: item.id,
            mainTitle,
            subDetails: `${formatText} • ${cleanSub}`,
            downloadUrl: item.downloadUrl,
            qualityLabel: item.qualityLabel,
            format: formatText,
            requiresClientMerge: item.requiresClientMerge,
            videoUrl: item.videoUrl,
            audioUrl: item.audioUrl,
            vcodec: item.vcodec,
            acodec: item.acodec,
            videoExt: item.videoExt,
            audioExt: item.audioExt,
          };
        })
      : fallbackOptions;

  const firstMergedBlob = Object.values(mergedBlobs)[0]?.url;
  const isNonMergeUrl = (url?: string) => Boolean(url && !url.includes('/api/merge'));
  const previewVideoSrc =
    firstMergedBlob ||
    (isNonMergeUrl(data.previewUrl) ? data.previewUrl : undefined) ||
    (isNonMergeUrl(data.qualities.sd?.url) && !data.qualities.sd?.requiresClientMerge
      ? data.qualities.sd?.url
      : undefined) ||
    (isNonMergeUrl(data.qualities.hd.url) && !data.qualities.hd.requiresClientMerge
      ? data.qualities.hd.url
      : undefined);
  const canPreviewVideo = Boolean(previewVideoSrc);
  const isPreviewVideoOnly = false;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.98 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-xl mx-auto mt-6 p-5 sm:p-7 rounded-2xl bg-white border border-slate-200/80 shadow-[0_8px_30px_rgba(15,23,42,0.06)] text-slate-900 transition-all"
    >
      {/* Top Header Row */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-sans">
          {isBn ? 'ডাউনলোড কোয়ালিটি নির্বাচন করুন' : 'Download Quality Selection'}
        </span>
        <button
          onClick={onReset}
          className="text-xs font-medium text-slate-500 hover:text-slate-900 flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-slate-100 transition-colors font-sans"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          {isBn ? 'আরেকটি লিংক দিন' : 'Fetch Another'}
        </button>
      </div>

      {/* 1. Video Preview Thumbnail */}
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-950 group shadow-2xs border border-slate-100">
        <img
          src={data.thumbnail}
          alt={data.title}
          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500 ease-out"
          referrerPolicy="no-referrer"
        />

        {/* Soft overlay */}
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/35 transition-colors" />

        {/* Minimalist Centered Semi-Transparent Play Button (only when a lightweight non-merge preview exists) */}
        {canPreviewVideo && (
          <button
            onClick={() => setIsPreviewOpen(true)}
            className="absolute inset-0 flex items-center justify-center focus:outline-none"
            aria-label={isBn ? 'ভিডিও প্রিভিউ দেখুন' : 'Preview video'}
          >
            <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-black/40 backdrop-blur-md border border-white/25 text-white flex items-center justify-center shadow-md group-hover:scale-110 group-hover:bg-black/60 transition-all duration-300">
              <Play className="w-5 h-5 fill-white ml-0.5 text-white" />
            </div>
          </button>
        )}

        {/* Duration badge at bottom right */}
        {data.duration && (
          <div className="absolute bottom-2.5 right-2.5 bg-black/60 backdrop-blur-sm text-white text-[11px] font-sans px-2 py-0.5 rounded-md font-medium border border-white/10">
            {data.duration}
          </div>
        )}
      </div>

      {/* 2. Metadata Text (Title, platform name, Creator name) */}
      <div className="mt-4 mb-5 text-left space-y-1">
        <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug tracking-tight font-sans">
          {data.title}
        </h2>
        <div className="flex items-center flex-wrap gap-2 text-xs font-sans font-normal">
          <span className={`font-semibold px-2 py-0.5 rounded-md text-[11px] ${platformConfig.badgeBg}`}>
            {data.platform || platformConfig.name}
          </span>
          <span aria-hidden="true" className="text-slate-300">·</span>
          <span className="text-slate-600 font-medium">{data.author || 'Creator'}</span>
          {data.views && (
            <>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span className="text-slate-500">{data.views}</span>
            </>
          )}
        </div>
      </div>

      {/* Client-side merge error banner */}
      {mergeError && (
        <div className="mb-3 flex items-start gap-2 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 p-3 rounded-xl text-left">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{mergeError}</span>
        </div>
      )}

      {/* 3 & 4. Slim, Modern, Clean Download Cards Section */}
      <div className="space-y-2">
        {downloadOptions.map((opt) => {
          const isThisDownloading = downloadingType === opt.type;
          const isAnyClientMerging = downloadingType !== null && mergeProgress !== null;
          const showInlineProgress = isThisDownloading && mergeProgress !== null;

          const { targetFilename, finalDownloadUrl } = getOptionTarget(opt);
          const readyBlob = mergedBlobs[opt.type];
          const preparedUrl = preparedDownloads[opt.type];

          const isServerMerge = !opt.requiresClientMerge && finalDownloadUrl.includes('/api/merge?');
          const isReadyClientMerge = Boolean(opt.requiresClientMerge && readyBlob);
          const isReadyServerMerge = Boolean(isServerMerge && preparedUrl);
          const isDirectStream = !opt.requiresClientMerge && !isServerMerge;
          const isReadyToSave = isReadyClientMerge || isReadyServerMerge;
          const shouldRenderNativeAnchor =
            (isReadyToSave || isDirectStream) && !isAnyClientMerging;

          const anchorHref = readyBlob?.url || preparedUrl || finalDownloadUrl;
          const anchorFilename = readyBlob?.filename || targetFilename;
          const isBlobAnchor = anchorHref.startsWith('blob:');
          const isBackendAttachmentAnchor =
            anchorHref.startsWith('/') ||
            anchorHref.includes('/api/merge') ||
            anchorHref.includes('/api/proxy') ||
            anchorHref.includes('/api/download');

          const cardInner = (
            <>
              <div className="w-full flex items-center justify-between gap-3">
                {/* Left side: Clean Typography - Main Title & Subtitle */}
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="font-bold text-xs sm:text-sm text-slate-800 font-sans tracking-tight truncate">
                    {opt.mainTitle}
                  </span>
                  <span className="text-[11px] text-slate-500 font-normal font-sans mt-0.5 truncate">
                    {showInlineProgress
                      ? mergeProgress.message
                      : isReadyToSave
                      ? isBn
                        ? `${opt.format} • প্রস্তুত — সেভ করতে ক্লিক করুন`
                        : `${opt.format} • Ready — Click to Save`
                      : opt.subDetails}
                  </span>
                </div>

                {/* Right side: Minimalist Circular Action Button */}
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white group-hover:bg-slate-800 flex items-center justify-center shrink-0 transition-colors shadow-2xs">
                  {isThisDownloading ? (
                    <RefreshCw className="w-3.5 h-3.5 text-white animate-spin" />
                  ) : isReadyToSave ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <ArrowDown className="w-3.5 h-3.5 text-white group-hover:translate-y-0.5 transition-transform" />
                  )}
                </div>
              </div>

              {showInlineProgress && (
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-slate-900 rounded-full transition-all duration-200"
                    style={{ width: `${Math.max(5, Math.min(100, mergeProgress.percent))}%` }}
                  />
                </div>
              )}
            </>
          );

          const cardClasses =
            'w-full group relative overflow-hidden bg-slate-50 hover:bg-slate-100/90 active:bg-slate-200/80 disabled:opacity-80 disabled:cursor-not-allowed text-slate-900 px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl border border-slate-200/80 transition-all duration-200 flex flex-col gap-2 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 shadow-2xs cursor-pointer';

          if (shouldRenderNativeAnchor) {
            return (
              <a
                key={opt.type}
                href={anchorHref}
                download={isBlobAnchor ? anchorFilename : undefined}
                target={isBlobAnchor || isBackendAttachmentAnchor ? undefined : '_blank'}
                rel="noopener noreferrer"
                onClick={() => {
                  setMergeError(null);
                  onRecordDownload(opt.qualityLabel);
                  if (isBackendAttachmentAnchor) {
                    setDownloadingType(opt.type);
                    setTimeout(() => {
                      setDownloadingType((prev) => (prev === opt.type ? null : prev));
                    }, 3000);
                  }
                }}
                className={cardClasses}
              >
                {cardInner}
              </a>
            );
          }

          return (
            <button
              key={opt.type}
              type="button"
              onClick={() => handleDownload(opt)}
              disabled={isThisDownloading || isAnyClientMerging}
              className={cardClasses}
            >
              {cardInner}
            </button>
          );
        })}
      </div>

      {/* Footer Actions */}
      <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-sans">
        <button
          onClick={handleCopyLink}
          className="flex items-center gap-1.5 hover:text-slate-900 transition-colors font-medium"
        >
          {copiedLink ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-600 font-medium">
                {isBn ? 'ক্লিপবোর্ডে কপি হয়েছে!' : 'Copied to Clipboard!'}
              </span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>{isBn ? 'লিংক কপি করুন' : 'Copy Link'}</span>
            </>
          )}
        </button>

        <a
          href={previewVideoSrc || data.originalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 hover:text-slate-900 transition-colors font-medium text-slate-400 text-[11px]"
        >
          <ExternalLink className="w-3 h-3" />
          <span>{isBn ? 'ডিরেক্ট লিংক' : 'Direct Link'}</span>
        </a>
      </div>

      {/* Video Preview Modal */}
      <AnimatePresence>
        {isPreviewOpen && previewVideoSrc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setIsPreviewOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-2xl bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-800"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900">
                <div className="min-w-0 pr-3">
                  <span className="text-xs sm:text-sm font-medium text-white truncate block max-w-md">
                    {data.title}
                  </span>
                  {isPreviewVideoOnly && (
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      {isBn
                        ? 'মিউট প্রিভিউ — অডিওসহ সেভ করতে HD অপশন ডাউনলোড করুন'
                        : 'Muted preview — download an HD option to merge audio in your browser'}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setIsPreviewOpen(false)}
                  className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="aspect-video w-full bg-black relative flex items-center justify-center">
                <video
                  src={previewVideoSrc}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                  poster={data.thumbnail}
                >
                  {isBn
                    ? 'আপনার ব্রাউজার HTML ভিডিও প্লেব্যাক সমর্থন করে না।'
                    : 'Your browser does not support HTML video playback.'}
                </video>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
