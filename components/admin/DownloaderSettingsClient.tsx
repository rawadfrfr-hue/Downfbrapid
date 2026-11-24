'use client';

import React, { useState } from 'react';
import { Save, CheckCircle2, AlertCircle, PauseCircle, Trash2 } from 'lucide-react';
import type { CmsPlatformConfigRecord, CmsPlatformKey } from '@/lib/cms-types';

interface DownloaderSettingsClientProps {
  initialConfigs: CmsPlatformConfigRecord[];
}

const PLATFORM_META: Record<
  CmsPlatformKey,
  { name: string; description: string; cookieHint: string }
> = {
  instagram: {
    name: 'Instagram',
    description: 'Controls Reels, IGTV, and feed video post extraction.',
    cookieHint: 'Paste Netscape cookie export or sessionid=...; csrftoken=... for private/rate-limited Reels.',
  },
  facebook: {
    name: 'Facebook',
    description: 'Controls public Watch, Reels, and fb.watch video extraction.',
    cookieHint: 'Paste Facebook c_user / xs cookies when GraphQL endpoints rate-limit anonymous requests.',
  },
  youtube: {
    name: 'YouTube',
    description: 'Controls standard 4K/1080p streams, Shorts, and MP3 audio extraction.',
    cookieHint: 'Optional Netscape youtube.com cookies to bypass bot-check challenges on cloud IPs.',
  },
  tiktok: {
    name: 'TikTok',
    description: 'Controls watermark-free Standard and High quality TikTok downloads.',
    cookieHint: 'Optional fallback cookies passed to yt-dlp when primary extractor is unavailable.',
  },
};

export function DownloaderSettingsClient({ initialConfigs }: DownloaderSettingsClientProps) {
  const [configs, setConfigs] = useState<CmsPlatformConfigRecord[]>(initialConfigs);
  const [savingKey, setSavingKey] = useState<CmsPlatformKey | null>(null);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const updateLocal = (
    platform: CmsPlatformKey,
    patch: Partial<CmsPlatformConfigRecord>
  ) => {
    setConfigs((prev) =>
      prev.map((item) => (item.platform === platform ? { ...item, ...patch } : item))
    );
  };

  const handleSavePlatform = async (cfg: CmsPlatformConfigRecord, clearCookies = false) => {
    setSavingKey(cfg.platform);
    setStatusMsg('');
    setErrorMsg('');

    try {
      const res = await fetch('/api/admin/platforms', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({
          platform: cfg.platform,
          isEnabled: cfg.isEnabled,
          cookies: cfg.cookies,
          clearCookies,
          proxyUrl: cfg.proxyUrl,
          userAgent: cfg.userAgent,
          statusNote: cfg.statusNote,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || `Failed to save ${cfg.platform} settings.`);
      }
      setConfigs((prev) =>
        prev.map((item) => (item.platform === cfg.platform ? json.data : item))
      );
      setStatusMsg(
        `Saved ${PLATFORM_META[cfg.platform].name} settings (${json.data.isEnabled ? 'Enabled' : 'Paused'}) and updated live API routes.`
      );
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to save platform settings.');
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight text-balance">
          Downloader & API Controls
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Toggle individual social platforms on or off and manage server-side Cookies and Proxy URLs forwarded to the extraction engine.
        </p>
      </div>

      {statusMsg && (
        <div className="flex items-center gap-2 text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 text-xs font-medium text-rose-800 bg-rose-50 border border-rose-200 rounded-lg px-4 py-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="space-y-6">
        {configs.map((cfg) => {
          const meta = PLATFORM_META[cfg.platform];
          const isSaving = savingKey === cfg.platform;
          return (
            <section
              key={cfg.platform}
              className="bg-white border border-slate-200 rounded-xl p-6 space-y-5"
            >
              {/* Platform Header + Toggle */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-base font-bold text-slate-900">{meta.name}</h2>
                    {cfg.isEnabled ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Active</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700">
                        <PauseCircle className="w-3.5 h-3.5" />
                        <span>Paused</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{meta.description}</p>
                </div>

                <label className="inline-flex items-center gap-2.5 cursor-pointer select-none shrink-0">
                  <input
                    type="checkbox"
                    checked={cfg.isEnabled}
                    onChange={(e) =>
                      updateLocal(cfg.platform, { isEnabled: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-10 h-6 bg-slate-200 peer-checked:bg-[#1877F2] rounded-full relative transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-transform peer-checked:after:translate-x-4" />
                  <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">
                    {cfg.isEnabled ? 'Downloader Enabled' : 'Temporarily Paused'}
                  </span>
                </label>
              </div>

              {/* Fields */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Proxy URL (Optional)
                  </label>
                  <input
                    type="text"
                    value={cfg.proxyUrl}
                    onChange={(e) =>
                      updateLocal(cfg.platform, { proxyUrl: e.target.value })
                    }
                    placeholder="http://username:password@proxy.example.com:8080"
                    className="w-full px-3.5 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:border-[#1877F2]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Paused Status Message (Shown when disabled)
                  </label>
                  <input
                    type="text"
                    value={cfg.statusNote}
                    onChange={(e) =>
                      updateLocal(cfg.platform, { statusNote: e.target.value })
                    }
                    placeholder={`${meta.name} downloads are temporarily paused for API maintenance.`}
                    className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#1877F2]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    Cookies (Netscape / Header String — Stored Server-Side)
                  </label>
                  {cfg.hasCookies && (
                    <button
                      type="button"
                      onClick={() => handleSavePlatform({ ...cfg, cookies: '' }, true)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-rose-700 hover:underline cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Clear Stored Cookies</span>
                    </button>
                  )}
                </div>
                <textarea
                  rows={3}
                  value={cfg.cookies}
                  onChange={(e) =>
                    updateLocal(cfg.platform, { cookies: e.target.value })
                  }
                  placeholder={meta.cookieHint}
                  className="w-full px-3.5 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:border-[#1877F2]"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-slate-400 font-mono tabular-nums">
                  Last updated: {new Date(cfg.updatedAt).toLocaleString()}
                </span>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => handleSavePlatform(cfg)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer disabled:opacity-60 whitespace-nowrap"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Saving...' : `Save ${meta.name}`}</span>
                </button>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
