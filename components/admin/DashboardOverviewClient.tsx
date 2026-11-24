'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  RefreshCw,
  Trash2,
  Search,
  Copy,
  Check,
  AlertTriangle,
  CheckCircle2,
  PauseCircle,
  ExternalLink,
} from 'lucide-react';
import type { CmsPlatformKey, DashboardMetricsResponse } from '@/lib/cms-types';

interface DashboardOverviewClientProps {
  initialMetrics: DashboardMetricsResponse;
}

export function DashboardOverviewClient({ initialMetrics }: DashboardOverviewClientProps) {
  const [metrics, setMetrics] = useState<DashboardMetricsResponse>(initialMetrics);
  const [refreshing, setRefreshing] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState<'all' | CmsPlatformKey>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/admin/dashboard', { cache: 'no-store' });
      const json = await res.json();
      if (res.ok && json.success) {
        setMetrics(json.data);
      }
    } finally {
      setRefreshing(false);
    }
  };

  const handleClearFailed = async () => {
    setClearing(true);
    try {
      const res = await fetch('/api/admin/dashboard', {
        method: 'DELETE',
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setMetrics(json.data);
      }
    } finally {
      setClearing(false);
    }
  };

  const handleDeleteLog = async (id: string) => {
    const res = await fetch(`/api/admin/dashboard?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
    });
    const json = await res.json();
    if (res.ok && json.success) {
      setMetrics(json.data);
    }
  };

  const handleCopyUrl = async (id: string, url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {}
  };

  const filteredFailedLogs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return metrics.failedLogs.filter((log) => {
      if (platformFilter !== 'all' && log.platform !== platformFilter) return false;
      if (!q) return true;
      return (
        log.videoUrl.toLowerCase().includes(q) ||
        (log.errorMessage || '').toLowerCase().includes(q) ||
        (log.errorCode || '').toLowerCase().includes(q)
      );
    });
  }, [metrics.failedLogs, searchQuery, platformFilter]);

  return (
    <div className="space-y-8">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight text-balance">
            Operations Overview
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Monitor daily download volume, platform health, and extraction errors in real time.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh Metrics'}</span>
          </button>
        </div>
      </div>

      {/* 4-Column KPI Strip */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">Downloads Today</p>
          <p className="mt-2 text-3xl font-bold text-slate-900 font-mono tabular-nums">
            {metrics.todayDownloads.toLocaleString()}
          </p>
          <p className="mt-2 text-xs text-slate-500 font-mono tabular-nums">
            {metrics.todayFailed} failed today
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">Total Downloads</p>
          <p className="mt-2 text-3xl font-bold text-slate-900 font-mono tabular-nums">
            {metrics.totalDownloads.toLocaleString()}
          </p>
          <p className="mt-2 text-xs text-slate-500">All-time successful extractions</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">Extraction Success Rate</p>
          <p className="mt-2 text-3xl font-bold text-slate-900 font-mono tabular-nums">
            {metrics.successRate}%
          </p>
          <p className="mt-2 text-xs text-slate-500">Across enabled downloaders</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">Unresolved Failed Links</p>
          <p className="mt-2 text-3xl font-bold text-slate-900 font-mono tabular-nums">
            {metrics.failedLogs.length.toLocaleString()}
          </p>
          <p className="mt-2 text-xs text-slate-500">Logged extraction errors</p>
        </div>
      </section>

      {/* Platform Breakdown Table */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Platform Breakdown</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Download distribution and live extractor status across supported networks
            </p>
          </div>
          <Link
            href="/admin/downloader"
            className="text-xs font-semibold text-[#1877F2] hover:underline whitespace-nowrap shrink-0"
          >
            Manage Toggles & Proxies
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/60 text-xs font-semibold text-slate-600">
                <th className="py-3 px-6">Platform</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6 text-right">Today</th>
                <th className="py-3 px-6 text-right">Total Successful</th>
                <th className="py-3 px-6 text-right">Failed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {metrics.platformBreakdown.map((row) => (
                <tr key={row.platform} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-6 font-semibold text-slate-900">{row.label}</td>
                  <td className="py-3.5 px-6">
                    {row.isEnabled ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>Active</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700">
                        <PauseCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>Paused</span>
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-6 text-right font-mono tabular-nums text-slate-700">
                    {row.today.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-6 text-right font-mono tabular-nums font-semibold text-slate-900">
                    {row.success.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-6 text-right font-mono tabular-nums text-rose-700">
                    {row.failed.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Failed Links Log */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Failed Links Log</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Inspect failed video URLs and error messages to update cookies, proxies, or extractors
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search URL or error..."
                className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#1877F2]"
              />
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              {(['all', 'youtube', 'facebook', 'instagram', 'tiktok'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPlatformFilter(p)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors capitalize cursor-pointer whitespace-nowrap ${
                    platformFilter === p
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            {metrics.failedLogs.length > 0 && (
              <button
                type="button"
                onClick={handleClearFailed}
                disabled={clearing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{clearing ? 'Clearing...' : 'Clear All'}</span>
              </button>
            )}
          </div>
        </div>

        {filteredFailedLogs.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-900">No failed download links logged</p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Whenever a user submits a link that fails extraction, the URL, platform, and diagnostic error message will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/60 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-6">Platform</th>
                  <th className="py-3 px-6">Failed Video URL</th>
                  <th className="py-3 px-6">Error Details</th>
                  <th className="py-3 px-6">Timestamp</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {filteredFailedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-6 font-semibold text-slate-900 capitalize whitespace-nowrap">
                      {log.platform}
                    </td>
                    <td className="py-3.5 px-6 max-w-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-700 truncate block max-w-[240px]">
                          {log.videoUrl}
                        </span>
                        <a
                          href={log.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="Open source URL"
                          className="text-slate-400 hover:text-slate-700 shrink-0"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </td>
                    <td className="py-3.5 px-6 max-w-sm">
                      <div className="flex items-start gap-1.5 text-rose-700">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-medium">
                            {log.errorMessage || 'Unknown extraction error'}
                          </span>
                          {log.errorCode && (
                            <span className="block font-mono text-[11px] text-slate-500 mt-0.5">
                              Code: {log.errorCode} · Locale: {log.locale}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-6 font-mono tabular-nums text-slate-500 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-6 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleCopyUrl(log.id, log.videoUrl)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                          title="Copy URL"
                        >
                          {copiedId === log.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteLog(log.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                          title="Dismiss log"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
