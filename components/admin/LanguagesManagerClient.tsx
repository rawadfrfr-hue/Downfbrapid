'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Plus,
  Trash2,
  ExternalLink,
  CheckCircle2,
  PauseCircle,
  Edit3,
  Save,
  X,
  AlertCircle,
} from 'lucide-react';
import type { CmsLanguageRecord } from '@/lib/cms-types';

interface LanguagesManagerClientProps {
  initialLanguages: CmsLanguageRecord[];
}

const QUICK_PRESETS = [
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', hreflang: 'id', direction: 'ltr' as const },
  { code: 'es', name: 'Spanish', nativeName: 'Español', hreflang: 'es', direction: 'ltr' as const },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', hreflang: 'hi', direction: 'ltr' as const },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', hreflang: 'ar', direction: 'rtl' as const },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', hreflang: 'pt', direction: 'ltr' as const },
];

export function LanguagesManagerClient({ initialLanguages }: LanguagesManagerClientProps) {
  const [languages, setLanguages] = useState<CmsLanguageRecord[]>(initialLanguages);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [nativeName, setNativeName] = useState('');
  const [hreflang, setHreflang] = useState('');
  const [direction, setDirection] = useState<'ltr' | 'rtl'>('ltr');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editNativeName, setEditNativeName] = useState('');
  const [editHreflang, setEditHreflang] = useState('');

  const applyPreset = (preset: typeof QUICK_PRESETS[number]) => {
    setCode(preset.code);
    setName(preset.name);
    setNativeName(preset.nativeName);
    setHreflang(preset.hreflang);
    setDirection(preset.direction);
    setError('');
  };

  const refreshLanguages = async () => {
    const res = await fetch('/api/admin/languages', { cache: 'no-store' });
    const json = await res.json();
    if (res.ok && json.success) {
      setLanguages(json.data);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setStatusMessage('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/admin/languages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({
          code: code.trim().toLowerCase(),
          name: name.trim(),
          nativeName: nativeName.trim(),
          hreflang: (hreflang || code).trim().toLowerCase(),
          direction,
          isActive: true,
          sortOrder: languages.length,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to add language.');
      }
      await refreshLanguages();
      setCode('');
      setName('');
      setNativeName('');
      setHreflang('');
      setDirection('ltr');
      setStatusMessage(
        `Added "${json.data.name}" — route /${json.data.code} and hreflang="${json.data.hreflang}" are now live.`
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to add language.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (lang: CmsLanguageRecord) => {
    setError('');
    setStatusMessage('');
    const res = await fetch('/api/admin/languages', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: JSON.stringify({
        code: lang.code,
        isActive: !lang.isActive,
      }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      setError(json.error || 'Failed to update language status.');
      return;
    }
    await refreshLanguages();
    setStatusMessage(
      `${lang.name} (${lang.code}) is now ${!lang.isActive ? 'Active' : 'Inactive'}. Cache revalidated.`
    );
  };

  const startEdit = (lang: CmsLanguageRecord) => {
    setEditingCode(lang.code);
    setEditName(lang.name);
    setEditNativeName(lang.nativeName);
    setEditHreflang(lang.hreflang);
  };

  const handleSaveEdit = async (targetCode: string) => {
    setError('');
    const res = await fetch('/api/admin/languages', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: JSON.stringify({
        code: targetCode,
        name: editName.trim(),
        nativeName: editNativeName.trim(),
        hreflang: editHreflang.trim().toLowerCase(),
      }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      setError(json.error || 'Failed to save changes.');
      return;
    }
    setEditingCode(null);
    await refreshLanguages();
    setStatusMessage(`Updated language "${targetCode}" and revalidated hreflang metadata.`);
  };

  const handleDelete = async (targetCode: string) => {
    setError('');
    const res = await fetch(`/api/admin/languages?code=${encodeURIComponent(targetCode)}`, {
      method: 'DELETE',
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      setError(json.error || 'Failed to delete language.');
      return;
    }
    await refreshLanguages();
    setStatusMessage(`Removed language "${targetCode}" and updated sitemap.xml.`);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight text-balance">
          Multi-Language & International SEO
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Add, edit, or pause languages. Active languages automatically generate <code className="font-mono text-slate-800">/[lang]</code> routes, <code className="font-mono text-slate-800">hreflang</code> alternate tags, and <code className="font-mono text-slate-800">sitemap.xml</code> entries.
        </p>
      </div>

      {statusMessage && (
        <div className="flex items-center gap-2 text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-xs font-medium text-rose-800 bg-rose-50 border border-rose-200 rounded-lg px-4 py-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Languages Directory Table */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
          <h2 className="text-base font-bold text-slate-900">Configured Languages</h2>
          <span className="text-xs text-slate-500 font-mono tabular-nums">
            {languages.filter((l) => l.isActive).length} active / {languages.length} total
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/60 text-xs font-semibold text-slate-600">
                <th className="py-3 px-6">Language</th>
                <th className="py-3 px-6">ISO / hreflang</th>
                <th className="py-3 px-6">Live Route</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {languages.map((lang) => {
                const isEditing = editingCode === lang.code;
                const liveHref = lang.code === 'en' ? '/' : `/${lang.code}`;
                return (
                  <tr key={lang.code} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-6">
                      {isEditing ? (
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="px-2.5 py-1 text-xs border border-slate-300 rounded-md"
                            placeholder="Name"
                          />
                          <input
                            type="text"
                            value={editNativeName}
                            onChange={(e) => setEditNativeName(e.target.value)}
                            className="px-2.5 py-1 text-xs border border-slate-300 rounded-md"
                            placeholder="Native Name"
                          />
                        </div>
                      ) : (
                        <div>
                          <span className="font-semibold text-slate-900">{lang.nativeName}</span>
                          <span className="text-xs text-slate-500 ml-2">
                            {lang.name}
                            {lang.isDefault ? ' · Default' : ''}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-6 font-mono text-xs text-slate-700">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editHreflang}
                          onChange={(e) => setEditHreflang(e.target.value)}
                          className="w-24 px-2.5 py-1 text-xs border border-slate-300 rounded-md font-mono"
                        />
                      ) : (
                        <span>
                          {lang.code} · hreflang=&quot;{lang.hreflang}&quot; · {lang.direction.toUpperCase()}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-6">
                      <Link
                        href={liveHref}
                        target="_blank"
                        className="inline-flex items-center gap-1 font-mono text-xs text-[#1877F2] hover:underline"
                      >
                        <span>{liveHref}</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                    <td className="py-3.5 px-6">
                      <button
                        type="button"
                        disabled={lang.isDefault}
                        onClick={() => handleToggleActive(lang)}
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold cursor-pointer disabled:cursor-not-allowed ${
                          lang.isActive ? 'text-emerald-700' : 'text-amber-700'
                        }`}
                      >
                        {lang.isActive ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Active</span>
                          </>
                        ) : (
                          <>
                            <PauseCircle className="w-3.5 h-3.5" />
                            <span>Inactive</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-3.5 px-6 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        <Link
                          href={`/admin/content?lang=${encodeURIComponent(lang.code)}`}
                          className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                        >
                          Edit Content
                        </Link>
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(lang.code)}
                              className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-md cursor-pointer"
                              title="Save"
                            >
                              <Save className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingCode(null)}
                              className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-md cursor-pointer"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => startEdit(lang)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md cursor-pointer"
                            title="Edit language details"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {!lang.isDefault && (
                          <button
                            type="button"
                            onClick={() => handleDelete(lang.code)}
                            className="p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded-md cursor-pointer"
                            title="Delete language"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Add New Language Form */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">Add New Language Route</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Quick-fill a common locale or enter any custom ISO-639 code
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {QUICK_PRESETS.map((preset) => (
              <button
                key={preset.code}
                type="button"
                onClick={() => applyPreset(preset)}
                className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer whitespace-nowrap"
              >
                + {preset.name} ({preset.code})
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">Language Code</label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                if (!hreflang) setHreflang(e.target.value);
              }}
              placeholder="id, es, fr"
              className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:border-[#1877F2]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">English Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Indonesian"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1877F2]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">Native Name</label>
            <input
              type="text"
              required
              value={nativeName}
              onChange={(e) => setNativeName(e.target.value)}
              placeholder="Bahasa Indonesia"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1877F2]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">hreflang & Direction</label>
            <div className="flex gap-2">
              <input
                type="text"
                required
                value={hreflang}
                onChange={(e) => setHreflang(e.target.value)}
                placeholder="id"
                className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:border-[#1877F2]"
              />
              <select
                value={direction}
                onChange={(e) => setDirection(e.target.value as 'ltr' | 'rtl')}
                className="px-2.5 py-2 text-xs font-semibold border border-slate-200 rounded-lg bg-white"
              >
                <option value="ltr">LTR</option>
                <option value="rtl">RTL</option>
              </select>
            </div>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 py-2 px-4 bg-[#1877F2] hover:bg-[#166fe5] text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-60 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>{submitting ? 'Creating...' : 'Add Language'}</span>
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
