'use client';

import React from 'react';
import { ShieldCheck, Zap } from 'lucide-react';
import { ModalType } from './PrivacyTermsModal';

interface FooterProps {
  onOpenModal: (type: ModalType) => void;
  totalDownloadsCount: number;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenModal,
  totalDownloadsCount,
}) => {
  return (
    <footer className="w-full border-t border-slate-200/60 dark:border-slate-800/60 py-6 px-4 mt-auto">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
        {/* Left copyright & security badge */}
        <div className="flex items-center flex-wrap gap-2">
          <span>© {new Date().getFullYear()} SnapFB Downloader</span>
          <span aria-hidden="true">·</span>
          <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            100% Malware-Free & Secure
          </span>
          {totalDownloadsCount > 0 && (
            <>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                {totalDownloadsCount} Saved This Session
              </span>
            </>
          )}
        </div>

        {/* Right: Standard Professional Links */}
        <div className="flex items-center gap-3 text-xs font-medium">
          <button
            onClick={() => onOpenModal('privacy')}
            className="hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Privacy Policy
          </button>
          <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">|</span>
          <button
            onClick={() => onOpenModal('terms')}
            className="hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Terms of Service
          </button>
          <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">|</span>
          <button
            onClick={() => onOpenModal('contact')}
            className="hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Contact Us
          </button>
        </div>
      </div>
    </footer>
  );
};
