'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#F8FAFC] text-slate-900 text-center">
      <h2 className="text-2xl font-bold mb-2">404 - Page Not Found</h2>
      <p className="text-sm text-slate-500 mb-4">The page you are looking for does not exist.</p>
      <Link
        href="/"
        className="px-4 py-2 rounded-xl bg-[#1877F2] text-white text-xs font-bold hover:bg-[#166fe5] transition-colors"
      >
        Return Home
      </Link>
    </div>
  );
}
