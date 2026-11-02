'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#F8FAFC] text-slate-900 text-center">
      <h2 className="text-xl font-bold mb-2">Something went wrong!</h2>
      <button
        onClick={() => reset()}
        className="px-4 py-2 bg-[#1877F2] text-white rounded-xl font-medium text-xs hover:bg-[#166fe5]"
      >
        Try again
      </button>
    </div>
  );
}
