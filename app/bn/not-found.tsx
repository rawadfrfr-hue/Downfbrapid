import Link from 'next/link';

export default function BnNotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#F8FAFC] text-slate-900 text-center">
      <h1 className="text-2xl font-bold mb-2">৪০৪ - পেজটি পাওয়া যায়নি</h1>
      <p className="text-sm text-slate-500 mb-4">আপনি যে পেজটি খুঁজছেন তা বিদ্যমান নেই বা সরানো হয়েছে।</p>
      <Link
        href="/bn"
        className="px-4 py-2 rounded-xl bg-[#1877F2] text-white text-xs font-bold hover:bg-[#166fe5] transition-colors"
      >
        হোম পেজে ফিরে যান
      </Link>
    </div>
  );
}
