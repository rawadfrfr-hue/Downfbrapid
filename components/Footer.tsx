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
    <footer className="w-full border-t border-slate-200 py-6 px-4 mt-auto bg-white">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        {/* Left copyright & security badge */}
        <div className="flex items-center flex-wrap gap-2">
          <span className="font-medium text-slate-700">© {new Date().getFullYear()} SaveVibe Downloader</span>
          <span aria-hidden="true">·</span>
          <span className="flex items-center gap-1 text-slate-600 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            100% Malware-Free & Secure
          </span>
          {totalDownloadsCount > 0 && (
            <>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-1 text-slate-500">
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
            className="hover:text-slate-900 transition-colors"
          >
            Privacy Policy
          </button>
          <span aria-hidden="true" className="text-slate-300">|</span>
          <button
            onClick={() => onOpenModal('terms')}
            className="hover:text-slate-900 transition-colors"
          >
            Terms of Service
          </button>
          <span aria-hidden="true" className="text-slate-300">|</span>
          <button
            onClick={() => onOpenModal('contact')}
            className="hover:text-slate-900 transition-colors"
          >
            Contact Us
          </button>
        </div>
      </div>
    </footer>
  );
};
