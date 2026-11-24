'use client';

import React, { useState } from 'react';
import { Save, CheckCircle2, AlertCircle, Wrench } from 'lucide-react';
import type { CmsGlobalSettingsRecord } from '@/lib/cms-types';

interface GlobalSettingsClientProps {
  initialSettings: CmsGlobalSettingsRecord;
}

export function GlobalSettingsClient({ initialSettings }: GlobalSettingsClientProps) {
  const [form, setForm] = useState<CmsGlobalSettingsRecord>(initialSettings);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg('');
    setErrorMsg('');

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({
          siteName: form.siteName,
          logoUrl: form.logoUrl,
          faviconUrl: form.faviconUrl,
          defaultOgImage: form.defaultOgImage,
          headScripts: form.headScripts,
          bodyScripts: form.bodyScripts,
          maintenanceMode: form.maintenanceMode,
          maintenanceMessage: form.maintenanceMessage,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to update global settings.');
      }
      setForm(json.data);
      setStatusMsg('Global settings saved and public website cache revalidated.');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to save settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight text-balance">
            Global Site Settings
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Configure branding, verification & analytics scripts, and site-wide Maintenance Mode.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#1877F2] hover:bg-[#166fe5] rounded-lg transition-colors cursor-pointer disabled:opacity-60 whitespace-nowrap shrink-0 self-start sm:self-auto"
        >
          <Save className="w-3.5 h-3.5" />
          <span>{saving ? 'Saving...' : 'Save Global Settings'}</span>
        </button>
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

      {/* Maintenance Mode */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Maintenance Mode</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Temporarily display a maintenance screen to public visitors while keeping /admin accessible.
              </p>
            </div>
          </div>

          <label className="inline-flex items-center gap-2.5 cursor-pointer select-none shrink-0">
            <input
              type="checkbox"
              checked={form.maintenanceMode}
              onChange={(e) => setForm({ ...form, maintenanceMode: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-10 h-6 bg-slate-200 peer-checked:bg-amber-600 rounded-full relative transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-transform peer-checked:after:translate-x-4" />
            <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">
              {form.maintenanceMode ? 'Maintenance Active' : 'Public Site Online'}
            </span>
          </label>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">
            Public Maintenance Notice
          </label>
          <textarea
            rows={2}
            required
            value={form.maintenanceMessage}
            onChange={(e) => setForm({ ...form, maintenanceMessage: e.target.value })}
            className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1877F2]"
          />
        </div>
      </section>

      {/* Brand Identity */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <h2 className="text-base font-bold text-slate-900">Site Identity & Assets</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">Website Name</label>
            <input
              type="text"
              required
              value={form.siteName}
              onChange={(e) => setForm({ ...form, siteName: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1877F2]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">Logo URL</label>
            <input
              type="text"
              required
              value={form.logoUrl}
              onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:border-[#1877F2]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">Favicon URL</label>
            <input
              type="text"
              required
              value={form.faviconUrl}
              onChange={(e) => setForm({ ...form, faviconUrl: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:border-[#1877F2]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Default Open Graph Image URL
            </label>
            <input
              type="text"
              required
              value={form.defaultOgImage}
              onChange={(e) => setForm({ ...form, defaultOgImage: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:border-[#1877F2]"
            />
          </div>
        </div>
      </section>

      {/* Custom Head & Body Scripts */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div>
          <h2 className="text-base font-bold text-slate-900">Custom &lt;head&gt; & &lt;body&gt; Scripts</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Paste Google Analytics (gtag.js), Search Console verification meta tags, or footer scripts. Injected on public routes only.
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">
            &lt;head&gt; Scripts / Verification Meta Tags
          </label>
          <textarea
            rows={5}
            value={form.headScripts}
            onChange={(e) => setForm({ ...form, headScripts: e.target.value })}
            placeholder='<meta name="google-site-verification" content="..." />'
            className="w-full px-3.5 py-2.5 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:border-[#1877F2]"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">
            &lt;body&gt; Custom Scripts
          </label>
          <textarea
            rows={5}
            value={form.bodyScripts}
            onChange={(e) => setForm({ ...form, bodyScripts: e.target.value })}
            placeholder="<script>/* Analytics or custom tracking snippet */</script>"
            className="w-full px-3.5 py-2.5 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:border-[#1877F2]"
          />
        </div>
      </section>
    </form>
  );
}
