'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldCheck, FileText, Mail, CheckCircle2 } from 'lucide-react';
import type { Locale } from '@/lib/i18n';

export type ModalType = 'privacy' | 'terms' | 'contact' | null;

interface PrivacyTermsModalProps {
  activeModal: ModalType;
  onClose: () => void;
  locale?: Locale;
}

export const PrivacyTermsModal: React.FC<PrivacyTermsModalProps> = ({
  activeModal,
  onClose,
  locale = 'en',
}) => {
  const isBn = locale === 'bn';
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
            className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 sm:p-7 relative overflow-hidden"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <div className="flex items-center gap-2.5">
                {activeModal === 'privacy' && (
                  <div className="p-2 rounded-xl bg-blue-50 text-[#1877F2]">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                )}
                {activeModal === 'terms' && (
                  <div className="p-2 rounded-xl bg-indigo-50 text-indigo-500">
                    <FileText className="w-5 h-5" />
                  </div>
                )}
                {activeModal === 'contact' && (
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-500">
                    <Mail className="w-5 h-5" />
                  </div>
                )}

                <h3 className="text-lg font-bold text-slate-900">
                  {activeModal === 'privacy' && (isBn ? 'গোপনীয়তা নীতি' : 'Privacy Policy')}
                  {activeModal === 'terms' && (isBn ? 'ব্যবহারের শর্তাবলি' : 'Terms of Service')}
                  {activeModal === 'contact' && (isBn ? 'Save Vibe সাপোর্টে যোগাযোগ' : 'Contact Save Vibe Support')}
                </h3>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                aria-label={isBn ? 'বন্ধ করুন' : 'Close dialog'}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="max-h-[60vh] overflow-y-auto pr-1 text-sm text-slate-600 space-y-4 leading-relaxed">
              {activeModal === 'privacy' && (
                isBn ? (
                  <>
                    <p>
                      আপনার গোপনীয়তা আমাদের কাছে সর্বোচ্চ অগ্রাধিকার। <strong>Save Vibe</strong> কঠোর জিরো-লগিং নীতিমালা অনুসরণ করে পরিচালিত হয়।
                    </p>
                    <div className="space-y-2.5 bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                      <h4 className="font-semibold text-slate-900 text-xs uppercase tracking-wider">
                        মূল গোপনীয়তা মানদণ্ড
                      </h4>
                      <ul className="list-disc pl-4 space-y-1.5 text-xs text-slate-600">
                        <li>আপনার পেস্ট করা কোনো ভিডিও লিংক আমাদের সার্ভারে সংরক্ষণ বা লগ করা হয় না।</li>
                        <li>মিডিয়া ফাইল সরাসরি সংশ্লিষ্ট কনটেন্ট ডেলিভারি নেটওয়ার্ক (CDN) থেকে আনা হয়।</li>
                        <li>কোনো ব্যক্তিগত ট্র্যাকিং কুকি বা পরিচয় শনাক্তকারী স্ক্রিপ্ট ব্যবহার করা হয় না।</li>
                        <li>ব্রাউজার সেশনের ইতিহাস কেবল আপনার নিজস্ব ডিভাইসেই সীমাবদ্ধ থাকে।</li>
                      </ul>
                    </div>
                    <p className="text-xs text-slate-500">
                      কোনো প্রশ্ন থাকলে যোগাযোগ করুন:{' '}
                      <a href="mailto:support@savevibe.bond" className="text-[#1877F2] font-medium hover:underline">
                        support@savevibe.bond
                      </a>
                      ।
                    </p>
                  </>
                ) : (
                  <>
                    <p>
                      Your privacy is paramount. <strong>Save Vibe</strong> operates with strict zero-logging policies.
                    </p>
                    <div className="space-y-2.5 bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                      <h4 className="font-semibold text-slate-900 text-xs uppercase tracking-wider">
                        Key Privacy Standards
                      </h4>
                      <ul className="list-disc pl-4 space-y-1.5 text-xs text-slate-600">
                        <li>We do not log or store the URLs you paste on our servers.</li>
                        <li>Media downloads are fetched directly from content delivery networks (CDNs).</li>
                        <li>No personal cookies or identifying user tracking scripts are used.</li>
                        <li>Your browser session history remains strictly local on your device.</li>
                      </ul>
                    </div>
                    <p className="text-xs text-slate-500">
                      Questions? Reach us at{' '}
                      <a href="mailto:support@savevibe.bond" className="text-[#1877F2] font-medium hover:underline">
                        support@savevibe.bond
                      </a>
                      .
                    </p>
                  </>
                )
              )}

              {activeModal === 'terms' && (
                isBn ? (
                  <>
                    <p>
                      Save Vibe ব্যবহারের মাধ্যমে আপনি কপিরাইট আইন ও ডিজিটাল কনটেন্ট ব্যবহারের শর্তাবলি মেনে চলতে সম্মত হচ্ছেন।
                    </p>
                    <div className="space-y-2.5 bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                      <h4 className="font-semibold text-slate-900 text-xs uppercase tracking-wider">
                        ব্যবহারের নিয়ম ও নির্দেশিকা
                      </h4>
                      <ul className="list-disc pl-4 space-y-1.5 text-xs text-slate-600">
                        <li>শুধুমাত্র নিজের মালিকানাধীন অথবা সংরক্ষণের অনুমতি রয়েছে এমন ভিডিও ডাউনলোড করুন।</li>
                        <li>ডাউনলোড করা কনটেন্ট বাণিজ্যিক পুনঃবিতরণ বা কপিরাইট লঙ্ঘনের কাজে ব্যবহার করবেন না।</li>
                        <li>এই টুলটি কেবল ব্যক্তিগত ও অ-বাণিজ্যিক অফলাইন সংরক্ষণের জন্য নির্মিত।</li>
                      </ul>
                    </div>
                  </>
                ) : (
                  <>
                    <p>
                      By using Save Vibe, you agree to comply with copyright laws and terms of digital content usage.
                    </p>
                    <div className="space-y-2.5 bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                      <h4 className="font-semibold text-slate-900 text-xs uppercase tracking-wider">
                        Usage Terms &amp; Guidelines
                      </h4>
                      <ul className="list-disc pl-4 space-y-1.5 text-xs text-slate-600">
                        <li>Only download videos that you own or have explicit rights/permission to save.</li>
                        <li>Do not use fetched content for commercial redistribution or unauthorized copyright violation.</li>
                        <li>This platform is intended exclusively for non-commercial personal archive purposes.</li>
                      </ul>
                    </div>
                  </>
                )
              )}

              {activeModal === 'contact' && (
                <>
                  {sentMessage ? (
                    <div className="py-8 text-center space-y-3">
                      <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 text-emerald-500 flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <h4 className="text-base font-bold text-slate-900">
                        {isBn ? 'বার্তা সফলভাবে পাঠানো হয়েছে' : 'Message Sent Successfully'}
                      </h4>
                      <p className="text-xs text-slate-500 max-w-xs mx-auto">
                        {isBn
                          ? 'Save Vibe-এর সাথে যোগাযোগ করার জন্য ধন্যবাদ। আমাদের টিম শীঘ্রই আপনার বার্তা পর্যালোচনা করবে।'
                          : 'Thank you for contacting Save Vibe. Our team will review your inquiry shortly.'}
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleContactSubmit} className="space-y-4">
                      <p className="text-xs text-slate-500">
                        {isBn ? 'কোনো মতামত, সমস্যা বা সহায়তার প্রয়োজন হলে সরাসরি ইমেইল করুন ' : 'Have feedback, report an issue, or need assistance? Email us directly at '}
                        <a
                          href="mailto:support@savevibe.bond"
                          className="font-semibold text-[#1877F2] hover:underline"
                        >
                          support@savevibe.bond
                        </a>{' '}
                        {isBn ? 'অথবা নিচে একটি সংক্ষিপ্ত বার্তা পাঠান:' : 'or send a quick note below:'}
                      </p>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          {isBn ? 'আপনার ইমেইল (ঐচ্ছিক)' : 'Your Email (Optional)'}
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="name@example.com"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-[#1877F2]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          {isBn ? 'বার্তা' : 'Message'}
                        </label>
                        <textarea
                          rows={4}
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          required
                          placeholder={isBn ? 'আপনার প্রশ্ন বা মতামত এখানে লিখুন...' : 'Type your message or inquiry here...'}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-[#1877F2]"
                        />
                      </div>
                      <div className="pt-2 flex justify-end">
                        <button
                          type="submit"
                          className="px-5 py-2.5 rounded-xl bg-[#1877F2] hover:bg-[#166fe5] text-white text-xs font-bold transition-all shadow-md shadow-[#1877F2]/20"
                        >
                          {isBn ? 'বার্তা পাঠান' : 'Send Message'}
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
