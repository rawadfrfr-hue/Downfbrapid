import React from 'react';
import { Wrench } from 'lucide-react';

interface MaintenanceViewProps {
  siteName: string;
  message: string;
}

export function MaintenanceView({ siteName, message }: MaintenanceViewProps) {
  return (
    <main className="min-h-screen bg-[#F8FAFC] text-slate-900 flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-5 shadow-xs">
        <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto">
          <Wrench className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold text-amber-700 tracking-wide">
            Scheduled Maintenance · {siteName}
          </p>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight text-balance">
            We will be back shortly
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">{message}</p>
        </div>
      </div>
    </main>
  );
}
