'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Coffee, Heart, X, Check, Sparkles } from 'lucide-react';

interface BuyCoffeeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BuyCoffeeModal: React.FC<BuyCoffeeModalProps> = ({ isOpen, onClose }) => {
  const [selectedTier, setSelectedTier] = useState<number>(5);
  const [thankYou, setThankYou] = useState(false);

  const handleSupport = (amount: number) => {
    setSelectedTier(amount);
    setThankYou(true);
    setTimeout(() => {
      setThankYou(false);
      onClose();
    }, 2200);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-md flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-white dark:bg-[#0F172A] rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-center relative overflow-hidden"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {thankYou ? (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="py-8 space-y-3"
              >
                <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-500 flex items-center justify-center">
                  <Check className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Thank You So Much! ❤️
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                  Your ${selectedTier} support keeps SnapFB fast, ad-free, and free for everyone!
                </p>
              </motion.div>
            ) : (
              <>
                <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Coffee className="w-6 h-6" />
                </div>

                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Buy Me a Coffee
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-6">
                  SnapFB is 100% ad-free & fast. If this app helped you save videos, support developer servers!
                </p>

                {/* Tiers */}
                <div className="grid grid-cols-3 gap-2.5 mb-6">
                  {[3, 5, 10].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => handleSupport(amount)}
                      className={`py-3 px-2 rounded-2xl border text-sm font-bold transition-all transform-gpu hover:scale-105 active:scale-95 ${
                        selectedTier === amount
                          ? 'border-[#1877F2] bg-[#1877F2]/10 text-[#1877F2]'
                          : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <span>${amount}</span>
                      <span className="block text-[10px] font-normal text-slate-400 mt-0.5">
                        {amount === 3 ? '1 Coffee' : amount === 5 ? '2 Coffees' : 'Super Fan'}
                      </span>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => handleSupport(selectedTier)}
                  className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 transform-gpu hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Heart className="w-4 h-4 fill-current" />
                  <span>Support with ${selectedTier}</span>
                </button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
