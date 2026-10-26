'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldCheck, FileText, Mail, CheckCircle2 } from 'lucide-react';

export type ModalType = 'privacy' | 'terms' | 'contact' | null;

interface PrivacyTermsModalProps {
  activeModal: ModalType;
  onClose: () => void;
}

export const PrivacyTermsModal: React.FC<PrivacyTermsModalProps> = ({
  activeModal,
  onClose,
}) => {
  const [sentMessage, setSentMessage] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [message, setMessage] = React.useState('');

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSentMessage(true);
    setTimeout(() => {
      setSentMessage(false);
      setEmail('');
      setMessage('');
      onClose();
    }, 2000);
  };

  return (
    <AnimatePresence>
      {activeModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 8 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl bg-white dark:bg-[#0F172A] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 relative overflow-hidden"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-5">
              <div className="flex items-center gap-2.5">
                {activeModal === 'privacy' && (
                  <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-[#1877F2]">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                )}
                {activeModal === 'terms' && (
                  <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-500">
                    <FileText className="w-5 h-5" />
                  </div>
                )}
                {activeModal === 'contact' && (
                  <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-500">
                    <Mail className="w-5 h-5" />
                  </div>
                )}

                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {activeModal === 'privacy' && 'Privacy Policy'}
                  {activeModal === 'terms' && 'Terms of Service'}
                  {activeModal === 'contact' && 'Contact Support'}
                </h3>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="max-h-[60vh] overflow-y-auto pr-1 text-sm text-slate-600 dark:text-slate-300 space-y-4 leading-relaxed">
              {activeModal === 'privacy' && (
                <>
                  <p>
                    Your privacy is paramount. <strong>SnapFB Video Downloader</strong> operates with strict zero-logging policies.
                  </p>
                  <div className="space-y-2.5 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                    <h4 className="font-semibold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                      Key Privacy Standards
                    </h4>
                    <ul className="list-disc pl-4 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                      <li>We do not log or store the URLs you paste on our servers.</li>
                      <li>Media downloads are fetched directly from content delivery networks (CDNs).</li>
                      <li>No personal cookies or identifying user tracking scripts are used.</li>
                      <li>Your browser session history remains strictly local on your device.</li>
                    </ul>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    This website is built to provide safe, direct, and ad-free access for saving personal public media.
                  </p>
                </>
              )}

              {activeModal === 'terms' && (
                <>
                  <p>
                    By using this service, you agree to comply with copyright laws and terms of digital content usage.
                  </p>
                  <div className="space-y-2.5 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                    <h4 className="font-semibold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                      Usage Terms & Guidelines
                    </h4>
                    <ul className="list-disc pl-4 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                      <li>Only download videos that you own or have explicit rights/permission to save.</li>
                      <li>Do not use fetched content for commercial redistribution or unauthorized copyright violation.</li>
                      <li>This platform is intended exclusively for non-commercial personal archive purposes.</li>
                    </ul>
                  </div>
                </>
              )}

              {activeModal === 'contact' && (
                <>
                  {sentMessage ? (
                    <div className="py-8 text-center space-y-3">
                      <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-500 flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white">
                        Message Sent Successfully
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                        Thank you for contacting us. Our team will review your inquiry shortly.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleContactSubmit} className="space-y-4">
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Have feedback, report an issue, or need assistance? Send us a direct message:
                      </p>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Your Email (Optional)
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="name@example.com"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-[#1877F2]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Message
                        </label>
                        <textarea
                          rows={4}
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          required
                          placeholder="Type your message or inquiry here..."
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-[#1877F2]"
                        />
                      </div>
                      <div className="pt-2 flex justify-end">
                        <button
                          type="submit"
                          className="px-5 py-2.5 rounded-xl bg-[#1877F2] hover:bg-[#166fe5] text-white text-xs font-bold transition-all shadow-md shadow-[#1877F2]/20"
                        >
                          Send Message
                        </button>
                      </div>
                    </form>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
