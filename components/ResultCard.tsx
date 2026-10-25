'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Download,
  Play,
  Music,
  Video,
  Check,
  Copy,
  Sparkles,
  RefreshCw,
  ExternalLink,
  X,
  Eye,
  Clock,
  User,
} from 'lucide-react';

export interface VideoData {
  id: string;
  originalUrl: string;
  title: string;
  author: string;
  views: string;
  duration: string;
  thumbnail: string;
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
  onReset: () => void;
  onRecordDownload: (quality: string) => void;
}

export const ResultCard: React.FC<ResultCardProps> = ({
  data,
  onReset,
  onRecordDownload,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [downloadingQuality, setDownloadingQuality] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const handleDownload = (type: 'hd' | 'sd' | 'audio', downloadUrl: string, qualityLabel: string) => {
    setDownloadingQuality(type);
    onRecordDownload(qualityLabel);

    // Create a temporary anchor to trigger native browser file save dialog
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', '');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setDownloadingQuality(null);
    }, 1800);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(data.originalUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -15, scale: 0.97 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-2xl mx-auto mt-8 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0F172A] shadow-2xl shadow-slate-900/10 overflow-hidden relative transform-gpu"
    >
      {/* Top Bar with Fresh Status & Reset button */}
      <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/60 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Ready to Download
          </span>
        </div>
        <button
          onClick={onReset}
          className="text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Fetch Another
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-6 items-start">
        {/* Small Rounded Video Thumbnail Preview with Play Overlay */}
        <div className="relative w-full sm:w-44 aspect-video sm:aspect-square rounded-2xl overflow-hidden shrink-0 group border border-slate-200 dark:border-slate-800 bg-slate-900 shadow-md">
          {/* Thumbnail Image */}
          <img
            src={data.thumbnail}
            alt={data.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            referrerPolicy="no-referrer"
          />

          {/* Scrim Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

          {/* Duration Badge */}
          <div className="absolute bottom-2.5 right-2.5 bg-black/75 backdrop-blur-sm text-white text-[11px] font-mono px-2 py-0.5 rounded-md font-medium border border-white/10">
            {data.duration}
          </div>

          {/* Interactive Play Preview Button */}
          <button
            onClick={() => setIsPreviewOpen(true)}
            className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-white opacity-95 group-hover:scale-110 transition-transform duration-300 focus:outline-none"
            aria-label="Preview video"
          >
            <div className="w-12 h-12 rounded-full bg-[#1877F2]/90 hover:bg-[#1877F2] text-white flex items-center justify-center shadow-lg shadow-[#1877F2]/40 backdrop-blur-sm">
              <Play className="w-5 h-5 fill-current ml-0.5" />
            </div>
            <span className="text-[10px] font-medium tracking-wide bg-black/60 px-2 py-0.5 rounded-full backdrop-blur-xs mt-1">
              Preview
            </span>
          </button>
        </div>

        {/* Video Metadata & Download Buttons */}
        <div className="flex-1 w-full flex flex-col justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug tracking-tight line-clamp-2">
              {data.title}
            </h2>

            {/* Quiet metadata line with typographic separators */}
            <div className="flex items-center flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400 mt-2">
              <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                <User className="w-3 h-3 text-slate-400" />
                {data.author}
              </span>
              <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3 text-slate-400" />
                {data.views}
              </span>
              <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                {data.duration}
              </span>
            </div>
          </div>

          {/* Action Buttons Section */}
          <div className="space-y-3 mt-6">
            {/* Button 1: Download Video in HD Quality (Emerald Green #10B981) */}
            <button
              onClick={() => handleDownload('hd', data.qualities.hd.downloadUrl, '1080p HD Video')}
              className="w-full relative group overflow-hidden bg-[#10B981] hover:bg-[#059669] text-white font-semibold py-3.5 px-5 rounded-2xl shadow-lg shadow-[#10B981]/25 hover:shadow-xl hover:shadow-[#10B981]/35 transform-gpu hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-between text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981]"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  {downloadingQuality === 'hd' ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <Video className="w-4 h-4 text-white" />
                  )}
                </div>
                <div className="flex flex-col text-left">
                  <span className="font-bold leading-tight">Download Video in HD Quality</span>
                  <span className="text-[11px] font-normal text-emerald-100/90 leading-none mt-0.5">
                    1080p High Definition MP4
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-mono font-semibold bg-black/20 px-2.5 py-1 rounded-lg text-emerald-50 border border-white/10">
                  {data.qualities.hd.size}
                </span>
                <Download className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
              </div>
            </button>

            {/* Button 2: Download Video in Normal Quality (Metallic Silver/Gray #64748B) */}
            <button
              onClick={() => handleDownload('sd', data.qualities.sd.downloadUrl, '720p SD Video')}
              className="w-full relative group overflow-hidden bg-[#64748B] hover:bg-[#475569] text-white font-semibold py-3.5 px-5 rounded-2xl shadow-md shadow-[#64748B]/20 hover:shadow-lg hover:shadow-[#64748B]/30 transform-gpu hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-between text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#64748B]"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  {downloadingQuality === 'sd' ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <Video className="w-4 h-4 text-white" />
                  )}
                </div>
                <div className="flex flex-col text-left">
                  <span className="font-bold leading-tight">Download Video in Normal Quality</span>
                  <span className="text-[11px] font-normal text-slate-100/90 leading-none mt-0.5">
                    720p Standard MP4
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-mono font-semibold bg-black/20 px-2.5 py-1 rounded-lg text-slate-100 border border-white/10">
                  {data.qualities.sd.size}
                </span>
                <Download className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
              </div>
            </button>

            {/* Button 3: Download Audio Only (MP3) (Minimal border button) */}
            <button
              onClick={() => handleDownload('audio', data.qualities.audio.downloadUrl, 'MP3 Audio Only')}
              className="w-full group bg-slate-50 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold py-3 px-5 rounded-2xl transform-gpu hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-between text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center shrink-0 text-[#1877F2]">
                  {downloadingQuality === 'audio' ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-[#1877F2]" />
                  ) : (
                    <Music className="w-4 h-4 text-[#1877F2]" />
                  )}
                </div>
                <div className="flex flex-col text-left">
                  <span className="font-semibold leading-tight text-slate-900 dark:text-white">
                    Download Audio Only (MP3)
                  </span>
                  <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400 leading-none mt-0.5">
                    320kbps High Quality Audio
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-mono font-medium text-slate-600 dark:text-slate-400 bg-slate-200/80 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                  {data.qualities.audio.size}
                </span>
                <Download className="w-4 h-4 text-slate-500 group-hover:translate-y-0.5 transition-transform" />
              </div>
            </button>
          </div>

          {/* Secondary Copy Link Bar */}
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 hover:text-[#1877F2] dark:hover:text-[#1877F2] transition-colors font-medium"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400">Link Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Video URL</span>
                </>
              )}
            </button>
            <span className="text-[11px] text-slate-400 dark:text-slate-500">No ads · 100% Free</span>
          </div>
        </div>
      </div>

      {/* Video Preview Modal */}
      <AnimatePresence>
        {isPreviewOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
            onClick={() => setIsPreviewOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-3xl bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-800"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/90">
                <div className="flex items-center gap-2">
                  <Play className="w-4 h-4 text-[#1877F2]" />
                  <span className="text-sm font-semibold text-white truncate max-w-md">
                    {data.title}
                  </span>
                </div>
                <button
                  onClick={() => setIsPreviewOpen(false)}
                  className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Video Player */}
              <div className="aspect-video w-full bg-black relative flex items-center justify-center">
                <video
                  src={data.qualities.hd.url}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                  poster={data.thumbnail}
                >
                  Your browser does not support playing HTML video.
                </video>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
