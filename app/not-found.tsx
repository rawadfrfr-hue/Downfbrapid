import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0B0F19] text-white flex flex-col items-center justify-center p-6 text-center">
      <h2 className="text-3xl font-bold mb-2">404 - Page Not Found</h2>
      <p className="text-slate-400 text-sm mb-6">The requested page does not exist.</p>
      <Link
        href="/"
        className="px-5 py-2.5 bg-[#1877F2] hover:bg-[#166fe5] text-white font-medium text-sm rounded-xl transition-colors"
      >
        Return Home
      </Link>
    </div>
  );
}
