'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowDown,
  Play,
  Check,
  Copy,
  RefreshCw,
  X,
} from 'lucide-react';
import { PLATFORMS, PlatformType } from '@/lib/platforms';

export interface VideoData {
  id: string;
  originalUrl: string;
  title: string;
  author: string;
  views: string;
  duration: string;
  thumbnail: string;
  platform?: string;
  qualities: {
    hd: {
      quality: string;
      url: string;
      downloadUrl: string;
      size: string;
      format: string;
    };
    sd: {
      quality: string;
      url: string;
      downloadUrl: string;
      size: string;
      format: string;
    };
    audio: {
      quality: string;
      url: string;
      downloadUrl: string;
      size: string;
      format: string;
    };
  };
}

interface ResultCardProps {
  data: VideoData;
  platform?: PlatformType;
  onReset: () => void;
  onRecordDownload: (quality: string) => void;
}

export const ResultCard: React.FC<ResultCardProps> = ({
  data,
  platform = 'facebook',
  onReset,
  onRecordDownload,
}) => {
  const platformConfig = PLATFORMS[platform] || PLATFORMS.facebook;
  const [copiedLink, setCopiedLink] = useState(false);
  const [downloadingType, setDownloadingType] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const handleDownload = (type: 'hd' | 'sd' | 'audio', downloadUrl: string, qualityLabel: string) => {
    setDownloadingType(type);
    onRecordDownload(qualityLabel);

    const fallbackDirectUrl =
      type === 'hd'
        ? data.qualities.hd.url
        : type === 'sd'
        ? data.qualities.sd.url
        : data.qualities.audio.url;

    const directCdnUrl = downloadUrl || fallbackDirectUrl;
    const safeExt = type === 'audio' ? '.mp3' : '.mp4';
    const targetFilename = `${data.title.replace(/[^\w\.-]/g, '_').slice(0, 30)}_${type}${safeExt}`;

    const link = document.createElement('a');
    link.href = directCdnUrl;
    link.target = '_blank';
    link.rel = 'noreferrer';
    link.setAttribute('download', targetFilename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setDownloadingType(null);
    }, 1200);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(data.originalUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const downloadOptions = [
    {
      type: 'hd' as const,
      label: 'MP4 - 1080p (Full HD)',
      size: data.qualities.hd.size,
      downloadUrl: data.qualities.hd.downloadUrl,
      qualityLabel: '1080p HD Video',
    },
    {
      type: 'sd' as const,
      label: 'MP4 - 720p (HD)',
      size: data.qualities.sd.size,
      downloadUrl: data.qualities.sd.downloadUrl,
      qualityLabel: '720p SD Video',
    },
    {
      type: 'audio' as const,
      label: 'MP3 - 320kbps (Audio)',
      size: data.qualities.audio.size,
      downloadUrl: data.qualities.audio.downloadUrl,
      qualityLabel: 'MP3 Audio Only',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.98 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-xl mx-auto mt-6 p-6 sm:p-8 rounded-2xl bg-white border border-slate-100 shadow-[0_12px_40px_rgba(15,23,42,0.08)] text-slate-900 transition-all"
    >
      {/* Top Header Row */}
      <div className="flex items-center justify-between gap-3 mb-5">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-sans">
          Download Options
        </span>
        <button
          onClick={onReset}
          className="text-xs font-medium text-slate-500 hover:text-slate-900 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors font-sans"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Fetch Another
        </button>
      </div>

      {/* 1. Video Preview Thumbnail */}
      <div className="relative w-full aspect-video rounded-[12px] overflow-hidden bg-slate-950 group shadow-sm border border-slate-100">
        <img
          src={data.thumbnail}
          alt={data.title}
          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500 ease-out"
          referrerPolicy="no-referrer"
        />

        {/* Soft overlay */}
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/35 transition-colors" />

        {/* Minimalist Centered Semi-Transparent Play Button */}
        <button
          onClick={() => setIsPreviewOpen(true)}
          className="absolute inset-0 flex items-center justify-center focus:outline-none"
          aria-label="Preview video"
        >
          <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-black/40 backdrop-blur-md border border-white/25 text-white flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-black/60 transition-all duration-300">
            <Play className="w-6 h-6 fill-white ml-0.5 text-white" />
          </div>
        </button>

        {/* Duration badge at bottom right */}
        {data.duration && (
          <div className="absolute bottom-2.5 right-2.5 bg-black/60 backdrop-blur-sm text-white text-[11px] font-sans px-2 py-0.5 rounded-md font-medium border border-white/10">
            {data.duration}
          </div>
        )}
      </div>

      {/* 2. Metadata Text (Title, platform name, Creator name) */}
      <div className="mt-5 mb-6 text-left space-y-1">
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

      {/* 3 & 4. Download Button Rows */}
      <div className="space-y-3">
        {downloadOptions.map((opt) => (
          <button
            key={opt.type}
            onClick={() => handleDownload(opt.type, opt.downloadUrl, opt.qualityLabel)}
            disabled={downloadingType === opt.type}
            className="w-full group bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white p-4 rounded-xl transition-all duration-200 flex items-center justify-between gap-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 shadow-sm disabled:opacity-80"
          >
            {/* Left side: Format & Quality, with File Size below */}
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-sm text-white font-sans">
                {opt.label}
              </span>
              <span className="text-[11px] text-slate-400 font-normal mt-0.5 font-sans">
                {opt.size}
              </span>
            </div>

            {/* Right side: Minimalist Down-Arrow Icon */}
            <div className="w-8 h-8 rounded-full bg-slate-800 group-hover:bg-slate-700 flex items-center justify-center shrink-0 transition-colors">
              {downloadingType === opt.type ? (
                <RefreshCw className="w-4 h-4 text-white animate-spin" />
              ) : (
                <ArrowDown className="w-4 h-4 text-white group-hover:translate-y-0.5 transition-transform" />
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Footer Copy Link Action */}
      <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-sans">
        <button
          onClick={handleCopyLink}
          className="flex items-center gap-1.5 hover:text-slate-900 transition-colors font-medium"
        >
          {copiedLink ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-600 font-medium">Copied to Clipboard!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Link</span>
            </>
          )}
        </button>
        <span className="text-slate-400 text-[11px]">HD Quality Direct Download</span>
      </div>

      {/* Video Preview Modal */}
      <AnimatePresence>
        {isPreviewOpen && (
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
                <span className="text-xs sm:text-sm font-medium text-white truncate max-w-md">
                  {data.title}
                </span>
                <button
                  onClick={() => setIsPreviewOpen(false)}
                  className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="aspect-video w-full bg-black relative flex items-center justify-center">
                <video
                  src={data.qualities.hd.url}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                  poster={data.thumbnail}
                >
                  Your browser does not support HTML video playback.
                </video>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
