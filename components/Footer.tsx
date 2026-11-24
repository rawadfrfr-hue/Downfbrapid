'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, Zap } from 'lucide-react';
import { ModalType, PrivacyTermsModal } from './PrivacyTermsModal';
import { Locale, getLocalizedPath } from '@/lib/i18n';

interface FooterProps {
  onOpenModal?: (type: ModalType) => void;
  totalDownloadsCount?: number;
  locale?: Locale;
  siteName?: string;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenModal,
  totalDownloadsCount = 0,
  locale = 'en',
  siteName = 'Save Vibe',
}) => {
  const [localContactOpen, setLocalContactOpen] = useState(false);
  const isBn = locale === 'bn';

  const handleOpenContact = () => {
    if (onOpenModal) {
      onOpenModal('contact');
    } else {
      setLocalContactOpen(true);
    }
  };

  return (
    <>
      <footer className="w-full border-t border-slate-200 py-6 px-4 mt-auto bg-white">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          {/* Left copyright & security badge */}
          <div className="flex items-center flex-wrap justify-center sm:justify-start gap-2">
            <span className="font-medium text-slate-700">
              {isBn ? `© ২০২৬ ${siteName}` : `© 2026 ${siteName}`}
            </span>
            <span aria-hidden="true">·</span>
            <span className="flex items-center gap-1 text-slate-600 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              {isBn ? '১০০% ম্যালওয়্যার-মুক্ত ও নিরাপদ' : '100% Malware-Free & Secure'}
            </span>
            {totalDownloadsCount > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span className="flex items-center gap-1 text-slate-500">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  {isBn
                    ? `এই সেশনে ${totalDownloadsCount}টি ডাউনলোড`
                    : `${totalDownloadsCount} Saved This Session`}
                </span>
              </>
            )}
          </div>

          {/* Right: Real crawlable legal page links + Contact */}
          <nav
            aria-label={isBn ? 'ফুটার আইনি নেভিগেশন' : 'Footer Legal Navigation'}
            className="flex items-center flex-wrap justify-center gap-3 text-xs font-medium"
          >
            <Link
              href={getLocalizedPath('/privacy-policy', locale)}
              className="hover:text-slate-900 transition-colors"
            >
              {isBn ? 'গোপনীয়তা নীতি' : 'Privacy Policy'}
            </Link>
            <span aria-hidden="true" className="text-slate-300">|</span>
            <Link
              href={getLocalizedPath('/terms-of-service', locale)}
              className="hover:text-slate-900 transition-colors"
            >
              {isBn ? 'ব্যবহারের শর্তাবলি' : 'Terms of Service'}
            </Link>
            <span aria-hidden="true" className="text-slate-300">|</span>
            <Link
              href={getLocalizedPath('/dmca', locale)}
              className="hover:text-slate-900 transition-colors"
            >
              {isBn ? 'DMCA নীতি' : 'DMCA'}
            </Link>
            <span aria-hidden="true" className="text-slate-300">|</span>
            <button
              type="button"
              onClick={handleOpenContact}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              {isBn ? 'যোগাযোগ' : 'Contact'}
            </button>
          </nav>
        </div>
      </footer>

      {!onOpenModal && (
        <PrivacyTermsModal
          activeModal={localContactOpen ? 'contact' : null}
          onClose={() => setLocalContactOpen(false)}
          locale={locale}
        />
      )}
    </>
  );
};
