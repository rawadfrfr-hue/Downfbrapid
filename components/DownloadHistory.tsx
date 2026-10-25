'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { History, X, Trash2, ExternalLink, Play, Download, Video } from 'lucide-react';
import { VideoData } from './ResultCard';

interface DownloadHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  items: VideoData[];
  onClearHistory: () => void;
  onSelectVideo: (video: VideoData) => void;
}

export const DownloadHistory: React.FC<DownloadHistoryProps> = ({
  isOpen,
  onClose,
  items,
  onClearHistory,
  onSelectVideo,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end"
          onClick={onClose}
        >
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white dark:bg-[#0B0F19] h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col justify-between"
          >
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-[#1877F2]" />
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                  Recent Downloads
                </h3>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                aria-label="Close history drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                  <Video className="w-12 h-12 mb-3 stroke-[1.5] text-slate-300 dark:text-slate-700" />
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    No recent downloads yet
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    Fetched Facebook videos will be remembered here for quick access.
                  </p>
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      onSelectVideo(item);
                      onClose();
                    }}
                    className="group p-3 rounded-2xl border border-slate-200 dark:border-slate-800/80 hover:border-[#1877F2]/50 dark:hover:border-[#1877F2]/50 bg-slate-50 dark:bg-slate-900/60 hover:bg-white dark:hover:bg-slate-800 transition-all cursor-pointer flex items-center gap-3"
                  >
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="w-16 h-16 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-800"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-semibold text-slate-900 dark:text-white truncate group-hover:text-[#1877F2] transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {item.author} · {item.duration}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded font-medium">
                          1080p HD
                        </span>
                        <span className="text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded font-mono">
                          MP3
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer Clear Action */}
            {items.length > 0 && (
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                <button
                  onClick={onClearHistory}
                  className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 p-2.5 rounded-xl border border-rose-200 dark:border-rose-900/40 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear Download History
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
