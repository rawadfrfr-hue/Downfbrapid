'use client';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4 text-slate-900">
        <h2 className="text-xl font-bold mb-2">Something went wrong!</h2>
        <button
          onClick={() => reset()}
          className="px-4 py-2 bg-[#1877F2] text-white rounded-xl font-medium text-xs hover:bg-[#166fe5]"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
